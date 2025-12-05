import {defineArrayMember, defineField, defineType} from 'sanity'

import {blockMetaFields, bodyStyleField, createTokenField, headingStyleField} from './base'
import {gridSpacingTokenOptions} from './tokens'
import {portableTextBlock} from '../utils/portableText'

const gridSpacingField = createTokenField({
  name: 'gridSpacingToken',
  title: 'Grid Spacing Token',
  options: gridSpacingTokenOptions,
  initialValue: 'gm-spacing-grid-tight',
  description: 'Controls the gap between logo tiles.',
})

export const logoGridBlockType = defineType({
  name: 'logoGridBlock',
  title: 'Logo Grid',
  type: 'object',
  fields: [
    ...blockMetaFields,
    headingStyleField,
    bodyStyleField,
    gridSpacingField,
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
    }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'array',
      of: [portableTextBlock],
    }),
    defineField({
      name: 'logos',
      title: 'Logos',
      type: 'array',
      validation: (Rule) => Rule.required().min(1),
      of: [
        defineArrayMember({
          name: 'logo',
          title: 'Logo',
          type: 'object',
          fields: [
            defineField({
              name: 'image',
              title: 'Image',
              type: 'image',
              validation: (Rule) => Rule.required(),
              options: {
                hotspot: true,
              },
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Alt Text',
                  type: 'string',
                  description: 'Short description for accessibility (e.g. company name).',
                  validation: (Rule) => Rule.max(120),
                }),
              ],
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'url',
              description: 'Optional link applied to the logo. Supports relative URLs.',
              validation: (Rule) => Rule.uri({allowRelative: true}),
            }),
          ],
          preview: {
            select: {
              title: 'image.asset.originalFilename',
              media: 'image',
              subtitle: 'href',
            },
            prepare({title, media, subtitle}) {
              return {
                title: title ?? 'Logo',
                media,
                subtitle,
              }
            },
          },
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      count: 'logos.length',
    },
    prepare({title, count}) {
      return {
        title: title ?? 'Logo Grid',
        subtitle: count ? `${count} logo${count === 1 ? '' : 's'}` : undefined,
      }
    },
  },
})
