import {defineArrayMember, defineField, defineType} from 'sanity'

import {
  blockMetaFields,
  bodyStyleField,
  createTokenField,
  headingStyleField,
} from './base'
import {stackSpacingTokenOptions} from './tokens'
import {portableTextBlock} from '../utils/portableText'

const textStackField = createTokenField({
  name: 'textStackToken',
  title: 'Text Stack Token',
  options: stackSpacingTokenOptions,
  initialValue: 'gm-spacing-relaxed-stack',
  description: 'Controls spacing between heading, body, and list items.',
})

export const splitBlockType = defineType({
  name: 'splitBlock',
  title: 'Split',
  type: 'object',
  fields: [
    ...blockMetaFields,
    headingStyleField,
    bodyStyleField,
    textStackField,
    defineField({
      name: 'layoutVariant',
      title: 'Layout Variant',
      type: 'string',
      options: {
        list: [
          {title: 'Media Right', value: 'mediaRight'},
          {title: 'Media Left', value: 'mediaLeft'},
        ],
        layout: 'radio',
      },
      initialValue: 'mediaRight',
    }),
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
      description: 'Optional label shown above the headline.',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [portableTextBlock],
    }),
    defineField({
      name: 'media',
      title: 'Media',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Describe the image for accessibility.',
          validation: (Rule) => Rule.required(),
        }),
      ],
    }),
    defineField({
      name: 'points',
      title: 'Key Points',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'point',
          title: 'Point',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'body',
              title: 'Body',
              type: 'text',
              rows: 3,
            }),
          ],
          preview: {
            select: {
              title: 'title',
              subtitle: 'body',
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      subtitle: 'layoutVariant',
    },
    prepare({title, subtitle}) {
      return {
        title: title ?? 'Split Block',
        subtitle: subtitle === 'mediaLeft' ? 'Media Left' : 'Media Right',
      }
    },
  },
})
