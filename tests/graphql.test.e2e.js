'use strict';

// Helpers.
const { createTestBuilder } = require('../../../test/helpers/builder');
const { createSiapiInstance } = require('../../../test/helpers/siapi');
const { createAuthRequest } = require('../../../test/helpers/request');

const builder = createTestBuilder();
let siapi;
let rq;
let graphqlQuery;
let localeId;

const recipesModel = {
  attributes: {
    name: {
      type: 'string',
    },
  },
  pluginOptions: {
    i18n: {
      localized: true,
    },
  },
  connection: 'default',
  name: 'recipes',
  description: '',
  collectionName: '',
};

describe('Test Graphql API create localization', () => {
  beforeAll(async () => {
    await builder.addContentType(recipesModel).build();

    siapi = await createSiapiInstance();
    rq = await createAuthRequest({ siapi });

    graphqlQuery = body => {
      return rq({
        url: '/graphql',
        method: 'POST',
        body,
      });
    };

    const locale = await siapi.query('locale', 'i18n').create({
      code: 'fr',
      name: 'French',
    });

    localeId = locale.id;
  });

  afterAll(async () => {
    await siapi.query('locale', 'i18n').delete({ id: localeId });
    await siapi.query('recipes').delete();
    await siapi.destroy();
    await builder.cleanup();
  });

  test('Create localization for a model with plural name', async () => {
    const createResponse = await graphqlQuery({
      query: /* GraphQL */ `
        mutation createRecipe($input: createRecipeInput) {
          createRecipe(input: $input) {
            recipe {
              id
              name
              locale
            }
          }
        }
      `,
      variables: {
        input: {
          data: {
            name: 'Recipe Name',
          },
        },
      },
    });

    expect(createResponse.statusCode).toBe(200);
    expect(createResponse.body.data.createRecipe.recipe).toMatchObject({
      name: 'Recipe Name',
      locale: 'en',
    });

    const recipeId = createResponse.body.data.createRecipe.recipe.id;

    const createLocalizationResponse = await graphqlQuery({
      query: /* GraphQL */ `
        mutation createRecipeLocalization($input: updateRecipeInput!) {
          createRecipeLocalization(input: $input) {
            id
            name
            locale
          }
        }
      `,
      variables: {
        input: {
          where: {
            id: recipeId,
          },
          data: {
            name: 'Recipe Name fr',
            locale: 'fr',
          },
        },
      },
    });

    expect(createLocalizationResponse.statusCode).toBe(200);
    expect(createLocalizationResponse.body.data.createRecipeLocalization).toMatchObject({
      name: 'Recipe Name fr',
      locale: 'fr',
    });
  });
});
