import {defineField, defineType} from 'sanity'

import {statusField} from '../fields/status'
import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'

export const formType = defineType({
  name: 'form',
  title: 'Form',
  type: 'document',
  description: 'Stores HubSpot form IDs and optional overrides for embeddings on the site.',
  groups: editorialGroups,
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      description: 'Internal name for editors, e.g. “Contact Demo Form”.',
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    statusField,
    defineField({
      name: 'hubspotFormId',
      title: 'HubSpot Form ID',
      type: 'string',
      description: 'Found in HubSpot under Form actions > Embed code.',
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'portalIdOverride',
      title: 'Portal ID Override',
      type: 'string',
      description: 'Optional. Use only if this form lives in a different HubSpot portal than the site default.',
      group: ADVANCED_GROUP,
    }),
    defineField({
      name: 'regionOverride',
      title: 'Region Override',
      type: 'string',
      description: 'Optional. Override the HubSpot region (na1, na2, eu1, ap1) if this form belongs to a different cluster.',
      options: {
        list: [
          {title: 'North America 1 (NA1)', value: 'na1'},
          {title: 'North America 2 (NA2)', value: 'na2'},
          {title: 'Europe (EU1)', value: 'eu1'},
          {title: 'Asia Pacific (AP1)', value: 'ap1'},
        ],
      },
      group: ADVANCED_GROUP,
    }),
    defineField({
      name: 'successMessage',
      title: 'Success Message',
      type: 'text',
      rows: 2,
      description: 'Optional copy to show after submission if the frontend uses custom messaging.',
      group: ADVANCED_GROUP,
    }),
    defineField({
      name: 'notes',
      title: 'Internal Notes',
      type: 'text',
      rows: 3,
      description: 'Keep track of where this form is embedded or any follow-up workflow details.',
      group: ADVANCED_GROUP,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'hubspotFormId',
    },
    prepare({title, subtitle}) {
      return {
        title: title ?? 'Untitled Form',
        subtitle: subtitle ? `Form ID: ${subtitle}` : 'Missing HubSpot form ID',
      }
    },
  },
})
