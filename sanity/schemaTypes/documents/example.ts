import {defineArrayMember, defineField, defineType} from 'sanity'

import {statusField} from '../fields/status'
import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'

export const exampleType = defineType({
  name: 'example',
  title: 'Example',
  type: 'document',
  initialValue: {
    status: 'draft',
  },
  groups: editorialGroups,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    statusField,
    defineField({
      name: 'media',
      title: 'Media',
      type: 'image',
      options: {
        hotspot: true,
      },
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'industries',
      title: 'Industries',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'industry'}],
        }),
      ],
      options: {
        layout: 'tags',
      },
      validation: (Rule) => Rule.unique(),
      group: ADVANCED_GROUP,
    }),
    defineField({
      name: 'personas',
      title: 'Personas',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'persona'}],
        }),
      ],
      options: {
        layout: 'tags',
      },
      validation: (Rule) => Rule.unique(),
      group: ADVANCED_GROUP,
    }),
    defineField({
      name: 'contentType',
      title: 'Content Type',
      type: 'reference',
      to: [{type: 'contentType'}],
      group: ADVANCED_GROUP,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'media',
    },
  },
})
