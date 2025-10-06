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

export const studioStructure: StructureResolver = (S) => {
  const groupedItems = groups
    .map((group) => createGroup(S, group))
    .flatMap((item, index, array) => (index < array.length - 1 ? [item, S.divider()] : [item]))

  return S.list()
    .title('Studio')
    .items([
      S.listItem()
        .title('Homepage')
        .schemaType('homepage')
        .child(S.document().schemaType('homepage').documentId('homepage')),
      S.divider(),
      S.listItem()
        .title('Site Settings')
        .schemaType('siteSettings')
        .child(S.document().schemaType('siteSettings').documentId('siteSettings')),
      S.divider(),
      S.listItem()
        .title('Navigation')
        .schemaType('navigation')
        .child(S.document().schemaType('navigation').documentId('navigation')),
      S.divider(),
      S.listItem()
        .title('Routes')
        .schemaType('route')
        .child(S.documentTypeList('route').title('Routes')),
      S.listItem()
        .title('Redirects')
        .schemaType('redirect')
        .child(S.documentTypeList('redirect').title('Redirects')),
      S.divider(),
      ...groupedItems,
    ])
}
