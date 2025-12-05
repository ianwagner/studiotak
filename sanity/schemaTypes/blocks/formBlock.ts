import {defineField, defineType} from 'sanity'

import {blockMetaFields} from './base'

export const formBlockType = defineType({
  name: 'formBlock',
  title: 'Form',
  type: 'object',
  fields: [
    ...blockMetaFields,
    defineField({
      name: 'form',
      title: 'Form',
      type: 'reference',
      to: [{type: 'form'}],
      validation: (Rule) => Rule.required(),
      description: 'Select which HubSpot form to embed on this page section.',
    }),
    defineField({
      name: 'heading',
      title: 'Heading',
      type: 'string',
      description: 'Optional headline shown above the form.',
    }),
    defineField({
      name: 'body',
      title: 'Body Copy',
      type: 'text',
      rows: 3,
      description: 'Optional supporting copy that appears above the form.',
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
      description: 'Image displayed alongside the form.',
    }),
  ],
  preview: {
    select: {
      title: 'heading',
      subtitle: 'form.title',
    },
    prepare({title, subtitle}) {
      return {
        title: title ?? subtitle ?? 'Form Block',
        subtitle: subtitle ? `Form: ${subtitle}` : 'Select a form to embed',
      }
    },
  },
})
