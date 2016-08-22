import { DefaultPageSize } from './enums';

export function createIndex(client, index, mappings) {
  if (typeof index !== String) {
    return new Error('Index must be a string');
  }
  const request = {
    index,
    body: mappings
  };
  // return a promise
  return client.indices.create(request)
}

export function deleteIndex(client, index) {
  if (typeof index !== String) {
    return new Error('Index must be a string');
  }
  const request = {
    index
  };
  // return a promise
  return client.indices.delete(request);
}

export function index(client, index, { type, id, body }) {
  // todo param checks
  const request = {
    index,
    type,
    id,
    body
  };
  // return a promise
  return client.index(request);
}


export function update(client, index, { type, id, body }) {
  // todo param checks
  const request = {
    index,
    type,
    id,
    body
  };
  // return a promise
  return client.update(request);
}

export function updateProperties(client, index, { type, id, properties }) {
  // todo param checks
  const body = {
    doc: properties
  };

  return update(client, index, {
    type,
    id,
    body
  });
}

export function deleteItem(client, index, { type, id }) {
  // todo param checks
  const request = {
    index,
    type,
    id
  };
  // return a promise
  return client.delete(request);
}

export function exists(client, index, { type, id }) {
  // todo param checks
  const request = {
    index,
    type,
    id
  };
  return client.exists(request);
}

export function search(client, index, { type, body, from = 0, size = DefaultPageSize }) {
  // todo param checks
  const request = {
    index,
    type,
    body,
    from,
    size
  };
  return client.search(request);
}

export function findAllIds(client, index, type) {
  // todo param checks
  // batch size for each scroll
  const size = 100;
  const scrollDuration = '1m';

  // match all documents and only return _id fields
  const body = {
    'query': {
      'match_all': {}
    },
    'fields': []
  };

  const request = {
    index,
    type,
    body,
    size,
    scroll: scrollDuration,
    search_type: 'scan'
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
