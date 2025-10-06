import {defineArrayMember, defineField, defineType} from 'sanity'

import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'
import {blockMetaFields} from '../blocks/base'

export const pageType = defineType({
  name: 'page',
  title: 'Page',
  type: 'document',
  groups: editorialGroups,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
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
      name: 'blocks',
      title: 'Content Blocks',
      type: 'array',
      of: [
        defineArrayMember({type: 'heroBlock'}),
        defineArrayMember({type: 'splitBlock'}),
        defineArrayMember({type: 'featuresBlock'}),
        defineArrayMember({
          name: 'setBlock',
          title: 'Set Block',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              description: 'Label shown above the set.',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'description',
              title: 'Description',
              type: 'text',
              rows: 3,
            }),
            ...blockMetaFields,
            defineField({
              name: 'set',
              title: 'Set',
              type: 'reference',
              to: [{type: 'dynamicSet'}, {type: 'curatedSet'}],
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'fallbackSet',
              title: 'Fallback Set',
              type: 'reference',
              to: [{type: 'dynamicSet'}, {type: 'curatedSet'}],
              description: 'Optional set to use when the primary set resolves no approved items.',
            }),
          ],
          preview: {
            select: {
              title: 'title',
              setTitle: 'set.title',
            },
            prepare({title, setTitle}) {
              return {
                title: title ?? setTitle ?? 'Untitled Set Block',
              }
            },
          },
        }),
      ],
      group: ADVANCED_GROUP,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'description',
    },
  },
})
