import {defineArrayMember, defineField} from 'sanity'

import {blockMetaFields} from '../blocks/base'

const setBlockMember = defineArrayMember({
  name: 'setBlock',
  title: 'Set Block',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Label shown above the set.',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'adGallery',
      title: 'Ad Gallery',
      type: 'boolean',
      description: 'Display this set as a responsive ad gallery carousel.',
      initialValue: false,
    }),
    ...blockMetaFields,
    defineField({
      name: 'set',
      title: 'Set',
      type: 'reference',
      to: [{type: 'dynamicSet'}, {type: 'curatedSet'}],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'fallbackSet',
      title: 'Fallback Set',
      type: 'reference',
      to: [{type: 'dynamicSet'}, {type: 'curatedSet'}],
      description: 'Optional set to use when the primary set resolves no approved items.',
    }),
  ],
  preview: {
    select: {
      title: 'title',
      setTitle: 'set.title',
    },
    prepare({title, setTitle}) {
      return {
        title: title ?? setTitle ?? 'Untitled Set Block',
      }
    },
  },
})

export const sectionBlockMembers = [
  defineArrayMember({type: 'heroBlock'}),
  defineArrayMember({type: 'splitBlock'}),
  defineArrayMember({type: 'thirdsBlock'}),
  defineArrayMember({type: 'featuresBlock'}),
  defineArrayMember({type: 'logoGridBlock'}),
  defineArrayMember({type: 'formBlock'}),
  defineArrayMember({type: 'footerBlock'}),
  setBlockMember,
  defineArrayMember({
    type: 'sharedBlockReference',
    title: 'Shared Block (Reference)',
  }),
]
