# Workpop Elasticsearch

This package provides wrappers and utility functions for writing to and querying against an Elasticsearch cluster.

## QueryBuilder

Provides a fluent interface for building Elasticsearch query requests containing queries, filters, and sorts.

Example of building request with multiple filters:
```
      const request = new QueryBuilder()
        .filterMatchesOne('description.schedule', ['FT', 'PT'])
        .filterGte('description.wage.min', 11)
        .build();
```

which would generate the following request:
```
{
    "fields": ["_source"],
    "query": {
        "filtered": {
            "query": {
                "match_all": {}
            },
            "filter": {
                "bool": {
                    "must": [
                        [{
                            "bool": {
                                "should": [{
                                    "term": {
                                        "description.schedule": "FT"
                                    }
                                }, {
                                    "term": {
                                        "description.schedule": "PT"
                                    }
                                }]
                            }
                        }, {
                            "range": {
                                "description.wage.min": {
                                    "gte": 11
                                }
                            }
                        }]
                    ]
                }
            }
        }
    }
}
```


Example of building a boosted text search query:
```
      const fieldBoosts = {
        'description.title': 5,
        'description.what': 1
      };

      const request = new QueryBuilder()
        .multiFieldTextSearchWithBoost('sommelier', fieldBoosts)
        .build();
```

which would generate the following request:
```
{
    "fields": ["_source"],
    "query": {
        "filtered": {
            "query": {
                "bool": {
                    "should": [{
                        "match": {
                            "description.title": {
                                "query": "sommelier",
                                "boost": 5,
                                "fuzziness": "AUTO"
                            }
                        }
                    }, {
                        "match": {
                            "description.what": {
                                "query": "sommelier",
                                "boost": 1,
                                "fuzziness": "AUTO"
                            }
                        }
                    }]
                }
            },
            "filter": {}
        }
    }
}
```
