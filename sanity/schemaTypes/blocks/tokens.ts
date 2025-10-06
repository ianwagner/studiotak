export type DesignTokenOption = {
  title: string
  value: string
  description?: string
}

export const layoutTokenOptions: DesignTokenOption[] = [
  {
    title: 'Shell Container',
    value: 'gm-layout-shell',
    description: 'Full-width container constrained by shell padding.',
  },
  {
    title: 'Shell Max Width',
    value: 'gm-layout-shell-max',
    description: 'Max-width constraint for shell content.',
  },
]

export const inlineSpacingTokenOptions: DesignTokenOption[] = [
  {
    title: 'Shell Inline Padding',
    value: 'gm-spacing-shell-inline',
  },
  {
    title: 'Section Inline Padding',
    value: 'gm-spacing-section-inline',
  },
]

export const blockSpacingTokenOptions: DesignTokenOption[] = [
  {
    title: 'Shell Block Padding',
    value: 'gm-spacing-shell-block',
  },
  {
    title: 'Section Block Padding',
    value: 'gm-spacing-section-block',
  },
]

export const stackSpacingTokenOptions: DesignTokenOption[] = [
  {
    title: 'Shell Stack',
    value: 'gm-spacing-shell-stack',
  },
  {
    title: 'Section Stack',
    value: 'gm-spacing-section-stack',
  },
  {
    title: 'Relaxed Stack',
    value: 'gm-spacing-relaxed-stack',
  },
  {
    title: 'Compact Stack',
    value: 'gm-spacing-compact-stack',
  },
  {
    title: 'Tight Stack',
    value: 'gm-spacing-tight-stack',
  },
]

export const typographyTokenOptions: DesignTokenOption[] = [
  {
    title: 'Hero Heading',
    value: 'gm-typography-hero-heading',
  },
  {
    title: 'Section Heading',
    value: 'gm-typography-section-heading',
  },
  {
    title: 'Block Heading',
    value: 'gm-typography-block-heading',
  },
  {
    title: 'Subheading',
    value: 'gm-typography-subheading',
  },
  {
    title: 'Body Large',
    value: 'gm-typography-body-lg',
  },
  {
    title: 'Body Base',
    value: 'gm-typography-body-base',
  },
  {
    title: 'Body Small',
    value: 'gm-typography-body-sm',
  },
  {
    title: 'Body X-Small',
    value: 'gm-typography-body-xs',
  },
  {
    title: 'Label X-Small',
    value: 'gm-typography-label-xs',
  },
  {
    title: 'Underline',
    value: 'gm-typography-underline',
  },
  {
    title: 'Strong',
    value: 'gm-typography-strong',
  },
  {
    title: 'Leading Relaxed',
    value: 'gm-typography-leading-relaxed',
  },
]

export const layoutContainerTokenOptions = layoutTokenOptions.filter((option) => option.value === 'gm-layout-shell')

export const layoutMaxWidthTokenOptions = layoutTokenOptions.filter((option) => option.value === 'gm-layout-shell-max')

export const gridSpacingTokenOptions: DesignTokenOption[] = [
  {
    title: 'Grid Tight',
    value: 'gm-spacing-grid-tight',
  },
  {
    title: 'Grid Default',
    value: 'gm-spacing-grid',
  },
  {
    title: 'Grid Relaxed',
    value: 'gm-spacing-grid-relaxed',
  },
]

export const textColorTokenOptions: DesignTokenOption[] = [
  {
    title: 'Text Primary',
    value: 'gm-color-text-primary',
    description: 'Default body copy color for light and dark themes.',
  },
  {
    title: 'Text Secondary',
    value: 'gm-color-text-secondary',
  },
  {
    title: 'Text Muted',
    value: 'gm-color-text-muted',
  },
  {
    title: 'Text Accent',
    value: 'gm-color-text-accent',
    description: 'Accent color used for prominent navigation links.',
  },
  {
    title: 'Text On Accent',
    value: 'gm-color-text-on-accent',
    description: 'Use when rendering links on an accent surface.',
  },
]

export const hoverStateTokenOptions: DesignTokenOption[] = [
  {
    title: 'Hover Surface Tint',
    value: 'gm-color-hover-surface-tint',
  },
  {
    title: 'Hover Accent Soft',
    value: 'gm-color-hover-surface-accent-soft',
  },
  {
    title: 'Hover Accent Strong',
    value: 'gm-color-hover-surface-accent',
  },
]

export const focusRingTokenOptions: DesignTokenOption[] = [
  {
    title: 'Border Accent',
    value: 'gm-color-border-accent',
  },
  {
    title: 'Border Strong',
    value: 'gm-color-border-strong',
  },
]
