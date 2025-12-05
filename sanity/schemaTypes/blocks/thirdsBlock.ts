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

export const thirdsBlockType = defineType({
  name: 'thirdsBlock',
  title: 'Thirds',
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
      name: 'cta',
      title: 'Call to Action',
      type: 'object',
      description: 'Optional button rendered beneath the text content.',
      fields: [
        defineField({
          name: 'label',
          title: 'Label',
          type: 'string',
        }),
        defineField({
          name: 'href',
          title: 'Link',
          type: 'url',
          validation: (Rule) => Rule.uri({allowRelative: true}),
        }),
      ],
      options: {
        collapsible: true,
        collapsed: true,
      },
      validation: (Rule) =>
        Rule.custom((value) => {
          if (!value) {
            return true;
          }

          const label = typeof value.label === 'string' ? value.label.trim() : '';
          const hasLabel = label.length > 0;
          const hasHref = Boolean(value.href);

          if (hasLabel && !hasHref) {
            return 'Provide a link for the call to action.';
          }

          if (!hasLabel && hasHref) {
            return 'Provide a label for the call to action.';
          }

          return true;
        }),
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
      name: 'customMedia',
      title: 'Custom Embed',
      type: 'object',
      description:
        'Optional custom HTML/CSS/JS snippet. When provided, this will render instead of the image.',
      fields: [
        defineField({
          name: 'code',
          title: 'Embed Code',
          type: 'text',
          rows: 10,
          description: 'Paste raw markup such as iframe embeds or inline scripts.',
        }),
      ],
      options: {
        collapsible: true,
        collapsed: true,
      },
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
        title: title ?? 'Thirds Block',
        subtitle: subtitle === 'mediaLeft' ? 'Media Left' : 'Media Right',
      }
    },
  },
})
