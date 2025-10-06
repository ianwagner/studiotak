import {defineArrayMember, defineField, defineType} from 'sanity'

import {
  blockMetaFields,
  bodyStyleField,
  createTokenField,
  headingStyleField,
} from './base'
import {gridSpacingTokenOptions, stackSpacingTokenOptions} from './tokens'
import {portableTextBlock} from '../utils/portableText'

const headerStackField = createTokenField({
  name: 'headerStackToken',
  title: 'Header Stack Token',
  options: stackSpacingTokenOptions,
  initialValue: 'gm-spacing-relaxed-stack',
  description: 'Controls spacing between the heading, intro, and supporting copy.',
})

const cardSpacingField = createTokenField({
  name: 'cardSpacingToken',
  title: 'Card Stack Token',
  options: stackSpacingTokenOptions,
  initialValue: 'gm-spacing-compact-stack',
  description: 'Spacing used inside each feature card.',
})

const gridSpacingField = createTokenField({
  name: 'gridSpacingToken',
  title: 'Grid Spacing Token',
  options: gridSpacingTokenOptions,
  initialValue: 'gm-spacing-grid',
  description: 'Gap applied between feature cards.',
})

export const featuresBlockType = defineType({
  name: 'featuresBlock',
  title: 'Features',
  type: 'object',
  fields: [
    ...blockMetaFields,
    headingStyleField,
    bodyStyleField,
    headerStackField,
    gridSpacingField,
    cardSpacingField,
    defineField({
      name: 'eyebrow',
      title: 'Eyebrow',
      type: 'string',
    }),
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'intro',
      title: 'Intro',
      type: 'array',
      of: [portableTextBlock],
    }),
    defineField({
      name: 'features',
      title: 'Features',
      type: 'array',
      validation: (Rule) => Rule.required().min(1),
      of: [
        defineArrayMember({
          name: 'feature',
          title: 'Feature',
          type: 'object',
          fields: [
            defineField({
              name: 'mediaDisplay',
              title: 'Media Display',
              type: 'string',
              description: 'Choose how to render the visual asset.',
              options: {
                list: [
                  {title: 'Image', value: 'image'},
                  {title: 'Icon', value: 'icon'},
                ],
                layout: 'radio',
              },
              initialValue: 'image',
            }),
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
              rows: 4,
            }),
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'string',
              description: 'Optional icon name from the design system.',
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
                  description: 'Briefly describe the image for accessibility.',
                }),
              ],
            }),
            defineField({
              name: 'link',
              title: 'Supporting Link',
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
              ],
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
      count: 'features.length',
    },
    prepare({title, count}) {
      return {
        title: title ?? 'Features Block',
        subtitle: count ? `${count} feature${count === 1 ? '' : 's'}` : undefined,
      }
    },
  },
})
