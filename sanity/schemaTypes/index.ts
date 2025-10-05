import {articleType} from './documents/article'
import {curatedSetType} from './documents/curatedSet'
import {dynamicSetType} from './documents/dynamicSet'
import {exampleType} from './documents/example'
import {featureType} from './documents/feature'
import {pageType} from './documents/page'
import {industryPageType} from './documents/industryPage'
import {personaPageType} from './documents/personaPage'
import {contentTypeTaxonomy} from './taxonomies/contentType'
import {industryType} from './taxonomies/industry'
import {personaType} from './taxonomies/persona'

export const schemaTypes = [
  articleType,
  curatedSetType,
  dynamicSetType,
  exampleType,
  featureType,
  pageType,
  industryPageType,
  personaPageType,
  industryType,
  personaType,
  contentTypeTaxonomy,
]
