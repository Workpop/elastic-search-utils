import { map, isString, isEmpty, isUndefined, get } from 'lodash';
import { FUZZY_PREFIX_LENGTH } from './enums';
import { isArray } from 'util';

/**
 * Utility function to create a Elasticsearch term query.
 *
 * @param path {String} The path whose value to match
 * @param value {String|Number} The value to match
 * @returns {Object} The Elasticsearch term query
 */
function termQuery(path, value) {
  return {
    term: {
      [path]: value,
    },
  };
}

/**
 * Utility function to create a Elasticsearch terms query.
 *
 * @param path {String} The path whose value to match
 * @param value {String|Number} The value to match
 * @returns {Object} The Elasticsearch term query
 */
function termsQuery(path, value) {
  return {
    terms: {
      [path]: value,
    },
  };
}

/**
 * Creates an Elasticsearch boolean query to test if the value at the provided path matches one or more values.
 *
 * @param path {String} The path to match in the Elasticsearch document
 * @param values {[String|Number]} the values to match
 * @returns {Object}
 */
function matchesOneBoolQuery(path, values) {
  const terms = map(values, function (value) {
    return termQuery(path, value);
  });

  return {
    bool: {
      should: terms,
    },
  };
}

/**
 * Return an Elasticsearch match all query.
 *
 * @returns {Object}
 */
function matchAllQuery() {
  return {
    match_all: {},
  };
}

/**
 * Generate query fragment to text search a single field.
 *
 * @param field {String} path of field to search
 * @param text {String} text to search for
 * @param boost {Integer} boost for a match
 * @param fuzziness
 * @returns {Object} match expression
 */
function singleFieldTextQueryWithBoost(field, text, boost, fuzziness) {
  return {
    match: {
      [field]: {
        query: text,
        boost: boost,
        fuzziness: fuzziness,
        prefix_length: FUZZY_PREFIX_LENGTH,
      },
    },
  };
}

function prefixMatch(field, prefix, boost) {
  return {
    prefix: {
      [field]: {
        value: prefix,
        boost,
      },
    },
  };
}

/**
 * Match text as entire phrase
 *
 * Note: match with type=phrase was deprecated in 5.x and breaks against a 6.x elasticsearch cluster.
 * Implementation updated to use match_phrase instead.
 *
 * @param field {String} path of field to search
 * @param text {String} text (phrase) to search for
 * @param boost {Integer} boost for a match
 * @returns {Object} match phrase expression
 */
function phraseMatch(field, text, boost) {
  return {
    match_phrase: {
      [field]: {
        query: text,
        boost: boost,
      },
    },
  };
}

/**
 * Creates a multi-match text search filter fragment.
 *
 * @param fields {[String]} field paths to match
 * @param text {String} text to match
 * @param fuzziness {String} How fuzzy are the matches
 * @returns {Object}
 */
function multiMatch(fields, text, fuzziness) {
  return {
    multi_match: {
      fields: fields,
      query: text,
      fuzziness: fuzziness,
    },
  };
}

// note: this requires inline scripting to be enabled by adding script.inline: true to config/elasticsearch.yml
// inline scripting is currently disabled on compose.io elasticsearch instances
function distanceCalculationScriptField(distanceCalcConfig) {
  return {
    script_fields: {
      [distanceCalcConfig.distanceField]: {
        params: {
          lat: distanceCalcConfig.lat,
          lon: distanceCalcConfig.lon,
        },
        script: `doc['${distanceCalcConfig.geoField}'].distance(lat, lon)`,
      },
    },
  };
}

/**
 * Combine multiple filters using 'AND' logic.
 *
 * @param filters
 * @returns {Object}
 */
function andFilters(filters) {
  return {
    bool: {
      must: [filters],
    },
  };
}

function isPhrase(text) {
  return isString(text) && !isEmpty(text) && text.split(/(\s+)/).length > 1;
}

function boolShould(subqueries) {
  return {
    bool: {
      should: subqueries,
    },
  };
}

function boolMust(subqueries) {
  return {
    bool: {
      must: subqueries,
    },
  };
}

function getOptionValue(options, optionPath, defaultValue) {
  if (options && !isUndefined(get(options, optionPath))) {
    return get(options, optionPath);
  }

  return defaultValue;
}

export {
  termQuery,
  termsQuery,
  matchesOneBoolQuery,
  matchAllQuery,
  singleFieldTextQueryWithBoost,
  phraseMatch,
  multiMatch,
  prefixMatch,
  distanceCalculationScriptField,
  andFilters,
  isPhrase,
  boolShould,
  getOptionValue,
};
