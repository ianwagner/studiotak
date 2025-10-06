import {defineArrayMember, defineField} from 'sanity'

const linkAnnotation = defineField({
  name: 'link',
  title: 'Link',
  type: 'object',
  fields: [
    defineField({
      name: 'route',
      title: 'Internal Route',
      type: 'reference',
      to: [{type: 'route'}],
      weak: true,
    }),
    defineField({
      name: 'href',
      title: 'External URL',
      type: 'url',
      validation: (Rule) =>
        Rule.uri({allowRelative: true}).warning('Prefer Routes for internal links when possible.'),
    }),
    defineField({
      name: 'blank',
      title: 'Open in New Tab',
      type: 'boolean',
      initialValue: false,
    }),
  ],
  validation: (Rule) =>
    Rule.custom((value) => {
      const hasRoute = Boolean(value?.route)
      const hasHref = Boolean(value?.href)

      if (!hasRoute && !hasHref) {
        return 'Select a Route or provide a URL.'
      }

      if (hasRoute && hasHref) {
        return 'Choose either a Route or a URL, not both.'
      }

      return true
    }),
});

export const portableTextBlock = defineArrayMember({
  type: 'block',
  marks: {
    annotations: [linkAnnotation],
  },
});
