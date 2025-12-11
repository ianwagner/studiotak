import type { DataProvider } from "@refinedev/core";
import { seedComponents, type ComponentRecord } from "./components";

type UpdateVariables = Partial<Omit<ComponentRecord, "id">>;

const clone = <T,>(data: T): T => JSON.parse(JSON.stringify(data));

export const createComponentsDataProvider = (): DataProvider => {
  let components: ComponentRecord[] = clone(seedComponents);

  const getIndex = (id: string) => components.findIndex((item) => item.id === id);

  return {
    getList: async () => ({
      data: clone(components),
      total: components.length
    }),
    getOne: async ({ id }) => {
      const index = getIndex(String(id));
      if (index === -1) throw new Error("Component not found");
      return { data: clone(components[index]) };
    },
    create: async ({ variables }) => {
      const record = { ...variables, id: variables?.id ?? crypto.randomUUID(), updatedAt: new Date().toISOString() } as ComponentRecord;
      components.push(record);
      return { data: clone(record) };
    },
    update: async ({ id, variables }) => {
      const index = getIndex(String(id));
      if (index === -1) throw new Error("Component not found");
      const updated: ComponentRecord = { ...components[index], ...(variables as UpdateVariables), updatedAt: new Date().toISOString() };
      components[index] = updated;
      return { data: clone(updated) };
    },
    deleteOne: async ({ id }) => {
      const index = getIndex(String(id));
      if (index === -1) throw new Error("Component not found");
      const [removed] = components.splice(index, 1);
      return { data: clone(removed) };
    },
    getApiUrl: () => "components-memory",
    getMany: async ({ ids }) => ({
      data: clone(components.filter((component) => ids.map(String).includes(component.id)))
    })
  };
};
