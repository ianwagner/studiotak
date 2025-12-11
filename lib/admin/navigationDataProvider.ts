import type { DataProvider } from "@refinedev/core";
import type { NavigationItemRecord } from "./navigation";

type UpdateVariables = Partial<Omit<NavigationItemRecord, "id">>;

const clone = <T,>(data: T): T => JSON.parse(JSON.stringify(data));
const sortNav = (items: NavigationItemRecord[]) =>
  [...items].sort((a, b) => (a.order ?? 0) - (b.order ?? 0) || a.label.localeCompare(b.label));

const resolveOrder = (value: any, fallback: number) => {
  const asNumber = Number(value);
  return Number.isFinite(asNumber) ? asNumber : fallback;
};

export const createNavigationDataProvider = (): DataProvider => {
  let links: NavigationItemRecord[] = [];

  const getIndex = (id: string) => links.findIndex((item) => item.id === id);

  const getList: DataProvider["getList"] = async () =>
    ({
      data: sortNav(links) as any,
      total: links.length
    }) as any;

  const getOne: DataProvider["getOne"] = async ({ id }) => {
      const index = getIndex(String(id));
      if (index === -1) throw new Error("Navigation link not found");
      return { data: clone(links[index]) as any };
    };

  const create: DataProvider["create"] = async ({ variables }) => {
      const record: NavigationItemRecord = {
        ...(variables as UpdateVariables),
        id: (variables as any)?.id ?? crypto.randomUUID(),
        order: resolveOrder((variables as any)?.order, links.length + 1),
        isExternal: Boolean((variables as any)?.isExternal),
        label: (variables as any)?.label ?? "Navigation link",
        href: (variables as any)?.href ?? "#",
        updatedAt: new Date().toISOString()
      };
      links.push(record);
      links = sortNav(links);
      return { data: clone(record) as any };
    };

  const update: DataProvider["update"] = async ({ id, variables }) => {
      const index = getIndex(String(id));
      if (index === -1) throw new Error("Navigation link not found");
      const updated: NavigationItemRecord = {
        ...links[index],
        ...(variables as UpdateVariables),
        order: resolveOrder((variables as any)?.order ?? links[index].order, links[index].order),
        isExternal: typeof (variables as any)?.isExternal === "boolean" ? Boolean((variables as any)?.isExternal) : links[index].isExternal,
        updatedAt: new Date().toISOString()
      };
      links[index] = updated;
      links = sortNav(links);
      return { data: clone(updated) as any };
    };

  const deleteOne: DataProvider["deleteOne"] = async ({ id }) => {
      const index = getIndex(String(id));
      if (index === -1) throw new Error("Navigation link not found");
      const [removed] = links.splice(index, 1);
      return { data: clone(removed) as any };
    };

  const getMany: NonNullable<DataProvider["getMany"]> = async ({ ids }) => ({
    data: clone(sortNav(links).filter((link) => ids.map(String).includes(link.id))) as any
  });

  return {
    getList,
    getOne,
    create,
    update,
    deleteOne,
    getMany,
    getApiUrl: () => "navigation-memory"
  };
};
