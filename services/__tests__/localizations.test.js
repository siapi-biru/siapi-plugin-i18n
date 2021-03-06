'use strict';

const {
  assignDefaultLocale,
  syncLocalizations,
  syncNonLocalizedAttributes,
} = require('../localizations');

const locales = require('../locales');
const contentTypes = require('../content-types');

const model = {
  uid: 'test-model',
  pluginOptions: {
    i18n: {
      localized: true,
    },
  },
  attributes: {
    title: {
      type: 'string',
      pluginOptions: {
        i18n: {
          localized: true,
        },
      },
    },
    stars: {
      type: 'integer',
    },
  },
};

const allLocalizedModel = {
  uid: 'test-model',
  pluginOptions: {
    i18n: {
      localized: true,
    },
  },
  attributes: {
    title: {
      type: 'string',
      pluginOptions: {
        i18n: {
          localized: true,
        },
      },
    },
    stars: {
      type: 'integer',
      pluginOptions: {
        i18n: {
          localized: true,
        },
      },
    },
  },
};

const setGlobalSiapi = () => {
  global.siapi = {
    plugins: {
      i18n: {
        services: {
          locales,
          'content-types': contentTypes,
        },
      },
    },
  };
};

describe('localizations service', () => {
  describe('assignDefaultLocale', () => {
    test('Does not change the input if locale is already defined', async () => {
      setGlobalSiapi();
      const input = { locale: 'myLocale' };
      await assignDefaultLocale(input);

      expect(input).toStrictEqual({ locale: 'myLocale' });
    });

    test('Use default locale to set the locale on the input data', async () => {
      setGlobalSiapi();

      const getDefaultLocaleMock = jest.fn(() => 'defaultLocale');

      global.siapi.plugins.i18n.services.locales.getDefaultLocale = getDefaultLocaleMock;

      const input = {};
      await assignDefaultLocale(input);

      expect(input).toStrictEqual({ locale: 'defaultLocale' });
      expect(getDefaultLocaleMock).toHaveBeenCalled();
    });
  });

  describe('syncLocalizations', () => {
    test('Updates every other localizations with correct ids', async () => {
      setGlobalSiapi();

      const update = jest.fn();
      global.siapi.query = () => {
        return { update };
      };

      const localizations = [{ id: 2 }, { id: 3 }];
      const entry = { id: 1, locale: 'test', localizations };

      await syncLocalizations(entry, { model });

      expect(update).toHaveBeenCalledTimes(localizations.length);
      expect(update).toHaveBeenNthCalledWith(1, { id: 2 }, { localizations: [1, 3] });
      expect(update).toHaveBeenNthCalledWith(2, { id: 3 }, { localizations: [1, 2] });
    });
  });

  describe('syncNonLocalizedAttributes', () => {
    test('Does nothing if no localizations set', async () => {
      setGlobalSiapi();

      const update = jest.fn();
      global.siapi.query = () => {
        return { update };
      };

      const entry = { id: 1, locale: 'test' };

      await syncNonLocalizedAttributes(entry, { model });

      expect(update).not.toHaveBeenCalled();
    });

    test('Does not update the current locale', async () => {
      setGlobalSiapi();

      const update = jest.fn();
      global.siapi.query = () => {
        return { update };
      };

      const entry = { id: 1, locale: 'test', localizations: [] };

      await syncNonLocalizedAttributes(entry, { model });

      expect(update).not.toHaveBeenCalled();
    });

    test('Does not update if all the fields are localized', async () => {
      setGlobalSiapi();

      const update = jest.fn();
      global.siapi.query = () => {
        return { update };
      };

      const entry = { id: 1, locale: 'test', localizations: [] };

      await syncNonLocalizedAttributes(entry, { model: allLocalizedModel });

      expect(update).not.toHaveBeenCalled();
    });

    test('Updates locales with non localized fields only', async () => {
      setGlobalSiapi();

      const update = jest.fn();
      global.siapi.query = () => {
        return { update };
      };

      const entry = {
        id: 1,
        locale: 'test',
        title: 'Localized',
        stars: 1,
        localizations: [{ id: 2, locale: 'fr' }],
      };

      await syncNonLocalizedAttributes(entry, { model });

      expect(update).toHaveBeenCalledTimes(1);
      expect(update).toHaveBeenCalledWith({ id: 2 }, { stars: 1 });
    });
  });
});
