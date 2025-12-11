import type { DataProvider } from "@refinedev/core";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  getFirestore,
  addDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  documentId
} from "firebase/firestore";
import { getFirebaseApp } from "../firebaseClient";
import { normalizePageShape } from "../pageContent";
import type { PageRecord } from "./pages";
import { seedPages } from "./pages";
import type { ComponentRecord } from "./components";
import { normalizeComponentShape, seedComponents } from "./components";
import type { NavigationItemRecord } from "./navigation";
import { normalizeNavigationShape, seedNavigation } from "./navigation";
import { createPagesDataProvider } from "./dataProvider";
import { createComponentsDataProvider } from "./componentsDataProvider";
import { createNavigationDataProvider } from "./navigationDataProvider";

type ResourceKey = "pages" | "components" | "navigation";
type ResourceRecord = PageRecord | ComponentRecord | NavigationItemRecord;

const stripUndefined = <T,>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as unknown as T;
  }
  if (value && typeof value === "object") {
    return Object.entries(value as Record<string, any>).reduce((acc, [key, val]) => {
      if (val === undefined) return acc;
      (acc as any)[key] = stripUndefined(val);
      return acc;
    }, {} as any) as T;
  }
  return value;
};

export const createFirestoreDataProvider = (): DataProvider => {
  // If Firebase isn't configured, fall back to an in-memory provider so /admin still works.
  if (!process.env.NEXT_PUBLIC_FIREBASE_API_KEY) {
    const fallbackMap: Record<ResourceKey, DataProvider> = {
      pages: createPagesDataProvider(),
      components: createComponentsDataProvider(),
      navigation: createNavigationDataProvider()
    };
    return createDelegatingProvider(fallbackMap);
  }

  const db = getFirestore(getFirebaseApp());
  const fallbackMap: Record<ResourceKey, DataProvider> = {
    pages: createPagesDataProvider(),
    components: createComponentsDataProvider(),
    navigation: createNavigationDataProvider()
  };
  const collectionMap: Record<ResourceKey, string> = {
    pages: "pages",
    components: "components",
    navigation: "navigation"
  };
  const seedsMap: Record<ResourceKey, ResourceRecord[]> = {
    pages: seedPages,
    components: seedComponents,
    navigation: seedNavigation
  };
  const normalizerMap: Record<ResourceKey, (snapshot: any) => any> = {
    pages: (snapshot: any) => normalizePageShape({ id: snapshot.id, ...(snapshot.data() as Omit<PageRecord, "id">) }),
    components: (snapshot: any) =>
      normalizeComponentShape({ id: snapshot.id, ...(snapshot.data() as Omit<ComponentRecord, "id">) }),
    navigation: (snapshot: any) =>
      normalizeNavigationShape({ id: snapshot.id, ...(snapshot.data() as Omit<NavigationItemRecord, "id">) })
  };
  let firestoreBlocked: Partial<Record<ResourceKey, boolean>> = {};

  const orderByMap: Record<ResourceKey, { field: string; direction: "asc" | "desc" }> = {
    pages: { field: "title", direction: "asc" },
    components: { field: "title", direction: "asc" },
    navigation: { field: "order", direction: "asc" }
  };

  const seedFirestoreIfEmpty = async (resource: ResourceKey) => {
    const ref = collection(db, collectionMap[resource]);
    const { field, direction } = orderByMap[resource];
    const q = query(ref, orderBy(field, direction));
    const snapshot = await getDocs(q);
    if (!snapshot.empty || resource === "navigation") return snapshot;
    const seeds = seedsMap[resource];
    await Promise.all(seeds.map((record: any) => setDoc(doc(db, collectionMap[resource], record.id), stripUndefined(record))));
    return getDocs(q);
  };

  const isPermissionError = (error: any) => {
    const code = error?.code ?? error?.message ?? "";
    return code?.includes("permission-denied") || /insufficient permissions/i.test(String(code));
  };

  const handleFallback = async <T>(
    resource: ResourceKey,
    operation: keyof DataProvider,
    params: any,
    runner: () => Promise<T>
  ) => {
    const delegate = fallbackMap[resource][operation] as (arg: any) => Promise<T>;
    if (firestoreBlocked[resource]) return delegate(params);
    try {
      return await runner();
    } catch (error) {
      if (isPermissionError(error)) {
        firestoreBlocked[resource] = true;
      }
      console.warn(`Falling back to seed provider for ${String(operation)}`, error);
      return delegate(params);
    }
  };

  return {
    getList: async (params) => {
      const resource = resolveResource(params?.resource);
      return handleFallback(resource, "getList", params as any, async () => {
        const snapshot = await seedFirestoreIfEmpty(resource);
        const data = snapshot.docs.map((docSnap) => normalizerMap[resource](docSnap));
        return { data, total: data.length };
      });
    },
    getOne: async ({ id, resource, ...rest }) =>
      handleFallback(resolveResource(resource), "getOne", { id, resource, ...rest } as any, async () => {
        const resourceKey = resolveResource(resource);
        const ref = doc(db, collectionMap[resourceKey], String(id));
        const snapshot = await getDoc(ref);
        if (snapshot.exists()) return { data: normalizerMap[resourceKey](snapshot) };
        if (resourceKey !== "navigation") {
          const seed = (seedsMap[resourceKey] as any[]).find((item) => item.id === id);
          if (seed) {
            await setDoc(ref, seed);
            return { data: seed };
          }
        }
        throw new Error("Record not found");
      }),
    create: async (params) =>
      handleFallback(resolveResource(params?.resource), "create", params as any, async () => {
        const { variables, resource } = params;
        const resourceKey = resolveResource(resource);
        const payload = stripUndefined(variables as ResourceRecord);
        if (payload.id) {
          const ref = doc(db, collectionMap[resourceKey], payload.id);
          await setDoc(ref, payload);
          return { data: payload };
        }
        const ref = collection(db, collectionMap[resourceKey]);
        const created = await addDoc(ref, payload);
        const snapshot = await getDoc(created);
        return { data: normalizerMap[resourceKey](snapshot) };
      }),
    update: async (params) =>
      handleFallback(resolveResource(params?.resource), "update", params as any, async () => {
        const { id, variables, resource } = params;
        const resourceKey = resolveResource(resource);
        const ref = doc(db, collectionMap[resourceKey], String(id));
        await updateDoc(ref, stripUndefined(variables as Partial<ResourceRecord>));
        const snapshot = await getDoc(ref);
        return { data: normalizerMap[resourceKey](snapshot) };
      }),
    deleteOne: async (params) =>
      handleFallback(resolveResource(params?.resource), "deleteOne", params as any, async () => {
        const { id, resource } = params;
        const resourceKey = resolveResource(resource);
        const ref = doc(db, collectionMap[resourceKey], String(id));
        const snapshot = await getDoc(ref);
        await deleteDoc(ref);
        return { data: normalizerMap[resourceKey](snapshot) };
      }),
    getMany: async (params) =>
      handleFallback(resolveResource(params?.resource), "getMany", params as any, async () => {
        const { ids, resource } = params;
        const resourceKey = resolveResource(resource);
        if (!ids.length) return { data: [] };
        const idsList = ids.map(String);
        const ref = collection(db, collectionMap[resourceKey]);
        const q = query(ref, where(documentId(), "in", idsList));
        const snapshot = await getDocs(q);
        return { data: snapshot.docs.map((docSnap) => normalizerMap[resourceKey](docSnap)) };
      }),
    getApiUrl: () => "firebase"
  };
};

const resolveResource = (resource?: string): ResourceKey => {
  if (resource === "components") return "components";
  if (resource === "navigation") return "navigation";
  return "pages";
};

const createDelegatingProvider = (providers: Record<ResourceKey, DataProvider>): DataProvider => {
  const delegate = (resource: ResourceKey, method: keyof DataProvider, params: any) =>
    (providers[resource][method] as (arg: any) => Promise<any>)(params);
  return {
    getList: (params) => delegate(resolveResource(params?.resource), "getList", params),
    getOne: (params) => delegate(resolveResource(params?.resource), "getOne", params),
    create: (params) => delegate(resolveResource(params?.resource), "create", params),
    update: (params) => delegate(resolveResource(params?.resource), "update", params),
    deleteOne: (params) => delegate(resolveResource(params?.resource), "deleteOne", params),
    getMany: (params) => delegate(resolveResource(params?.resource), "getMany", params),
    getApiUrl: () => "memory"
  };
};
