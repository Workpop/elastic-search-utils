import { DefaultPageSize } from './enums';

export function createIndex(client, indexName, mappings) {
  if (typeof index !== 'string') {
    return new Error('Index must be a string');
  }
  const request = {
    index: indexName,
    body: mappings,
  };
  // return a promise
  return client.indices.create(request);
}

export function indexExists(client, indexName) {
  return client.indices.exists({
    index: indexName,
  });
}

export function deleteIndex(client, indexName) {
  if (typeof indexName !== 'string') {
    return new Error('Index must be a string');
  }
  const request = {
    index: indexName,
  };
  // return a promise
  return client.indices.delete(request);
}

export function updateTypeMapping(client, indexName, type, mapping) {
  return client.indices.putMapping({
    index: indexName,
    type,
    body: {
      properties: mapping,
    },
  });
}

export function index(client, indexName, { type, id, body }) {
  // todo param checks
  const request = {
    index: indexName,
    type,
    id,
    body,
  };
  // return a promise
  return client.index(request);
}


export function update(client, indexName, { type, id, body }) {
  // todo param checks
  const request = {
    index: indexName,
    type,
    id,
    body,
  };
  // return a promise
  return client.update(request);
}

export function updateProperties(client, indexName, { type, id, properties }) {
  // todo param checks
  const body = {
    doc: properties,
  };

  return update(client, indexName, {
    type,
    id,
    body,
  });
}

export function deleteItem(client, indexName, { type, id }) {
  // todo param checks
  const request = {
    index: indexName,
    type,
    id,
  };
  // return a promise
  return client.delete(request);
}

export function exists(client, indexName, { type, id }) {
  // todo param checks
  const request = {
    index: indexName,
    type,
    id,
  };
  return client.exists(request);
}

export function search(client, indexName, { type, body, from = 0, size = DefaultPageSize }) {
  // todo param checks
  const request = {
    index: indexName,
    type,
    body,
    from,
    size,
  };
  return client.search(request);
}

export function findAllIds(client, indexName, type) {
  // todo param checks
  // batch size for each scroll
  const size = 100;
  const scrollDuration = '1m';

  // match all documents and only return _id fields
  const body = {
    'query': {
      'match_all': {},
    },
    'fields': [],
  };

  const request = {
    index: indexName,
    type,
    body,
    size,
    scroll: scrollDuration,
    search_type: 'scan',
  };


  return client.search(request).then((err, data) => {
    let ids = [];
    let scrollComplete = false;

    return ids;
  });
}

export function consolidateHit(hit) {
  const consolidated = Object.assign({},
    hit._source,
    {_id: hit._id}
  );

  // if we have calculated values
  if (hit.fields) {
    Object.assign(consolidated, hit.fields);
  }

  if (hit.sort) {
    Object.assign(consolidated, {_sort: hit.sort});
  }

  if (hit._score) {
    Object.assign(consolidated, {_score: hit._score});
  }

  return consolidated;
}

export function isConnectionError(client, err) {
  return (err instanceof client.errors.NoConnections) ||
    (err instanceof client.errors.ConnectionFault) ||
    (err instanceof client.errors.RequestTimeout);
}
