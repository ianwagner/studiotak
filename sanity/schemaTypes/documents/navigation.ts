import {defineArrayMember, defineField, defineType} from 'sanity'
import type {DocumentOptions} from 'sanity'

import {anchorField, createTokenField, densityField, layoutField} from '../blocks/base'
import {
  focusRingTokenOptions,
  hoverStateTokenOptions,
  stackSpacingTokenOptions,
  textColorTokenOptions,
  typographyTokenOptions,
} from '../blocks/tokens'
import {blockThemeField} from '../fields/blockTheme'
import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'

type NavigationItemValue = {
  isCta?: boolean
  children?: NavigationItemValue[]
}

const DEFAULT_LAYOUT_TOKENS = {
  container: 'gm-layout-shell',
  maxWidth: 'gm-layout-shell-max',
  inlinePadding: 'gm-spacing-shell-inline',
  blockPadding: 'gm-spacing-shell-block',
  stackSpacing: 'gm-spacing-shell-stack',
} as const

const NAVIGATION_SAMPLE_ITEMS = [
  {
    label: 'Home',
    destination: {
      externalUrl: '/',
    },
  },
  {
    label: 'Solutions',
    destination: {
      externalUrl: '/solutions',
    },
    children: [
      {
        label: 'Journey Orchestration',
        destination: {
          externalUrl: '/solutions/journey-orchestration',
        },
      },
      {
        label: 'Analytics & Insights',
        destination: {
          externalUrl: '/solutions/analytics-insights',
        },
      },
      {
        label: 'Lifecycle Automation',
        destination: {
          externalUrl: '/solutions/lifecycle-automation',
        },
      },
    ],
  },
  {
    label: 'Blog',
    destination: {
      externalUrl: 'https://blog.studiotak.com',
    },
  },
  {
    label: 'Get Started',
    destination: {
      externalUrl: '/contact',
    },
    isCta: true,
  },
] as const

const NAVIGATION_INITIAL_VALUE = {
  anchor: 'site-navigation',
  theme: 'light',
  density: 'default',
  layout: DEFAULT_LAYOUT_TOKENS,
  itemSpacingToken: 'gm-spacing-shell-stack',
  typographyToken: 'gm-typography-body-sm',
  linkColorToken: 'gm-color-text-primary',
  hoverStateToken: 'gm-color-hover-surface-tint',
  focusRingToken: 'gm-color-border-accent',
  items: NAVIGATION_SAMPLE_ITEMS,
} as const

const countCtas = (items: NavigationItemValue[] = []): number =>
  items.reduce((total, item) => {
    const nextTotal = total + (item?.isCta ? 1 : 0)

    if (Array.isArray(item?.children) && item.children.length > 0) {
      return nextTotal + countCtas(item.children)
    }

    return nextTotal
  }, 0)

const ensureSingleCta = (items: unknown) => {
  if (!Array.isArray(items)) {
    return 'Add at least one navigation item.'
  }

  return countCtas(items as NavigationItemValue[]) <= 1
    ? true
    : 'Only one navigation item can be marked as the CTA.'
}

const navigationItemPreview = {
  select: {
    title: 'label',
    routePath: 'destination.route->path',
    routeProduct: 'destination.route->product',
    externalUrl: 'destination.externalUrl',
    isCta: 'isCta',
  },
  prepare({
    title,
    routePath,
    routeProduct,
    externalUrl,
    isCta,
  }: {
    title?: string
    routePath?: string
    routeProduct?: string
    externalUrl?: string
    isCta?: boolean
  }) {
    const subtitle = routePath ? `${routeProduct ?? 'internal'} → /${routePath}` : externalUrl ?? 'Destination not set'

    return {
      title: isCta ? `${title ?? 'Navigation Item'} (CTA)` : title ?? 'Navigation Item',
      subtitle,
    }
  },
}

const createDestinationField = () =>
  defineField({
    name: 'destination',
    title: 'Destination',
    type: 'object',
    options: {
      columns: 2,
    },
    fields: [
      defineField({
        name: 'route',
        title: 'Internal Route',
        type: 'reference',
        to: [{type: 'route'}],
        weak: true,
        description: 'Select a managed Route for internal navigation.',
      }),
      defineField({
        name: 'externalUrl',
        title: 'External URL',
        type: 'url',
        validation: (Rule) =>
          Rule.uri({allowRelative: true}).warning('Prefer relative URLs for links within the site.'),
      }),
    ],
    validation: (Rule) =>
      Rule.custom((value) => {
        const hasRoute = Boolean(value?.route)
        const hasUrl = Boolean(value?.externalUrl)

        if (!hasRoute && !hasUrl) {
          return 'Select a route or provide an external URL.'
        }

        if (hasRoute && hasUrl) {
          return 'Choose either a route or an external URL, not both.'
        }

        return true
      }),
  })

const createNavigationItemFields = (includeChildren: boolean) => {
  const fields: Array<ReturnType<typeof defineField>> = [
    defineField({
      name: 'label',
      title: 'Label',
      type: 'string',
      validation: (Rule) => Rule.required().max(60),
      description: 'Text displayed in the navigation menu.',
    }),
    createDestinationField() as ReturnType<typeof defineField>,
    defineField({
      name: 'audience',
      title: 'Audience Filter',
      type: 'string',
      description: 'Optionally limit this item to internal or external experiences.',
      options: {
        list: [
          {title: 'External Visitors', value: 'external'},
          {title: 'Internal Users', value: 'internal'},
        ],
        layout: 'radio',
      },
    }),
    defineField({
      name: 'isCta',
      title: 'CTA Button',
      type: 'boolean',
      description: 'Marks this item as the primary call-to-action button.',
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'image',
      description: 'Optional icon displayed to the left of the navigation label.',
      options: {
        hotspot: false,
      },
      fields: [
        defineField({
          name: 'alt',
          title: 'Alt text',
          type: 'string',
          description: 'Describe the icon for screen readers. Leave blank if decorative.',
          validation: (Rule) => Rule.max(120),
        }),
      ],
    }),
  ]

  if (includeChildren) {
    fields.push(
      defineField({
        name: 'children',
        title: 'Dropdown Items',
        type: 'array',
        of: [
          defineArrayMember({
            name: 'navigationChild',
            title: 'Navigation Item',
            type: 'object',
            fields: createNavigationItemFields(false),
            preview: navigationItemPreview,
          }),
        ],
        options: {
          collapsible: true,
          collapsed: true,
        } as {collapsible: boolean; collapsed: boolean},
        validation: (Rule) =>
          Rule.custom((children, context) => {
            if (Array.isArray(children) && (context?.parent as NavigationItemValue)?.isCta) {
              return 'CTA items cannot include dropdown links.'
            }

            return true
          }),
      }),
    )
  }

  return fields
}

const itemSpacingField = createTokenField({
  name: 'itemSpacingToken',
  title: 'Item Spacing Token',
  options: stackSpacingTokenOptions,
  initialValue: 'gm-spacing-compact-stack',
  description: 'Controls spacing between links in horizontal and dropdown menus.',
})

const linkTypographyField = createTokenField({
  name: 'typographyToken',
  title: 'Link Typography Token',
  options: typographyTokenOptions,
  initialValue: 'gm-typography-body-sm',
  description: 'Typography token applied to navigation links.',
})

const linkColorField = createTokenField({
  name: 'linkColorToken',
  title: 'Link Color Token',
  options: textColorTokenOptions,
  initialValue: 'gm-color-text-primary',
  description: 'Default text color for navigation links.',
})

const hoverInteractionField = createTokenField({
  name: 'hoverStateToken',
  title: 'Hover Interaction Token',
  options: hoverStateTokenOptions,
  initialValue: 'gm-color-hover-surface-tint',
  description: 'Hover treatment applied to navigation links.',
})

const focusInteractionField = createTokenField({
  name: 'focusRingToken',
  title: 'Focus Ring Token',
  options: focusRingTokenOptions,
  initialValue: 'gm-color-border-accent',
  description: 'Focus-visible outline token for keyboard interactions.',
})

export const navigationType = defineType({
  name: 'navigation',
  title: 'Navigation',
  type: 'document',
  options: {
    singleton: true,
  } as DocumentOptions,
  initialValue: NAVIGATION_INITIAL_VALUE,
  groups: editorialGroups,
  fields: [
    defineField({
      name: 'items',
      title: 'Navigation Items',
      type: 'array',
      of: [
        defineArrayMember({
          name: 'navigationItem',
          title: 'Navigation Item',
          type: 'object',
          fields: createNavigationItemFields(true),
          preview: navigationItemPreview,
        }),
      ],
      description: 'Ordered navigation links rendered in the shared header.',
      validation: (Rule) => Rule.required().min(1).custom(ensureSingleCta),
      group: ESSENTIALS_GROUP,
    }),
    {...itemSpacingField, group: ESSENTIALS_GROUP},
    {...linkTypographyField, group: ESSENTIALS_GROUP},
    {...linkColorField, group: ESSENTIALS_GROUP},
    {...hoverInteractionField, group: ADVANCED_GROUP},
    {...focusInteractionField, group: ADVANCED_GROUP},
    {...anchorField, group: ADVANCED_GROUP},
    {...blockThemeField, group: ADVANCED_GROUP},
    {...densityField, group: ADVANCED_GROUP},
    {...layoutField, group: ADVANCED_GROUP},
  ],
  preview: {
    select: {
      items: 'items',
    },
    prepare({items}: {items?: unknown[]}) {
      const count = Array.isArray(items) ? items.length : 0

      return {
        title: 'Navigation',
        subtitle: count ? `${count} item${count === 1 ? '' : 's'}` : 'No items configured yet',
      }
    },
  },
})
