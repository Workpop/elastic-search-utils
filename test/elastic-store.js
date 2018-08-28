import { expect } from 'chai';
import { intersection } from 'lodash';
import * as ElasticSearch from 'elasticsearch';
import Logger from '@workpop/simple-logger';
import { ElasticStore, QueryBuilder, createESClient } from '../src';

const esClient = createESClient({
  host: 'localhost:9200',
});

const store = new ElasticStore({
  logger: new Logger('elastic-store-test'),
  esClient,
  typeName: 'user',
  indexName: 'candidateusers',
});

const ids = ['16', '17', '18'];

describe('Test ElasticStore', function () {
  before(async () => {
    try {
      await store.createIndex();
      expect(await store.indexExists()).to.eql(true);
    } catch (e) {
      // index exists
    }
  });

  it('exists()', async function () {
    await store.unindex('1');

    expect(await store.exists({ id: '1' })).to.eql(false);

    await store.index({ _id: '1', name: 'Abhi' });

    expect(await store.exists({ id: '1' })).to.eql(true);

    await store.unindex('1');
  });

  it('get()', async function () {
    if (!(await store.exists({ id: '2' }))) {
      await store.index({ _id: '2', name: 'Gavin' });
    }

    const data = await store.get('2');

    expect(data.name).to.eql('Gavin');

    expect(data._id).to.eql('2');
  });

  it('findAllIds()', async function () {
    await store.index({ _id: '2', name: 'Gavin', jobId: '1337' });
    await store.index({ _id: '3', name: 'Foo', jobId: '1337' });
    await store.index({ _id: '4', name: 'Foo', jobId: '1337' });
    await store.index({ _id: '5', name: 'Foo', jobId: '1337' });

    const queryBuilder = new QueryBuilder();
    queryBuilder.filterExact('jobId', '1337');
    const body = queryBuilder.build();

    const docs = await store.findAllIds(body);
    const intersectionofids = intersection(docs, ['2', '3', '4', '5']);
    expect(intersectionofids.length).to.eql(4);
  });

  it('search()', async function () {
    const queryBuilder = new QueryBuilder();
    queryBuilder.filterExact('jobId', '1337');
    const body = queryBuilder.build();

    const docs = await store.search({ body, size: 2 });

    expect(docs.data.length).to.eql(2);
    expect(docs.total).to.eql(5);
  });

  it('rawSearch()', async function () {
    const queryBuilder = new QueryBuilder();
    queryBuilder.filterExact('jobId', '1337');
    const body = queryBuilder.build();

    const docs = await store.rawSearch({ body, size: 2 });

    expect(docs.hits.hits.length).to.eql(2);
    expect(docs.hits.total).to.eql(5);
  });

  it('bulk() - index', async function () {
    await store.index({ _id: '16', name: '16', bulkId: '1337' });
    await store.index({ _id: '17', name: '17', bulkId: '1337' });
    await store.index({ _id: '18', name: '18', bulkId: '1337' });

    const queryBuilder = new QueryBuilder();
    queryBuilder.filterExact('bulkId', '1337');
    const body = queryBuilder.build();

    const docs = await store.search({ body, size: 2 });

    expect(docs.total).to.eql(3);

    const searchBody = ids.map(
      (id: string): Object => {
        return {
          delete: {
            _id: id,
          },
        };
      }
    );

    const result = await store.bulk(searchBody);

    expect(result.items.length).to.eql(3);
  });

  it('updateProperties()', async function () {
    await store.index({ _id: '9', name: 'YoYo', applicationId: '1337' });
    let doc;
    doc = await store.get('9');

    expect(doc.name).to.eql('YoYo');

    await store.updateProperties({
      id: '9',
      properties: {
        name: 'AbhiAbhi',
      },
    });

    doc = await store.get('9');

    expect(doc.name).to.eql('AbhiAbhi');
  });

  it('isConnectionError()', () => {
    expect(store.isConnectionError(new Error())).to.eql(false);
    expect(
      store.isConnectionError(new ElasticSearch.errors.NoConnections())
    ).to.eql(true);
    expect(
      store.isConnectionError(new ElasticSearch.errors.ConnectionFault())
    ).to.eql(true);
    expect(
      store.isConnectionError(new ElasticSearch.errors.RequestTimeout())
    ).to.eql(true);
  });
});
