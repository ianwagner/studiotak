import {defineArrayMember, defineField, defineType} from 'sanity'

import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'

export const curatedSetType = defineType({
  name: 'curatedSet',
  title: 'Curated Set',
  type: 'document',
  description: 'Manual ordered list of content, ideal for storytelling moments that need editorial control.',
  groups: editorialGroups,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Name shown to editors, e.g. Beauty Highlights.',
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Optional guidance for when or how to use this curated list.',
      group: ADVANCED_GROUP,
    }),
    defineField({
      name: 'items',
      title: 'Items',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [
            {type: 'article'},
            {type: 'feature'},
            {type: 'example'},
          ],
        }),
      ],
      options: {
        sortable: true,
      },
      description: 'Drag to order exactly how the set should appear.',
      validation: (Rule) => Rule.required().min(1),
      group: ESSENTIALS_GROUP,
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        title: title ?? 'Untitled Curated Set',
      }
    },
  },
})
