import {defineField, defineType} from 'sanity'

import {ADVANCED_GROUP, ESSENTIALS_GROUP, editorialGroups} from '../utils/editorialGroups'
import {ROUTE_PATH_PATTERN, ROUTE_PRODUCT_OPTIONS, getNormalizedDocumentId} from '../utils/routes'

export const redirectType = defineType({
  name: 'redirect',
  title: 'Redirect',
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
      name: 'from',
      title: 'From Path',
      type: 'string',
      description: 'Original path to redirect from. Do not include leading slashes.',
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
              `*[_type == "redirect" && product == $product && from == $from && !(_id in $excludeIds)][0]._id`,
              {product, from: value, excludeIds},
            )

            return existing ? 'Another redirect already uses this path for the selected product.' : true
          }),
    }),
    defineField({
      name: 'to',
      title: 'Destination Route',
      type: 'reference',
      to: [{type: 'route'}],
      group: ESSENTIALS_GROUP,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'notes',
      title: 'Notes',
      type: 'text',
      rows: 3,
      description: 'Optional context for editors about why this redirect exists.',
      group: ADVANCED_GROUP,
    }),
  ],
  preview: {
    select: {
      from: 'from',
      product: 'product',
      toPath: 'to->path',
    },
    prepare({from, product, toPath}) {
      const destination = toPath ? `/${toPath}` : 'Missing destination'

      return {
        title: from ? `/${from}` : 'Untitled Redirect',
        subtitle: product ? `${product} → ${destination}` : destination,
      }
    },
  },
})
