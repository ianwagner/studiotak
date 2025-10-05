import {defineField} from 'sanity'

type BlockThemeOption = {
  title: string
  value: 'light' | 'dark' | 'brand'
}

const THEME_OPTIONS: BlockThemeOption[] = [
  {title: 'Light', value: 'light'},
  {title: 'Dark', value: 'dark'},
  {title: 'Brand', value: 'brand'},
]

export const blockThemeField = defineField({
  name: 'theme',
  title: 'Theme',
  type: 'string',
  options: {
    list: THEME_OPTIONS,
    layout: 'radio',
  },
  initialValue: 'light',
})
