'use strict';

const { pick } = require('lodash/fp');

const { createTestBuilder } = require('../../../../test/helpers/builder');
const { createSiapiInstance } = require('../../../../test/helpers/siapi');
const { createAuthRequest } = require('../../../../test/helpers/request');

let siapi;
let rq;
let data = {
  products: [],
  shops: [],
};

const productModel = {
  pluginOptions: {
    i18n: {
      localized: true,
    },
  },
  attributes: {
    name: {
      type: 'string',
    },
  },
  connection: 'default',
  name: 'product',
  description: '',
  collectionName: '',
};

const shopModel = {
  pluginOptions: {
    i18n: {
      localized: true,
    },
  },
  attributes: {
    name: {
      type: 'string',
    },
    products: {
      dominant: true,
      nature: 'manyToMany',
      target: 'application::product.product',
      targetAttribute: 'shops',
    },
  },
  connection: 'default',
  name: 'shop',
};

const shops = [
  {
    name: 'market',
    locale: 'en',
  },
];

const products = ({ shop }) => {
  const shops = [shop[0].id];

  const entries = [
    {
      name: 'pomodoro',
      shops,
      locale: 'it',
    },
    {
      name: 'apple',
      shops,
      locale: 'en',
    },
  ];

  return entries;
};

describe('i18n - Relation-list route', () => {
  const builder = createTestBuilder();

  beforeAll(async () => {
    await builder
      .addContentTypes([productModel, shopModel])
      .addFixtures(shopModel.name, shops)
      .addFixtures(productModel.name, products)
      .build();

    siapi = await createSiapiInstance();
    rq = await createAuthRequest({ siapi });

    data.shops = builder.sanitizedFixturesFor(shopModel.name, siapi);
    data.products = builder.sanitizedFixturesFor(productModel.name, siapi);
  });

  afterAll(async () => {
    await siapi.destroy();
    await builder.cleanup();
  });

  test('Can filter on default locale', async () => {
    const res = await rq({
      method: 'POST',
      url: '/content-manager/relations/application::shop.shop/products',
    });

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toStrictEqual(pick(['_id', 'id', 'name'], data.products[1]));
  });

  test('Can filter on any locale', async () => {
    const res = await rq({
      method: 'POST',
      url: '/content-manager/relations/application::shop.shop/products',
      qs: { _locale: 'it' },
    });

    expect(res.body).toHaveLength(1);
    expect(res.body[0]).toStrictEqual(pick(['_id', 'id', 'name'], data.products[0]));
  });
});
