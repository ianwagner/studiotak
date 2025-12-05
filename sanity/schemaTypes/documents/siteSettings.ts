import {defineArrayMember, defineField, defineType} from 'sanity'

import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'

const svgFileField = (name: string, title: string, required = false) =>
  defineField({
    name,
    title,
    type: 'file',
    options: {
      accept: 'image/svg+xml',
    },
    validation: required ? (Rule) => Rule.required() : undefined,
  })

export const siteSettingsType = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  groups: editorialGroups,
  options: {
    singleton: true,
  },
  fields: [
    defineField({
      name: 'logoSet',
      title: 'Logo Set',
      type: 'object',
      group: ESSENTIALS_GROUP,
      fields: [
        svgFileField('primary', 'Primary Logo (SVG)', true),
        svgFileField('markOnly', 'Mark-Only Logo (SVG)'),
        defineField({
          name: 'rasterFallbacks',
          title: 'Raster Fallbacks',
          type: 'array',
          of: [
            defineArrayMember({
              name: 'rasterAsset',
              title: 'Raster Asset',
              type: 'image',
              options: {
                hotspot: false,
              },
            }),
          ],
          description: 'PNG or JPG alternatives for environments that cannot display SVG logos.',
        }),
        defineField({
          name: 'favicons',
          title: 'Favicons',
          type: 'array',
          of: [
            defineArrayMember({
              name: 'faviconAsset',
              title: 'Favicon',
              type: 'object',
              fields: [
                defineField({
                  name: 'file',
                  title: 'Icon File',
                  type: 'file',
                  options: {
                    accept: 'image/x-icon,image/png,image/svg+xml',
                  },
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'sizes',
                  title: 'Sizes',
                  type: 'string',
                  description: 'Value for the link sizes attribute, e.g. 16x16.',
                }),
                defineField({
                  name: 'type',
                  title: 'MIME Type',
                  type: 'string',
                  description: 'Value for the link type attribute, e.g. image/png.',
                }),
                defineField({
                  name: 'rel',
                  title: 'Relation',
                  type: 'string',
                  initialValue: 'icon',
                  description: 'Defaults to "icon". Override for special cases (e.g. shortcut icon).',
                }),
              ],
              preview: {
                select: {
                  title: 'sizes',
                  subtitle: 'type',
                },
                prepare({title, subtitle}) {
                  return {
                    title: title ? `Favicon ${title}` : 'Favicon',
                    subtitle: subtitle ?? 'icon',
                  }
                },
              },
            }),
          ],
        }),
        defineField({
          name: 'appIcons',
          title: 'App Icons',
          type: 'array',
          of: [
            defineArrayMember({
              name: 'appIconAsset',
              title: 'App Icon',
              type: 'object',
              fields: [
                defineField({
                  name: 'image',
                  title: 'Icon Image',
                  type: 'image',
                  options: {
                    hotspot: false,
                  },
                  validation: (Rule) => Rule.required(),
                }),
                defineField({
                  name: 'sizes',
                  title: 'Sizes',
                  type: 'string',
                  description: 'Value for the link sizes attribute, e.g. 180x180.',
                }),
                defineField({
                  name: 'rel',
                  title: 'Relation',
                  type: 'string',
                  initialValue: 'apple-touch-icon',
                  description: 'Defaults to "apple-touch-icon".',
                }),
                defineField({
                  name: 'type',
                  title: 'MIME Type',
                  type: 'string',
                  description: 'Optional type attribute value.',
                }),
              ],
              preview: {
                select: {
                  title: 'sizes',
                },
                prepare({title}) {
                  return {
                    title: title ? `App Icon ${title}` : 'App Icon',
                  }
                },
              },
            }),
          ],
          description: 'Icons used for device shortcuts such as Apple touch icons.',
        }),
        defineField({
          name: 'alt',
          title: 'Accessible Description',
          type: 'string',
          description: 'Screen reader text describing the primary logo.',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'minHeight',
          title: 'Minimum Height (px)',
          type: 'number',
          description: 'Recommended minimum rendered height for the logo.',
          validation: (Rule) => Rule.min(0).precision(0),
        }),
        defineField({
          name: 'clearSpaceNote',
          title: 'Clear Space Note',
          type: 'text',
          rows: 3,
          description: 'Guidelines for preserving clear space around the logo.',
        }),
      ],
      preview: {
        select: {
          subtitle: 'alt',
        },
        prepare({subtitle}) {
          return {
            title: 'Logo Set',
            subtitle: subtitle ?? 'No description set',
          }
        },
      },
    }),
    defineField({
      name: 'hubspotPortalId',
      title: 'HubSpot Portal ID',
      type: 'string',
      description: 'Default portal ID used when embedding HubSpot forms across the site.',
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'hubspotRegion',
      title: 'HubSpot Region',
      type: 'string',
      description: 'Cluster where the HubSpot account lives (used to load the correct embed script).',
      options: {
        list: [
          {title: 'North America 1 (NA1)', value: 'na1'},
          {title: 'North America 2 (NA2)', value: 'na2'},
          {title: 'Europe (EU1)', value: 'eu1'},
          {title: 'Asia Pacific (AP1)', value: 'ap1'},
        ],
      },
      initialValue: 'na1',
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'notes',
      title: 'General Notes',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'block',
        }),
      ],
      group: ADVANCED_GROUP,
    }),
    defineField({
      name: 'defaultFooter',
      title: 'Default Footer',
      description: 'Select a shared block that should be appended to every page.',
      type: 'reference',
      to: [{type: 'sharedBlock'}],
      group: ADVANCED_GROUP,
    }),
  ],
  preview: {
    select: {
      subtitle: 'logoSet.alt',
    },
    prepare({subtitle}) {
      return {
        title: 'Site Settings',
        subtitle: subtitle ?? 'Logo description not set',
      }
    },
  },
})
