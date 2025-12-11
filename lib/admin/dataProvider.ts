import type { DataProvider } from "@refinedev/core";
import { seedPages, type PageRecord } from "./pages";

type UpdateVariables = Partial<Omit<PageRecord, "id">>;

const clone = <T,>(data: T): T => JSON.parse(JSON.stringify(data));

export const createPagesDataProvider = (): DataProvider => {
  let pages: PageRecord[] = clone(seedPages);

  const getIndex = (id: string) => pages.findIndex((page) => page.id === id);

  const getList: DataProvider["getList"] = async () =>
    ({
      data: clone(pages) as any,
      total: pages.length
    }) as any;

  const getOne: DataProvider["getOne"] = async ({ id }) => {
      const index = getIndex(String(id));
      if (index === -1) throw new Error("Page not found");
      return { data: clone(pages[index]) as any };
    };

  const create: DataProvider["create"] = async ({ variables }) => {
      const payload = variables as Partial<PageRecord>;
      const record = {
        ...(payload as PageRecord),
        id: payload?.id ?? crypto.randomUUID()
      } as PageRecord;
      pages.push(record);
      return { data: clone(record) as any };
    };

  const update: DataProvider["update"] = async ({ id, variables }) => {
      const index = getIndex(String(id));
      // When Firestore denies writes we fall back to this in-memory provider, so if the
      // record isn't present (e.g. it only exists in Firestore) treat this as an upsert
      // instead of crashing the admin with a 404.
      if (index === -1) {
        const created: PageRecord = {
          ...(variables as UpdateVariables),
          id: String((variables as any)?.id ?? id ?? crypto.randomUUID())
        } as PageRecord;
        pages.push(created);
        return { data: clone(created) as any };
      }
      const updated: PageRecord = { ...pages[index], ...(variables as UpdateVariables) };
      pages[index] = updated;
      return { data: clone(updated) as any };
    };

  const deleteOne: DataProvider["deleteOne"] = async ({ id }) => {
      const index = getIndex(String(id));
      if (index === -1) throw new Error("Page not found");
      const [removed] = pages.splice(index, 1);
      return { data: clone(removed) as any };
    };

  const getMany: NonNullable<DataProvider["getMany"]> = async ({ ids }) => ({
    data: clone(pages.filter((page) => ids.map(String).includes(page.id))) as any
  });

  return {
    getList,
    getOne,
    create,
    update,
    deleteOne,
    getApiUrl: () => "pages-memory",
    getMany
  };
};
