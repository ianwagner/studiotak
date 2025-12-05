import {defineField, defineType} from 'sanity'

import {blockThemeField} from '../fields/blockTheme'
import {ESSENTIALS_GROUP, ADVANCED_GROUP, editorialGroups} from '../utils/editorialGroups'

export const errorPageType = defineType({
  name: 'errorPage',
  title: 'Error Page',
  type: 'document',
  groups: editorialGroups,
  options: {
    singleton: true,
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      validation: (Rule) => Rule.required().max(120),
      description: 'Primary message shown on the error screen.',
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'buttonLabel',
      title: 'Home Button Label',
      type: 'string',
      initialValue: 'Go back home',
      description: 'Text for the button that returns visitors to the homepage.',
      group: ESSENTIALS_GROUP,
    }),
    {
      ...blockThemeField,
      title: 'Theme Settings',
      description: 'Control the background and content palette for the error page.',
      group: ESSENTIALS_GROUP,
    },
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'image',
      description: 'Optional image displayed above the error heading.',
      options: {
        hotspot: false,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describe the icon for screen readers. Leave blank if decorative.',
          validation: (Rule) => Rule.max(120),
        }),
      ],
      group: ADVANCED_GROUP,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'heading',
      media: 'icon',
    },
    prepare({title, subtitle, media}) {
      return {
        title: title ?? 'Error Page',
        subtitle: subtitle ?? 'Customize the fallback experience',
        media,
      }
    },
  },
})
