import * as ElasticSearch from 'elasticsearch';

export default function createESClient(esSettings) {
  return new ElasticSearch.Client(esSettings);
}
