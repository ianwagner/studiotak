import {defineArrayMember, defineField, defineType} from 'sanity'

import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'
import {blockThemeField} from '../fields/blockTheme'

export const industryPageType = defineType({
  name: 'industryPage',
  title: 'Industry Page',
  type: 'document',
  groups: editorialGroups,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Internal name for the page, e.g. Beauty Industry.',
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
      name: 'industry',
      title: 'Industry',
      type: 'reference',
      to: [{type: 'industry'}],
      description: 'Connects this page to an Industry taxonomy entry for fallbacks and tagging.',
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
        defineField({
          name: 'headline',
          title: 'Headline',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'tagline',
          title: 'Tagline',
          type: 'string',
          description: 'Short supporting line or subheading.',
        }),
        defineField({
          name: 'body',
          title: 'Intro Copy',
          type: 'array',
          of: [defineArrayMember({type: 'block'})],
        }),
      ],
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'blocks',
      title: 'Content Blocks',
      type: 'array',
      of: [
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
            blockThemeField,
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
      subtitle: 'industry.label',
    },
    prepare({title, subtitle}) {
      return {
        title: title ?? 'Untitled Industry Page',
        subtitle,
      }
    },
  },
})
