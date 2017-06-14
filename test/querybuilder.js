import { get, size } from 'lodash';
import {
  QueryBuilder,
  createESClient,
  SORT_TYPE_FIELD_ORDER,
} from '../src';

const expect = require('chai').expect;

const esClient = createESClient({
  host: 'localhost:9200',
});

describe('Test QueryBuilder', function () {
  it('querybuilder with one sort missing sort field should throw', function () {
    expect(
      function() {
        const qb = new QueryBuilder()
          .sortBy({sortType: SORT_TYPE_FIELD_ORDER});
        const body = qb.build();
      }
    ).to.throw();
  });

  it('querybuilder with one sort should succeed', function () {
    const qb = new QueryBuilder()
      .sortBy({
        sortType: SORT_TYPE_FIELD_ORDER,
        sortParams: {
          sortField: 'updatedAt',
        },
      });
    const body = qb.build();
    console.log(JSON.stringify(body));

    expect(size(get(body, 'sort'))).to.equal(1);
    const firstSort = get(body, 'sort.0');
    expect(firstSort).to.deep.equal({updatedAt: 'asc'});
  });

  it('querybuilder with two sort should succeed', function () {
    const qb = new QueryBuilder()
      .sortBy({
        sortType: SORT_TYPE_FIELD_ORDER,
        sortParams: {
          sortField: 'updatedAt',
        },
      })
      .sortBy({
        sortType: SORT_TYPE_FIELD_ORDER,
        sortParams: {
          sortField: '_uid',
          sortAscending: false,
        },
      });
    const body = qb.build();
    console.log(JSON.stringify(body));

    expect(size(get(body, 'sort'))).to.equal(2);
    const firstSort = get(body, 'sort.0');
    expect(firstSort).to.deep.equal({updatedAt: 'asc'});

    const secondSort = get(body, 'sort.1');
    expect(secondSort).to.deep.equal({_uid: 'desc'});
  });
});