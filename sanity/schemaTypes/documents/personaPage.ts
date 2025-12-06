import {defineField, defineType} from 'sanity'

import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'
import {portableTextBlock} from '../utils/portableText'
import {sectionBlockMembers} from '../utils/sectionBlocks'

export const personaPageType = defineType({
  name: 'personaPage',
  title: 'Persona Page',
  type: 'document',
  groups: editorialGroups,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Internal name for the page, e.g. Marketing Manager Overview.',
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
      name: 'persona',
      title: 'Persona',
      type: 'reference',
      to: [{type: 'persona'}],
      description: 'Connects this page to a Persona taxonomy entry for fallbacks and tagging.',
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'hero',
      title: 'Hero',
      type: 'object',
      fields: [
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
          description: 'Short supporting line or subheading.',
        }),
        defineField({
          name: 'body',
          title: 'Intro Copy',
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
          name: 'backgroundColor',
          title: 'Background Color',
          type: 'string',
          description: 'Optional hex color (e.g. #261AFF) shown behind the background image.',
          validation: (Rule) =>
            Rule.regex(/^#?([0-9a-fA-F]{3}|[0-9a-fA-F]{6})$/, {
              name: 'hex color',
            }).warning('Use a 3- or 6-digit hex value like #261AFF.'),
        }),
        defineField({
          name: 'backgroundImageOpacity',
          title: 'Image Transparency',
          type: 'number',
          description: '0 hides the background image, 100 keeps it fully visible.',
          initialValue: 100,
          validation: (Rule) => Rule.min(0).max(100),
          options: {range: {min: 0, max: 100, step: 5}} as unknown,
        }),
        defineField({
          name: 'backgroundImageBlur',
          title: 'Image Blur',
          type: 'number',
          description: 'Blur radius (in pixels) applied to the hero background image.',
          initialValue: 0,
          validation: (Rule) => Rule.min(0).max(40),
          options: {range: {min: 0, max: 40, step: 1}} as unknown,
        }),
      ],
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'blocks',
      title: 'Content Blocks',
      type: 'array',
      of: sectionBlockMembers,
      group: ADVANCED_GROUP,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'persona.label',
    },
    prepare({title, subtitle}) {
      return {
        title: title ?? 'Untitled Persona Page',
        subtitle,
      }
    },
  },
})
