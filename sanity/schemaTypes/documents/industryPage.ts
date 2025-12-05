import {defineField, defineType} from 'sanity'

import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'
import {portableTextBlock} from '../utils/portableText'
import {sectionBlockMembers} from '../utils/sectionBlocks'

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
