import {blockTypes} from './blocks'
import {articleType} from './documents/article'
import {curatedSetType} from './documents/curatedSet'
import {dynamicSetType} from './documents/dynamicSet'
import {exampleType} from './documents/example'
import {featureType} from './documents/feature'
import {formType} from './documents/form'
import {navigationType} from './documents/navigation'
import {homepageType} from './documents/homepage'
import {pageType} from './documents/page'
import {errorPageType} from './documents/errorPage'
import {sharedBlockType} from './documents/sharedBlock'
import {siteSettingsType} from './documents/siteSettings'
import {industryPageType} from './documents/industryPage'
import {personaPageType} from './documents/personaPage'
import {routeType} from './documents/route'
import {redirectType} from './documents/redirect'
import {contentTypeTaxonomy} from './taxonomies/contentType'
import {industryType} from './taxonomies/industry'
import {personaType} from './taxonomies/persona'

export const schemaTypes = [
  ...blockTypes,
  articleType,
  curatedSetType,
  dynamicSetType,
  exampleType,
  featureType,
  formType,
  siteSettingsType,
  navigationType,
  homepageType,
  pageType,
  errorPageType,
  sharedBlockType,
  industryPageType,
  personaPageType,
  routeType,
  redirectType,
  industryType,
  personaType,
  contentTypeTaxonomy,
]
