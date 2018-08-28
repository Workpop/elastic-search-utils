import { get, omit, map, size as sizeLib } from 'lodash';
import * as ElasticSearch from 'elasticsearch';
import { DefaultPageSize } from './enums';

export default class ElasticStore {
  constructor({
    esClient,
    logger,
    indexName = 'candidate-review',
    typeName = 'application',
  }) {
    this.esClient = esClient;
    this.logger = logger;
    this.typeName = typeName;
    this.indexName = indexName;
  }

  async index(doc: Object) {
    this.logger.trace(
      `indexing app ${JSON.stringify(doc)}`,
      this.indexName,
      this.typeName
    );

    try {
      await this.esClient.index({
        index: this.indexName,
        type: this.typeName,
        id: get(doc, '_id'),
        body: omit(doc, '_id'),
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

  async unindex(id: string) {
    this.logger.trace(`unindexing doc _id=${id}`);
    try {
      await this.esClient.delete({
        index: this.indexName,
        type: this.typeName,
        id,
      });
    } catch (e) {
      this.logger.error(e);
    }
  }

  async get(id: string): ?Object {
    try {
      const doc = await this.findById(id);
      return {
        ...get(doc, '_source'),
        _id: id,
      };
    } catch (err) {
      this.logger.error(err);
      // document does not exist
    }
  }

  consolidateHit(hit) {
    const consolidated = Object.assign({}, hit._source, { _id: hit._id });

    // if we have calculated values
    if (hit.fields) {
      Object.assign(consolidated, hit.fields);
    }

    if (hit.sort) {
      Object.assign(consolidated, { _sort: hit.sort });
    }

    if (hit._score) {
      Object.assign(consolidated, { _score: hit._score });
    }

    return consolidated;
  }

  isConnectionError(err) {
    return (
      err instanceof ElasticSearch.errors.NoConnections ||
      err instanceof ElasticSearch.errors.ConnectionFault ||
      err instanceof ElasticSearch.errors.RequestTimeout
    );
  }

  async createIndex(mappings = {}) {
    if (typeof this.indexName !== 'string') {
      return new Error('Index must be a string');
    }
    const request = {
      index: this.indexName,
      body: mappings,
    };
    // return a promise
    return await this.esClient.indices.create(request);
  }

  async indexExists() {
    return await this.esClient.indices.exists({
      index: this.indexName,
    });
  }

  async deleteIndex() {
    if (typeof this.indexName !== 'string') {
      return new Error('Index must be a string');
    }
    const request = {
      index: this.indexName,
    };
    // return a promise
    return await this.esClient.indices.delete(request);
  }

  async updateTypeMapping(mapping) {
    return await this.esClient.indices.putMapping({
      index: this.indexName,
      type: this.typeName,
      body: {
        properties: mapping,
      },
    });
  }

  async _update({ id, body }) {
    // todo param checks
    const request = {
      index: this.indexName,
      type: this.typeName,
      id,
      body,
    };
    // return a promise
    return await this.esClient.update(request);
  }

  async updateProperties({ id, properties }) {
    // todo param checks
    const body = {
      doc: properties,
    };

    return await this._update({
      id,
      body,
    });
  }

  async exists({ id }) {
    // todo param checks
    const request = {
      index: this.indexName,
      type: this.typeName,
      id,
    };
    return await this.esClient.exists(request);
  }

  async rawSearch({ body, from = 0, size = DefaultPageSize }) {
    // todo param checks
    const request = {
      index: this.indexName,
      type: this.typeName,
      body,
      from,
      size,
    };

    return await this.esClient.search(request);
  }

  async search({ body, from = 0, size = DefaultPageSize }) {
    // todo param checks
    const request = {
      index: this.indexName,
      type: this.typeName,
      body,
      from,
      size,
    };

    const response = await this.esClient.search(request);

    return {
      data: map(get(response, 'hits.hits'), this.consolidateHit),
      total: get(response, 'hits.total'),
    };
  }

  async findById(id) {
    const request = {
      index: this.indexName,
      type: this.typeName,
      id,
    };

    return await this.esClient.get(request);
  }

  async findAllIds(searchBody) {
    // todo param checks
    // batch size for each scroll
    const batchSize = 100;
    const scrollDuration = '1m';

    // match all documents and only return _id fields
    const body = searchBody || {
      query: {
        match_all: {},
      },
      stored_fields: [],
    };

    const request = {
      index: this.indexName,
      type: this.typeName,
      body,
      size: batchSize,
      scroll: scrollDuration,
      sort: ['_doc'],
    };

    let response = await this.esClient.search(request);

    let ids = [];
    let scrollComplete = false;
    do {
      const idsToAppend = map(response.hits.hits, '_id');
      ids = ids.concat(idsToAppend);

      scrollComplete = ids.length >= response.hits.total;
      if (!scrollComplete) {
        response = await this.esClient.scroll({
          scrollId: response._scroll_id,
          scroll: scrollDuration,
        });
        if (sizeLib(response.hits.hits) === 0) {
          scrollComplete = true;
        }
      }
    } while (!scrollComplete);

    return ids;
  }

  async bulk(body) {
    const request = {
      index: this.indexName,
      type: this.typeName,
      body,
    };

    this.logger.trace('processing bulk request', JSON.stringify(body));

    return await this.esClient.bulk(request);
  }
}
