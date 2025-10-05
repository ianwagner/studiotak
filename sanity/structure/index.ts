import type {StructureBuilder, StructureResolver} from 'sanity/structure'

type GroupConfig = {
  title: string
  types: Array<{schemaType: string; title: string}>
}

const createGroup = (S: StructureBuilder, {title, types}: GroupConfig) =>
  S.listItem()
    .title(title)
    .child(
      S.list()
        .title(title)
        .items(types.map(({schemaType, title: typeTitle}) => S.documentTypeListItem(schemaType).title(typeTitle))),
    )

const groups: GroupConfig[] = [
  {
    title: 'Pages',
    types: [
      {schemaType: 'page', title: 'All Pages'},
      {schemaType: 'industryPage', title: 'Industry Pages'},
      {schemaType: 'personaPage', title: 'Persona Pages'},
    ],
  },
  {
    title: 'Content',
    types: [
      {schemaType: 'article', title: 'Articles'},
      {schemaType: 'feature', title: 'Features'},
      {schemaType: 'example', title: 'Examples'},
    ],
  },
  {
    title: 'Sets',
    types: [
      {schemaType: 'dynamicSet', title: 'Dynamic Sets'},
      {schemaType: 'curatedSet', title: 'Curated Sets'},
    ],
  },
  {
    title: 'Taxonomies',
    types: [
      {schemaType: 'industry', title: 'Industries'},
      {schemaType: 'persona', title: 'Personas'},
      {schemaType: 'contentType', title: 'Content Types'},
    ],
  },
]

export const studioStructure: StructureResolver = (S) =>
  S.list()
    .title('Studio')
    .items(
      groups
        .map((group) => createGroup(S, group))
        .flatMap((item, index, array) =>
          index < array.length - 1 ? [item, S.divider()] : [item],
        ),
    )
