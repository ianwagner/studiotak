import {defineField} from 'sanity'

import {ESSENTIALS_GROUP} from '../utils/editorialGroups'

export const statusField = defineField({
  name: 'status',
  title: 'Status',
  type: 'string',
  description: 'Track where this content lives in the publishing process.',
  initialValue: 'draft',
  options: {
    list: [
      {title: 'Draft', value: 'draft'},
      {title: 'Approved', value: 'approved'},
      {title: 'Archived', value: 'archived'},
    ],
    layout: 'radio',
  },
  validation: (Rule) => Rule.required(),
  group: ESSENTIALS_GROUP,
})
