/* eslint-disable no-unused-vars */
import {
  DefaultPageSize,
  NO_FUZZINESS,
  DEFAULT_FUZZINESS,
  FUZZY_PREFIX_LENGTH,
  SORT_TYPE_FIELD_ORDER,
  SORT_TYPE_DISTANCE,
  SORT_TYPE_SCORING,
} from './enums';

import {
  termQuery,
  matchesOneBoolQuery,
  matchAllQuery,
  singleFieldTextQueryWithBoost,
  phraseMatch,
  multiMatch,
  distanceCalculationScriptField,
  andFilters,
  isPhrase,
  boolShould,
  getOptionValue,
} from './utils';

import {
  createIndex,
  deleteIndex,
  indexExists,
  updateTypeMapping,
  index,
  update,
  updateProperties,
  deleteItem,
  exists,
  search,
  findAllIds,
  consolidateHit,
  isConnectionError,
} from './api';

import QueryBuilder from './query-builder';

import createESClient from './es-client';

export {
  createIndex,
  deleteIndex,
  indexExists,
  updateTypeMapping,
  index,
  update,
  updateProperties,
  deleteItem,
  exists,
  search,
  findAllIds,
  consolidateHit,
  isConnectionError,
  QueryBuilder,
  createESClient,
  DefaultPageSize,
  NO_FUZZINESS,
  DEFAULT_FUZZINESS,
  FUZZY_PREFIX_LENGTH,
  SORT_TYPE_FIELD_ORDER,
  SORT_TYPE_DISTANCE,
  SORT_TYPE_SCORING,
};
