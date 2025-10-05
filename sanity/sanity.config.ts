import {defineConfig} from 'sanity'
import {structureTool} from 'sanity/structure'
import {visionTool} from '@sanity/vision'

import {schemaTypes} from './schemaTypes'
import {studioStructure} from './structure'

export default defineConfig({
  name: 'default',
  title: 'Studio Tak',

  projectId: '5t6zb43d',
  dataset: 'production',

  plugins: [structureTool({structure: studioStructure}), visionTool()],

  schema: {
    types: schemaTypes,
  },
})
