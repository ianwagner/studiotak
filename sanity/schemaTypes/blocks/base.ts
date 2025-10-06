import {defineField} from 'sanity'

import {blockThemeField} from '../fields/blockTheme'
import {
  blockSpacingTokenOptions,
  inlineSpacingTokenOptions,
  layoutContainerTokenOptions,
  layoutMaxWidthTokenOptions,
  stackSpacingTokenOptions,
  typographyTokenOptions,
  type DesignTokenOption,
} from './tokens'

export const createTokenField = ({
  name,
  title,
  description,
  options,
  initialValue,
}: {
  name: string
  title: string
  description?: string
  options: DesignTokenOption[]
  initialValue: string
}) =>
  defineField({
    name,
    title,
    description,
    type: 'string',
    options: {
      list: options,
    },
    initialValue,
    validation: (Rule) => Rule.required(),
  })

export const anchorField = defineField({
  name: 'anchor',
  title: 'Anchor ID',
  type: 'string',
  description: 'Optional anchor (no spaces) used for in-page linking.',
  validation: (Rule) =>
    Rule.regex(/^[a-z0-9\-]+$/i, {
      name: 'anchor',
      invert: false,
    }).warning('Anchor IDs should only include letters, numbers, or hyphens when provided.'),
})

export const layoutField = defineField({
  name: 'layout',
  title: 'Layout Shell',
  type: 'object',
  description:
    'Shared layout tokens applied by the universal Section wrapper. Adjust only when a block needs a different rhythm.',
  options: {
    collapsible: true,
    collapsed: true,
  },
  initialValue: {
    container: 'gm-layout-shell',
    maxWidth: 'gm-layout-shell-max',
    inlinePadding: 'gm-spacing-shell-inline',
    blockPadding: 'gm-spacing-shell-block',
    stackSpacing: 'gm-spacing-shell-stack',
  },
  fields: [
    createTokenField({
      name: 'container',
      title: 'Container Token',
      options: layoutContainerTokenOptions,
      initialValue: 'gm-layout-shell',
      description: 'Controls the outer container alignment.',
    }),
    createTokenField({
      name: 'maxWidth',
      title: 'Max Width Token',
      options: layoutMaxWidthTokenOptions,
      initialValue: 'gm-layout-shell-max',
      description: 'Sets the maximum width of the shell.',
    }),
    createTokenField({
      name: 'inlinePadding',
      title: 'Inline Padding Token',
      options: inlineSpacingTokenOptions,
      initialValue: 'gm-spacing-shell-inline',
    }),
    createTokenField({
      name: 'blockPadding',
      title: 'Block Padding Token',
      options: blockSpacingTokenOptions,
      initialValue: 'gm-spacing-shell-block',
    }),
    createTokenField({
      name: 'stackSpacing',
      title: 'Stack Spacing Token',
      options: stackSpacingTokenOptions,
      initialValue: 'gm-spacing-shell-stack',
    }),
  ],
})

export const headingStyleField = createTokenField({
  name: 'headingStyle',
  title: 'Heading Style Token',
  options: typographyTokenOptions,
  initialValue: 'gm-typography-section-heading',
  description: 'Typography token applied to the primary heading.',
})

export const bodyStyleField = createTokenField({
  name: 'bodyStyle',
  title: 'Body Style Token',
  options: typographyTokenOptions,
  initialValue: 'gm-typography-body-base',
  description: 'Typography token applied to long-form text.',
})

export const densityField = defineField({
  name: 'density',
  title: 'Density',
  type: 'string',
  options: {
    list: [
      { title: 'Default', value: 'default' },
      { title: 'Compact', value: 'compact' },
    ],
    layout: 'radio',
  },
  initialValue: 'default',
});

export const blockMetaFields = [anchorField, blockThemeField, layoutField, densityField]
