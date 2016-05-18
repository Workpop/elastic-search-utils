import {
  andFilters,
  boolShould, multiMatch,
  getOptionValue,
  singleFieldTextQueryWithBoost,
  isPhrase,
  phraseMatch,
  matchesOneBoolQuery,
  matchAllQuery,
  distanceCalculationScriptField
} from './utils';
import { DEFAULT_FUZZINESS, NO_FUZZINESS } from './enums';
import _ from 'underscore';

export default class QueryBuilder {
  constructor() {
    this.queries = [];
    this.distanceCalc = {};
    this.filters = [];
    this.filterGte = this.filterGte.bind(this);
    this.filterByDistance = this.filterByDistance.bind(this);
    this.multiFieldTextSearchWithBoost = this.multiFieldTextSearchWithBoost.bind(this);
    this.fuzzyTextQuery = this.fuzzyTextQuery.bind(this);
    this.filterMatchesOne = this.filterMatchesOne.bind(this);
    this.sortBy = this.sortBy.bind(this);
    this.addDistanceCalculation = this.addDistanceCalculation.bind(this);
    this.setMinScore = this.setMinScore.bind(this);
    this.build = this.build.bind(this);
  }
  SortTypes = {
    FieldOrder: {
      applySortToQuery: function (querybuilder, sortParams) {
        querybuilder.sort = [{[sortParams.sortField]: (sortParams.sortAscending ? 'asc' : 'desc')}];
      }
    },
    Distance: {
      applySortToQuery: function (querybuilder, sortParams) {
        const origin = sortParams.origin;
        if (origin) {
          const lat = origin[1];
          const lon = origin[0];
          querybuilder.sort = {
            "_geo_distance": {
              "geo": {
                lat,
                lon
              },
              "order": "asc",
              "unit": "m",
              "distance_type": "plane"
            }
          };
        }
        return querybuilder;
      }
    },
    Scoring: {
      applySortToQuery: function (querybuilder) {
        // if we're using the score calculated by Elasticsearch, then the returned results are already in the sort
        // order we want
        return querybuilder;
      }
    }
  };

  fuzzyTextQuery(textToSearch, fieldsToSearch) {
    this.queries.push(
      multiMatch(fieldsToSearch, textToSearch, DEFAULT_FUZZINESS)
    );
    return this;
  }

  multiFieldTextSearchWithBoost(textToSearch, boostMap, options) {
    let shouldExpressions = [];

    const fuzzyMatchEnabled = getOptionValue(options, 'fuzzyMatch.enabled', true);
    if (fuzzyMatchEnabled) {
      const fuzzyMatchBoostFactor = getOptionValue(options, 'fuzzyMatch.boostFactor', 1);
      const shouldSubExpressions = _.map(_.pairs(boostMap), (kv) => {
        const textField = kv[0];
        const boost = kv[1];
        return singleFieldTextQueryWithBoost(
          textField,
          textToSearch,
          boost * fuzzyMatchBoostFactor,
          DEFAULT_FUZZINESS
        );
      });
      shouldExpressions = shouldExpressions.concat(boolShould(shouldSubExpressions));
    }

    const exactMatchEnabled = getOptionValue(options, 'exactMatch.enabled', true);
    if (exactMatchEnabled) {
      const exactMatchBoostFactor = getOptionValue(options, 'exactMatch.boostFactor', 2);
      const shouldExactSubExpressions = _.map(_.pairs(boostMap), function (kv) {
        const textField = kv[0];
        const boost = kv[1];
        return singleFieldTextQueryWithBoost(
          textField,
          textToSearch,
          boost * exactMatchBoostFactor,
          NO_FUZZINESS
        );
      });
      shouldExpressions = shouldExpressions.concat(boolShould(shouldExactSubExpressions));
    }

    const phraseMatchEnabled = getOptionValue(options, 'phraseMatch.enabled', true);
    if (phraseMatchEnabled && isPhrase(textToSearch)) {
      const phraseMatchBoostFactor = getOptionValue(options, 'phraseMatch.boostFactor', 2);
      const shouldPhraseExpressions = _.map(_.pairs(boostMap), function (kv) {
        const textField = kv[0];
        const boost = kv[1];
        return phraseMatch(
          textField,
          textToSearch,
          boost * phraseMatchBoostFactor
        );
      });
      shouldExpressions = shouldExpressions.concat(boolShould(shouldPhraseExpressions));
    }

    this.queries.push({
      bool: {
        should: shouldExpressions
      }
    });

    return this;
  };
  filterByDistance(docPath, origin, distanceMeters) {
    this.filters.push(
      {
        "geo_distance": {
          "distance": `${distanceMeters}m`,
          [docPath]: origin
        }
      }
    );
    return this;
  };
  filterGte(docPath, value) {
    this.filters.push({
      "range": {
        [docPath]: {
          "gte": value
        }
      }
    });
    return this;
  };
  filterMatchesOne(docPath, values) {
    this.filters.push(matchesOneBoolQuery(docPath, values));
    return this;
  };
  sortBy(sortDescriptor) {
    const sortType = sortDescriptor.sortType && this.SortTypes[sortDescriptor.sortType];
    if (sortType) {
      sortType.applySortToQuery(this, sortDescriptor.sortParams);
    }
    return this;
  };
  addDistanceCalculation(geoField, lat, lon, distanceField) {
    this.distanceCalc = {
      geoField,
      lat,
      lon,
      distanceField
    };
    return this;
  };
  setMinScore(minScore) {
    this.minScore = minScore;
    return this;
  };
  build() {
    const query = (_.size(this.queries) > 0 && this.queries[0]) || matchAllQuery();

    // set the filters
    const numFilters = _.size(this.filters);
    let filter = {};
    switch (numFilters) {
      case 0:
        break;
      case 1:
        filter = this.filters[0];
        break;
      default:
        // more than 1 filter
        filter = andFilters(this.filters);
        break;
    }

    const sort = this.sort;

    // note fields declaration required when using script_fields or else _source will not be returned
    const q = {
      "fields": [
        "_source"
      ],
      query: {
        filtered: {
          query,
          filter
        }
      },
      sort
    };

    if (this.distanceCalc) {
      _.extend(q, distanceCalculationScriptField(this.distanceCalc));
    }

    if (this.minScore) {
      _.extend(q, {
        min_score: this.minScore
      });
    }

    return q;
  };

}
