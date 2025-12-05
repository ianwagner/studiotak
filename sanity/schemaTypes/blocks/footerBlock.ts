import {defineArrayMember, defineField, defineType} from 'sanity'

import {
  blockMetaFields,
  bodyStyleField,
  createTokenField,
  headingStyleField,
} from './base'
import {gridSpacingTokenOptions, stackSpacingTokenOptions} from './tokens'

const contentStackField = createTokenField({
  name: 'contentStackToken',
  title: 'Content Stack Token',
  options: stackSpacingTokenOptions,
  initialValue: 'gm-spacing-relaxed-stack',
  description: 'Controls spacing between the headline, CTA, and navigation rows.',
})

const navigationGridField = createTokenField({
  name: 'gridSpacingToken',
  title: 'Navigation Grid Token',
  options: gridSpacingTokenOptions,
  initialValue: 'gm-spacing-grid',
  description: 'Gap applied between navigation columns.',
})

export const footerBlockType = defineType({
  name: 'footerBlock',
  title: 'Footer',
  type: 'object',
  fields: [
    ...blockMetaFields,
    headingStyleField,
    bodyStyleField,
    contentStackField,
    navigationGridField,
    defineField({
      name: 'headline',
      title: 'Headline',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'cta',
      title: 'Primary Call to Action',
      type: 'object',
      validation: (Rule) => Rule.required(),
      fields: [
        defineField({
          name: 'label',
          title: 'Label',
          type: 'string',
          validation: (Rule) => Rule.required(),
        }),
        defineField({
          name: 'href',
          title: 'Link',
          type: 'url',
          validation: (Rule) => Rule.required().uri({allowRelative: true}),
        }),
      ],
    }),
    defineField({
      name: 'logo',
      title: 'Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
          description: 'Briefly describe the logo for accessibility.',
        }),
      ],
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'socialLinks',
      title: 'Social Links',
      type: 'array',
      validation: (Rule) => Rule.required().min(1),
      of: [
        defineArrayMember({
          name: 'socialLink',
          title: 'Social Link',
          type: 'object',
          fields: [
            defineField({
              name: 'label',
              title: 'Label',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'href',
              title: 'Link',
              type: 'url',
              validation: (Rule) => Rule.required().uri({allowRelative: true}),
            }),
            defineField({
              name: 'icon',
              title: 'Icon',
              type: 'image',
              options: {
                hotspot: true,
              },
              fields: [
                defineField({
                  name: 'alt',
                  title: 'Alt Text',
                  type: 'string',
                }),
              ],
            }),
          ],
          preview: {
            select: {
              title: 'label',
              subtitle: 'href',
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'columns',
      title: 'Navigation Columns',
      description: 'Supports up to four columns of footer links.',
      type: 'array',
      validation: (Rule) => Rule.required().min(2).max(4),
      of: [
        defineArrayMember({
          name: 'navigationColumn',
          title: 'Navigation Column',
          type: 'object',
          fields: [
            defineField({
              name: 'title',
              title: 'Column Title',
              type: 'string',
              validation: (Rule) => Rule.required(),
            }),
            defineField({
              name: 'links',
              title: 'Links',
              type: 'array',
              validation: (Rule) => Rule.required().min(1),
              of: [
                defineArrayMember({
                  name: 'navigationLink',
                  title: 'Navigation Link',
                  type: 'object',
                  fields: [
                    defineField({
                      name: 'label',
                      title: 'Label',
                      type: 'string',
                      validation: (Rule) => Rule.required(),
                    }),
                    defineField({
                      name: 'href',
                      title: 'Link',
                      type: 'url',
                      validation: (Rule) => Rule.required().uri({allowRelative: true}),
                    }),
                  ],
                  preview: {
                    select: {
                      title: 'label',
                      subtitle: 'href',
                    },
                  },
                }),
              ],
            }),
          ],
          preview: {
            select: {
              title: 'title',
              linkCount: 'links.length',
            },
            prepare({title, linkCount}) {
              return {
                title: title ?? 'Navigation Column',
                subtitle: linkCount ? `${linkCount} link${linkCount === 1 ? '' : 's'}` : undefined,
              }
            },
          },
        }),
      ],
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Card Background Image',
      type: 'image',
      options: {
        hotspot: true,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt Text',
          type: 'string',
        }),
      ],
    }),
  ],
  preview: {
    select: {
      title: 'headline',
      columns: 'columns.length',
    },
    prepare({title, columns}) {
      return {
        title: title ?? 'Footer Block',
        subtitle: columns ? `${columns} column${columns === 1 ? '' : 's'}` : undefined,
      }
    },
  },
})
