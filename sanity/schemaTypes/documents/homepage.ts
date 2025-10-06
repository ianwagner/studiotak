import {defineArrayMember, defineField, defineType} from 'sanity'

import {blockMetaFields, createTokenField, densityField} from '../blocks/base'
import {stackSpacingTokenOptions, typographyTokenOptions} from '../blocks/tokens'
import {blockThemeField} from '../fields/blockTheme'
import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'

const SHARED_TOKEN_INITIALS = {
  theme: 'light',
  density: 'default',
  typographyToken: 'gm-typography-section-heading',
  spacingToken: 'gm-spacing-shell-stack',
} as const

export const homepageType = defineType({
  name: 'homepage',
  title: 'Homepage',
  type: 'document',
  groups: editorialGroups,
  options: {
    singleton: true,
  },
  initialValue: {
    slug: {
      current: 'home',
    },
    sharedTokens: SHARED_TOKEN_INITIALS,
  },
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      initialValue: {
        current: 'home',
      },
      options: {
        source: () => 'home',
        slugify: () => 'home',
      },
      validation: (Rule) =>
        Rule.required().custom((slug) => (slug?.current === 'home' ? true : 'Slug must remain “home” for the homepage.')),
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      group: ADVANCED_GROUP,
      options: {
        collapsible: true,
        collapsed: false,
      },
      fields: [
        defineField({
          name: 'description',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          validation: (Rule) => Rule.required().max(160).warning('Keep descriptions concise (under 160 characters).'),
        }),
        defineField({
          name: 'socialImage',
          title: 'Social Share Image',
          type: 'image',
          options: {
            hotspot: true,
          },
        }),
      ],
    }),
    defineField({
      name: 'sharedTokens',
      title: 'Shared Tokens',
      type: 'object',
      description: 'Default styling tokens applied universally across homepage sections.',
      group: ADVANCED_GROUP,
      options: {
        collapsible: true,
        collapsed: true,
      },
      fields: [
        {...blockThemeField},
        {...densityField},
        createTokenField({
          name: 'typographyToken',
          title: 'Heading Typography Token',
          options: typographyTokenOptions,
          initialValue: SHARED_TOKEN_INITIALS.typographyToken,
          description: 'Typography token promoted for shared homepage headings.',
        }),
        createTokenField({
          name: 'spacingToken',
          title: 'Section Stack Token',
          options: stackSpacingTokenOptions,
          initialValue: SHARED_TOKEN_INITIALS.spacingToken,
          description: 'Controls the base vertical rhythm between sections.',
        }),
      ],
    }),
    defineField({
      name: 'blocks',
      title: 'Content Blocks',
      type: 'array',
      of: [
        defineArrayMember({type: 'heroBlock'}),
        defineArrayMember({type: 'splitBlock'}),
        defineArrayMember({type: 'featuresBlock'}),
        defineArrayMember({
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
        }),
      ],
      validation: (Rule) => [
        Rule.required().min(1).error('Add at least one block to publish the homepage.'),
        Rule.custom((blocks) => {
          if (!Array.isArray(blocks) || blocks.length === 0) {
            return true
          }

          return blocks[0]?._type === 'heroBlock'
            ? true
            : 'Start the homepage with a Hero block so visitors immediately understand the story.'
        }).warning('Start the homepage with a Hero block so visitors immediately understand the story.'),
      ],
      group: ESSENTIALS_GROUP,
    }),
    defineField({
      name: 'featuredSets',
      title: 'Featured Sets',
      description: 'Optional sets that receive persistent placement on the homepage.',
      type: 'array',
      of: [
        defineArrayMember({
          type: 'reference',
          to: [{type: 'dynamicSet'}, {type: 'curatedSet'}],
        }),
      ],
      validation: (Rule) => Rule.unique(),
      group: ADVANCED_GROUP,
    }),
  ],
  preview: {
    select: {
      title: 'title',
      subtitle: 'seo.description',
    },
    prepare({title, subtitle}) {
      return {
        title: title ?? 'Homepage',
        subtitle: subtitle ?? 'Root experience',
      }
    },
  },
})
