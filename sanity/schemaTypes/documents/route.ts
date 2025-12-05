import {defineField, defineType} from 'sanity'

import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'
import {ROUTE_PATH_PATTERN, ROUTE_PRODUCT_OPTIONS, getNormalizedDocumentId} from '../utils/routes'

export const routeType = defineType({
  name: 'route',
  title: 'Route',
  type: 'document',
  groups: editorialGroups,
  fields: [
    defineField({
      name: 'product',
      title: 'Product',
      type: 'string',
      group: ESSENTIALS_GROUP,
      options: {
        list: ROUTE_PRODUCT_OPTIONS,
        layout: 'radio',
      },
      initialValue: ROUTE_PRODUCT_OPTIONS[0]?.value,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'path',
      title: 'Path',
      type: 'string',
      description: 'Single URL segment without slashes. Combined with the product to generate a unique route.',
      group: ESSENTIALS_GROUP,
      validation: (Rule) =>
        Rule.required()
          .regex(ROUTE_PATH_PATTERN, {
            name: 'path',
            invert: false,
          })
          .error('Paths cannot contain spaces or "/" characters.')
          .custom(async (value, context) => {
            if (!value) {
              return true
            }

            const product = (context?.document as {product?: string} | undefined)?.product
            if (!product) {
              return true
            }

            const client = context?.getClient?.({apiVersion: '2024-01-01'})
            if (!client) {
              return true
            }

            const normalizedId = getNormalizedDocumentId((context?.document as {_id?: string} | undefined)?._id)
            const excludeIds = [normalizedId, normalizedId ? `drafts.${normalizedId}` : undefined].filter(Boolean)

            const existing = await client.fetch(
              `*[_type == "route" && product == $product && path == $path && !(_id in $excludeIds)][0]._id`,
              {product, path: value, excludeIds},
            )

            return existing ? 'Another route already uses this path for the selected product.' : true
          }),
    }),
    defineField({
      name: 'target',
      title: 'Target',
      type: 'reference',
      to: [{type: 'page'}, {type: 'industryPage'}, {type: 'personaPage'}],
      group: ESSENTIALS_GROUP,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 3,
      description: 'Optional context for editors about how this route is used.',
      group: ADVANCED_GROUP,
    }),
  ],
  preview: {
    select: {
      path: 'path',
      product: 'product',
      targetTitle: 'target.title',
      targetType: 'target._type',
    },
    prepare({path, product, targetTitle, targetType}) {
      const label =
        targetTitle ??
        (targetType === 'page'
          ? 'Page'
          : targetType === 'industryPage'
            ? 'Industry Page'
            : targetType === 'personaPage'
              ? 'Persona Page'
              : 'Unassigned Target')

      return {
        title: path ? `/${path}` : 'Untitled Route',
        subtitle: product ? `${product} → ${label}` : label,
      }
    },
  },
})
