import {defineField, defineType} from 'sanity'

import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'

export const personaType = defineType({
  name: 'persona',
  title: 'Persona',
  type: 'document',
  groups: editorialGroups,
  fields: [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'label',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      group: ADVANCED_GROUP,
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      description: 'Optional emoji or icon keyword to visually represent the persona.',
      group: ADVANCED_GROUP,
    }),
  ],
  preview: {
    select: {
      title: 'label',
      icon: 'icon',
    },
    prepare({title, icon}) {
      const iconPrefix = icon ? `${icon} ` : ''
      return {
        title: `${iconPrefix}${title ?? 'Untitled'}`,
      }
    },
  },
})
