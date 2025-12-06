import {defineField, defineType} from 'sanity'

import {blockMetaFields} from './base'

const displayTypeField = defineField({
  name: 'displayType',
  title: 'Display Type',
  type: 'string',
  description: 'Controls how the set renders on the page.',
  options: {
    list: [
      {title: 'Gallery', value: 'gallery'},
      {title: 'Splay', value: 'splay'},
    ],
    layout: 'radio',
  },
  initialValue: 'gallery',
  validation: (Rule) => Rule.required(),
});

const splayLimitField = defineField({
  name: 'splayLimit',
  title: 'Splay Item Limit',
  type: 'number',
  description: 'Maximum number of examples to layer within a splay.',
  initialValue: 5,
  validation: (Rule) => Rule.integer().min(2).max(8),
  hidden: ({parent}) => parent?.displayType !== 'splay',
});

const splayGapField = defineField({
  name: 'splayGap',
  title: 'Splay Gap',
  type: 'number',
  description: 'Horizontal gap percentage between cards. Negative numbers create overlap.',
  initialValue: 8,
  validation: (Rule) => Rule.min(-30).max(60),
  hidden: ({parent}) => parent?.displayType !== 'splay',
});

const setField = defineField({
  name: 'set',
  title: 'Set',
  type: 'reference',
  to: [{type: 'dynamicSet'}, {type: 'curatedSet'}],
  description: 'Choose which curated or dynamic set to display.',
  validation: (Rule) => Rule.required(),
});

const fallbackSetField = defineField({
  name: 'fallbackSet',
  title: 'Fallback Set',
  type: 'reference',
  to: [{type: 'dynamicSet'}, {type: 'curatedSet'}],
  description: 'Optional set used when the primary set has no approved items.',
});

export const displayContentFields = [
  displayTypeField,
  splayLimitField,
  splayGapField,
  setField,
  fallbackSetField,
] satisfies Array<ReturnType<typeof defineField>>;

export const displayBlockType = defineType({
  name: 'displayBlock',
  title: 'Display',
  type: 'object',
  fields: [...blockMetaFields, ...displayContentFields],
  preview: {
    select: {
      title: 'set.title',
      displayType: 'displayType',
    },
    prepare({title, displayType}) {
      return {
        title: title ? `${title}` : 'Untitled Display',
        subtitle: displayType ? `Display · ${displayType}` : 'Display block',
      }
    },
  },
})
