import {defineArrayMember, defineField, defineType} from 'sanity'

import {
  blockMetaFields,
  bodyStyleField,
  createTokenField,
  headingStyleField,
} from './base'
import {stackSpacingTokenOptions} from './tokens'
import {portableTextBlock} from '../utils/portableText'

const contentSpacingField = createTokenField({
  name: 'contentSpacing',
  title: 'Content Stack Token',
  options: stackSpacingTokenOptions,
  initialValue: 'gm-spacing-relaxed-stack',
  description: 'Controls spacing between hero title, tagline, and body copy.',
})

export const heroBlockType = defineType({
  name: 'heroBlock',
  title: 'Hero',
  type: 'object',
  fields: [
    ...blockMetaFields,
    headingStyleField,
    bodyStyleField,
    contentSpacingField,
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
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Optional supporting line that appears under the headline.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [portableTextBlock],
    }),
    defineField({
      name: 'backgroundMedia',
      title: 'Background Media',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description:
            'Describe the image for accessibility. Leave blank if the background is purely decorative.',
        }),
      ],
    }),
    defineField({
      name: 'actions',
      title: 'Calls to Action',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'action',
          title: 'Action',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'url',
              validation: (Rule) => Rule.required().uri({allowRelative: true}),
            }),
            defineField({
              name: 'isPrimary',
              title: 'Primary Action',
              type: 'boolean',
              initialValue: true,
              description: 'Primary actions render with the strongest button style.',
            }),
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'href',
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      subtitle: 'tagline',
    },
    prepare({title, subtitle}) {
      return {
        title: title ?? 'Hero Block',
        subtitle,
      }
    },
  },
})
