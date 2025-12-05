import {defineField, defineType} from 'sanity'

export const sharedBlockReferenceType = defineType({
  name: 'sharedBlockReference',
  title: 'Shared Block (Reference)',
  type: 'object',
  fields: [
    defineField({
      name: 'sharedBlock',
      title: 'Shared Block',
      type: 'reference',
      to: [{type: 'sharedBlock'}],
      validation: (Rule) => Rule.required(),
    }),
  ],
  preview: {
    select: {
      title: 'sharedBlock.internalTitle',
      description: 'sharedBlock.description',
    },
    prepare({title, description}) {
      return {
        title: title ? `Shared Block: ${title}` : 'Shared Block',
        subtitle: description ?? 'Reusable content',
      }
    },
  },
})

