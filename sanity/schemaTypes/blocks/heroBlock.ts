import {defineArrayMember, defineField, defineType} from 'sanity'

import {blockMetaFields, bodyStyleField, createTokenField, headingStyleField} from './base'
import {stackSpacingTokenOptions} from './tokens'
import {portableTextBlock} from '../utils/portableText'

const contentSpacingField = createTokenField({
  name: 'contentSpacing',
  title: 'Content Stack Token',
  options: stackSpacingTokenOptions,
  initialValue: 'gm-spacing-relaxed-stack',
  description: 'Controls spacing between hero title, tagline, and body copy.',
})

const heroMediaField = ({
  name,
  title,
  description,
  allowPoster = false,
}: {
  name: string
  title: string
  description?: string
  allowPoster?: boolean
}) => {
  const posterField = allowPoster
    ? defineField({
        name: 'posterImage',
        title: 'Poster Image',
        type: 'image',
        description: 'Optional fallback image shown while the video loads.',
        options: {
          hotspot: true,
        },
        hidden: ({parent}) => parent?.kind !== 'video',
      })
    : null

  return defineField({
    name,
    title,
    description,
    type: 'object',
    options: {
      collapsible: true,
      collapsed: true,
    },
    fields: [
      defineField({
        name: 'kind',
        title: 'Media Type',
        type: 'string',
        options: {
          layout: 'radio',
          list: [
            {title: 'Image', value: 'image'},
            {title: 'Video', value: 'video'},
          ],
        },
        initialValue: 'image',
        validation: (Rule) => Rule.required(),
      }),
      defineField({
        name: 'image',
        title: 'Image',
        type: 'image',
        options: {
          hotspot: true,
        },
        hidden: ({parent}) => parent?.kind !== 'image',
        fields: [
          defineField({
            name: 'alt',
            title: 'Alt Text',
            type: 'string',
            description: 'Describe the image for accessibility. Leave blank if decorative.',
          }),
        ],
        validation: (Rule) =>
          Rule.custom((value, context) => {
            if (context.parent?.kind === 'image') {
              return value ? true : 'Add an image.'
            }

            return true
          }),
      }),
      defineField({
        name: 'video',
        title: 'Video',
        type: 'file',
        options: {
          accept: 'video/mp4,video/webm,video/ogg',
        },
        hidden: ({parent}) => parent?.kind !== 'video',
        fields: [
          defineField({
            name: 'alt',
            title: 'Alt Text',
            type: 'string',
            description:
              'Describe the video for accessibility. Leave blank if the background or centerpiece is purely decorative.',
          }),
        ],
        validation: (Rule) =>
          Rule.custom((value, context) => {
            if (context.parent?.kind === 'video') {
              return value ? true : 'Add a video.'
            }

            return true
          }),
      }),
      ...(posterField ? [posterField] : []),
      defineField({
        name: 'autoplay',
        title: 'Autoplay',
        type: 'boolean',
        hidden: ({parent}) => parent?.kind !== 'video',
        initialValue: true,
      }),
      defineField({
        name: 'muted',
        title: 'Muted',
        type: 'boolean',
        hidden: ({parent}) => parent?.kind !== 'video',
        initialValue: true,
      }),
      defineField({
        name: 'loop',
        title: 'Loop',
        type: 'boolean',
        hidden: ({parent}) => parent?.kind !== 'video',
        initialValue: true,
      }),
      defineField({
        name: 'playsInline',
        title: 'Play Inline',
        type: 'boolean',
        hidden: ({parent}) => parent?.kind !== 'video',
        initialValue: true,
      }),
    ],
  })
}

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
      name: 'headlineLineOne',
      title: 'Headline — Line 1',
      type: 'string',
      description:
        'Optional override for the first line when displaying a centerpiece icon. Falls back to the first line of the Headline.',
    }),
    defineField({
      name: 'headlineLineTwo',
      title: 'Headline — Line 2',
      type: 'string',
      description:
        'Optional override for the second line when displaying a centerpiece icon. Falls back to the remaining Headline text.',
    }),
    defineField({
      name: 'tagline',
      title: 'Tagline',
      type: 'string',
      description: 'Optional supporting line that appears under the headline.',
    }),
    heroMediaField({
      name: 'centerpieceMedia',
      title: 'Centerpiece Media',
      description:
        'Optional icon or illustrative media rendered between headline lines. Works best with a transparent background.',
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [portableTextBlock],
    }),
    heroMediaField({
      name: 'backgroundMedia',
      title: 'Background Media',
      description: 'Image or looping video rendered behind the hero content.',
      allowPoster: true,
    }),
    defineField({
      name: 'backgroundImageOpacity',
      title: 'Image Transparency',
      type: 'number',
      description: 'Controls how opaque the background image is. 0 hides it, 100 keeps it fully visible.',
      initialValue: 100,
      validation: (Rule) => Rule.min(0).max(100),
      options: {
        range: {min: 0, max: 100, step: 5},
      },
    }),
    defineField({
      name: 'backgroundImageBlur',
      title: 'Image Blur',
      type: 'number',
      description: 'Apply a blur (in pixels) to soften the background image.',
      initialValue: 0,
      validation: (Rule) => Rule.min(0).max(40),
      options: {
        range: {min: 0, max: 40, step: 1},
      },
    }),
    defineField({
      name: 'backgroundColor',
      title: 'Background Color',
      type: 'string',
      description:
        'Optional hex color (e.g. #261AFF) used behind the background image. If no image is set, the hero uses this color.',
      validation: (Rule) =>
        Rule.regex(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
          name: 'hex color',
        }).warning('Use a 3- or 6-digit hex value like #261AFF.'),
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
            defineField({
              name: 'buttonTheme',
              title: 'Button Theme',
              type: 'string',
              initialValue: 'inherit',
              options: {
                layout: 'radio',
                list: [
                  {title: 'Inherit block theme', value: 'inherit'},
                  {title: 'Light', value: 'light'},
                  {title: 'Dark', value: 'dark'},
                  {title: 'Brand', value: 'brand'},
                  {title: 'System', value: 'system'},
                ],
              },
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
