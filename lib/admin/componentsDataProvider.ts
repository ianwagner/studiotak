import type { BaseRecord, DataProvider } from "@refinedev/core";
import { seedComponents, type ComponentRecord } from "./components";

type UpdateVariables = Partial<Omit<ComponentRecord, "id">>;

const clone = <T,>(data: T): T => JSON.parse(JSON.stringify(data));

export const createComponentsDataProvider = (): DataProvider => {
  let components: ComponentRecord[] = clone(seedComponents);

  const getIndex = (id: string) => components.findIndex((item) => item.id === id);

  const getList: DataProvider["getList"] = async <TData extends BaseRecord = BaseRecord>() =>
    ({
      data: clone(components) as unknown as TData[],
      total: components.length
    }) as any;

  const getOne = (async <TData extends BaseRecord = BaseRecord>({ id }: { id?: string | number }) => {
    const index = getIndex(String(id));
    if (index === -1) throw new Error("Component not found");
    return { data: clone(components[index]) as unknown as TData };
  }) satisfies DataProvider["getOne"];

  const create: DataProvider["create"] = async ({ variables }) => {
    const payload = variables as Partial<ComponentRecord>;
    const record = {
      ...(payload as ComponentRecord),
      id: payload?.id ?? crypto.randomUUID(),
      updatedAt: new Date().toISOString()
    } as ComponentRecord;
    components.push(record);
    return { data: clone(record) as any };
  };

  const update: DataProvider["update"] = async ({ id, variables }) => {
    const index = getIndex(String(id));
    if (index === -1) throw new Error("Component not found");
    const updated: ComponentRecord = { ...components[index], ...(variables as UpdateVariables), updatedAt: new Date().toISOString() };
    components[index] = updated;
    return { data: clone(updated) as any };
  };

  const deleteOne: DataProvider["deleteOne"] = async ({ id }) => {
    const index = getIndex(String(id));
    if (index === -1) throw new Error("Component not found");
    const [removed] = components.splice(index, 1);
    return { data: clone(removed) as any };
  };

  const getMany: NonNullable<DataProvider["getMany"]> = async ({ ids }) => ({
    data: clone(components.filter((component) => ids.map(String).includes(component.id))) as any
  });

  return {
    getList,
    getOne,
    create,
    update,
    deleteOne,
    getApiUrl: () => "components-memory",
    getMany
  };
};
