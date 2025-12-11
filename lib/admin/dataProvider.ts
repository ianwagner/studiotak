import type { DataProvider } from "@refinedev/core";
import { seedPages, type PageRecord } from "./pages";

type UpdateVariables = Partial<Omit<PageRecord, "id">>;

const clone = <T,>(data: T): T => JSON.parse(JSON.stringify(data));

export const createPagesDataProvider = (): DataProvider => {
  let pages: PageRecord[] = clone(seedPages);

  const getIndex = (id: string) => pages.findIndex((page) => page.id === id);

  return {
    getList: async () => ({
      data: clone(pages),
      total: pages.length
    }),
    getOne: async ({ id }) => {
      const index = getIndex(String(id));
      if (index === -1) throw new Error("Page not found");
      return { data: clone(pages[index]) };
    },
    create: async ({ variables }) => {
      const record = { ...variables, id: variables?.id ?? crypto.randomUUID() } as PageRecord;
      pages.push(record);
      return { data: clone(record) };
    },
    update: async ({ id, variables }) => {
      const index = getIndex(String(id));
      if (index === -1) throw new Error("Page not found");
      const updated: PageRecord = { ...pages[index], ...(variables as UpdateVariables) };
      pages[index] = updated;
      return { data: clone(updated) };
    },
    deleteOne: async ({ id }) => {
      const index = getIndex(String(id));
      if (index === -1) throw new Error("Page not found");
      const [removed] = pages.splice(index, 1);
      return { data: clone(removed) };
    },
    getApiUrl: () => "pages-memory",
    getMany: async ({ ids }) => ({
      data: clone(pages.filter((page) => ids.map(String).includes(page.id)))
    })
  };
};
