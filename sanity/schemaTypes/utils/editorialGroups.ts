export const ESSENTIALS_GROUP = 'essentials' as const
export const ADVANCED_GROUP = 'advanced' as const

export const editorialGroups = [
  {name: ESSENTIALS_GROUP, title: 'Essentials', default: true},
  {name: ADVANCED_GROUP, title: 'Advanced'},
] as const

export type EditorialGroupName = (typeof editorialGroups)[number]['name']
