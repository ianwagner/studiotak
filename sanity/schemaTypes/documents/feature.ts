import {defineArrayMember, defineField, defineType} from 'sanity'

import {statusField} from '../fields/status'
import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'
import {portableTextBlock} from '../utils/portableText'

export const featureType = defineType({
  name: 'feature',
  title: 'Feature',
  type: 'document',
  initialValue: {
    status: 'draft',
  },
  groups: editorialGroups,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    statusField,
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
          description: 'Brief description of the media for accessibility.',
        }),
      ],
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'mediaDisplay',
      title: 'Media Display',
      type: 'string',
      description: 'Choose how the feature media should be rendered.',
      options: {
        list: [
          {title: 'Image', value: 'image'},
          {title: 'Icon', value: 'icon'},
        ],
        layout: 'radio',
      },
      initialValue: 'image',
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        portableTextBlock,
      ],
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'industries',
      title: 'Industries',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'industry'}],
        }),
      ],
      options: {
        layout: 'tags',
      },
      validation: (Rule) => Rule.unique(),
      group: ADVANCED_GROUP,
    }),
    defineField({
      name: 'personas',
      title: 'Personas',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'persona'}],
        }),
      ],
      options: {
        layout: 'tags',
      },
      validation: (Rule) => Rule.unique(),
      group: ADVANCED_GROUP,
    }),
    defineField({
      name: 'contentType',
      title: 'Content Type',
      type: 'reference',
      to: [{type: 'contentType'}],
      group: ADVANCED_GROUP,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      media: 'media',
    },
  },
})
