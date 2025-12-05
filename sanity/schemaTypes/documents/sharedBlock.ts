import {defineField, defineType} from 'sanity'

import {sectionBlockMembers} from '../utils/sectionBlocks'

export const sharedBlockType = defineType({
  name: 'sharedBlock',
  title: 'Shared Block',
  type: 'document',
  fields: [
    defineField({
      name: 'internalTitle',
      title: 'Internal Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
      description: 'Optional note for editors describing when to use this shared block.',
    }),
    defineField({
      name: 'blocks',
      title: 'Blocks',
      type: 'array',
      of: sectionBlockMembers,
      validation: (Rule) =>
        Rule.required().min(1).error('Add at least one block so the shared block has content.'),
    }),
  ],
  preview: {
    select: {
      title: 'internalTitle',
      subtitle: 'description',
    },
    prepare({title, subtitle}) {
      return {
        title: title ?? 'Untitled Shared Block',
        subtitle: subtitle ?? 'Reusable block group',
      }
    },
  },
})

