import {defineArrayMember, defineField, defineType} from 'sanity'

import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'

export const dynamicSetType = defineType({
  name: 'dynamicSet',
  title: 'Dynamic Set',
  type: 'document',
  description:
    'Configurable collection that resolves content by filters, ordering, and optional pinned items.',
  initialValue: {
    statusFilter: 'approved',
    sortOrder: 'newestFirst',
    fallbackMode: 'strict',
  },
  groups: editorialGroups,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Human-friendly name, e.g. Beauty Examples.',
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Optional context for editors about how this set should be used.',
      group: ADVANCED_GROUP,
    }),
    defineField({
      name: 'statusFilter',
      title: 'Status Filter',
      type: 'string',
      readOnly: true,
      options: {
        list: [{title: 'Approved', value: 'approved'}],
      },
      description: 'Dynamic sets only resolve content that has been approved.',
      group: ADVANCED_GROUP,
    }),
    defineField({
      name: 'filters',
      title: 'Filters',
      type: 'object',
      fields: [
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
          options: {layout: 'tags'},
          validation: (Rule) => Rule.unique(),
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
          options: {layout: 'tags'},
          validation: (Rule) => Rule.unique(),
        }),
        defineField({
          name: 'contentTypes',
          title: 'Content Types',
          type: 'array',
          of: [
            defineArrayMember({
              type: 'reference',
              to: [{type: 'contentType'}],
            }),
          ],
          options: {layout: 'tags'},
          validation: (Rule) => Rule.unique(),
        }),
      ],
      group: ADVANCED_GROUP,
    }),
    defineField({
      name: 'limit',
      title: 'Limit',
      type: 'number',
      description: 'Maximum number of items returned after pins are applied.',
      validation: (Rule) => Rule.required().integer().min(1).max(50),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'sortOrder',
      title: 'Sort',
      type: 'string',
      options: {
        list: [
          {title: 'Newest first', value: 'newestFirst'},
          {title: 'Oldest first', value: 'oldestFirst'},
          {title: 'Alphabetical (A→Z)', value: 'alphabeticalAsc'},
          {title: 'Random', value: 'random'},
        ],
      },
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'pins',
      title: 'Pins',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [
            {type: 'article'},
            {type: 'feature'},
            {type: 'example'},
          ],
          options: {
            filter: 'status == "approved"',
          },
        }),
      ],
      description: 'Items to force include before applying dynamic results. Ordered list.',
      validation: (Rule) => Rule.unique(),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'fallbackMode',
      title: 'Fallback Mode',
      type: 'string',
      options: {
        list: [
          {
            title: 'Strict (no fallback)',
            value: 'strict',
          },
          {
            title: 'Use pins only if filters empty',
            value: 'pinsOnly',
          },
          {
            title: 'Allow any approved content to fill remaining slots',
            value: 'anyApproved',
          },
        ],
        layout: 'radio',
      },
      validation: (Rule) => Rule.required(),
      group: ADVANCED_GROUP,
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare({title}) {
      return {
        title: title ?? 'Untitled Dynamic Set',
      }
    },
  },
})
