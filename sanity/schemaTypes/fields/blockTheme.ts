import {defineField} from 'sanity'

type BlockThemeOption = {
  title: string
  value: 'light' | 'dark' | 'brand' | 'system'
}

const THEME_OPTIONS: BlockThemeOption[] = [
  {title: 'Light', value: 'light'},
  {title: 'Dark', value: 'dark'},
  {title: 'Brand', value: 'brand'},
  {title: 'System', value: 'system'},
]

export const blockThemeField = defineField({
  name: 'theme',
  title: 'Theme',
  type: 'object',
  fields: [
    defineField({
      name: 'background',
      title: 'Background',
      type: 'string',
      options: {
        list: THEME_OPTIONS,
        layout: 'radio',
      },
      initialValue: 'light',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'content',
      title: 'Content',
      type: 'string',
      options: {
        list: THEME_OPTIONS,
        layout: 'radio',
      },
      initialValue: 'light',
      validation: (Rule) => Rule.required(),
    }),
  ],
  initialValue: {
    background: 'light',
    content: 'light',
  },
  options: {
    columns: 2,
  },
})
