'use strict';

const localesService = require('../locales');

const fakeMetricsService = {
  sendDidInitializeEvent() {},
  sendDidUpdateI18nLocalesEvent() {},
};

describe('Locales', () => {
  describe('setIsDefault', () => {
    test('Set isDefault to false', async () => {
      const get = jest.fn(() => Promise.resolve('en'));
      global.siapi = { store: () => ({ get }) };

      const locale = {
        code: 'fr',
        name: 'French',
      };

      const enrichedLocale = await localesService.setIsDefault(locale);
      expect(enrichedLocale).toMatchObject({
        ...locale,
        isDefault: false,
      });
    });

    test('Set isDefault to true', async () => {
      const get = jest.fn(() => Promise.resolve('en'));
      global.siapi = { store: () => ({ get }) };

      const locale = {
        code: 'en',
        name: 'English',
      };

      const enrichedLocale = await localesService.setIsDefault(locale);
      expect(enrichedLocale).toMatchObject({
        ...locale,
        isDefault: true,
      });
    });
  });

  describe('getDefaultLocale', () => {
    test('get default locale', async () => {
      const get = jest.fn(() => Promise.resolve('en'));
      global.siapi = { store: () => ({ get }) };

      const defaultLocaleCode = await localesService.getDefaultLocale();
      expect(defaultLocaleCode).toBe('en');
    });
  });

  describe('setDefaultLocale', () => {
    test('set default locale', async () => {
      const set = jest.fn(() => Promise.resolve());
      global.siapi = { store: () => ({ set }) };

      await localesService.setDefaultLocale({ code: 'fr-CA' });
      expect(set).toHaveBeenCalledWith({ key: 'default_locale', value: 'fr-CA' });
    });
  });

  describe('CRUD', () => {
    test('find', async () => {
      const locales = [{ name: 'French', code: 'fr' }];
      const find = jest.fn(() => Promise.resolve(locales));
      const query = jest.fn(() => ({ find }));
      global.siapi = { query };
      const params = { name_contains: 'en' };

      const localesFound = await localesService.find(params);
      expect(query).toHaveBeenCalledWith('locale', 'i18n');
      expect(find).toHaveBeenCalledWith(params);
      expect(localesFound).toMatchObject(locales);
    });

    test('findById', async () => {
      const locale = { name: 'French', code: 'fr' };
      const findOne = jest.fn(() => Promise.resolve(locale));
      const query = jest.fn(() => ({ findOne }));
      global.siapi = { query };

      const localeFound = await localesService.findById(1);
      expect(query).toHaveBeenCalledWith('locale', 'i18n');
      expect(findOne).toHaveBeenCalledWith({ id: 1 });
      expect(localeFound).toMatchObject(locale);
    });

    test('findByCode', async () => {
      const locale = { name: 'French', code: 'fr' };
      const findOne = jest.fn(() => Promise.resolve(locale));
      const query = jest.fn(() => ({ findOne }));
      global.siapi = { query };

      const localeFound = await localesService.findByCode('fr');
      expect(query).toHaveBeenCalledWith('locale', 'i18n');
      expect(findOne).toHaveBeenCalledWith({ code: 'fr' });
      expect(localeFound).toMatchObject(locale);
    });

    test('create', async () => {
      const locale = { name: 'French', code: 'fr' };
      const create = jest.fn(() => locale);
      const query = jest.fn(() => ({ create }));
      global.siapi = {
        query,
        plugins: {
          i18n: {
            services: { metrics: fakeMetricsService },
          },
        },
      };

      const createdLocale = await localesService.create(locale);
      expect(query).toHaveBeenCalledWith('locale', 'i18n');
      expect(create).toHaveBeenCalledWith(locale);
      expect(createdLocale).toMatchObject(locale);
    });

    test('update', async () => {
      const locale = { name: 'French', code: 'fr' };
      const update = jest.fn(() => locale);
      const query = jest.fn(() => ({ update }));
      global.siapi = {
        query,
        plugins: {
          i18n: {
            services: { metrics: fakeMetricsService },
          },
        },
      };

      const updatedLocale = await localesService.update({ code: 'fr' }, { name: 'French' });
      expect(query).toHaveBeenCalledWith('locale', 'i18n');
      expect(update).toHaveBeenCalledWith({ code: 'fr' }, { name: 'French' });
      expect(updatedLocale).toMatchObject(locale);
    });

    test('delete', async () => {
      const locale = { name: 'French', code: 'fr' };
      const deleteFn = jest.fn(() => locale);
      const findOne = jest.fn(() => locale);
      const isLocalizedContentType = jest.fn(() => true);
      const query = jest.fn(() => ({ delete: deleteFn, findOne }));
      global.siapi = {
        query,
        plugins: {
          i18n: {
            services: { metrics: fakeMetricsService, 'content-types': { isLocalizedContentType } },
          },
        },
        contentTypes: { 'application::country.country': {} },
      };

      const deletedLocale = await localesService.delete({ id: 1 });
      expect(query).toHaveBeenCalledWith('locale', 'i18n');
      expect(deleteFn).toHaveBeenCalledWith({ id: 1 });
      expect(deletedLocale).toMatchObject(locale);
    });

    test('delete - not found', async () => {
      const locale = { name: 'French', code: 'fr' };
      const deleteFn = jest.fn(() => locale);
      const findOne = jest.fn(() => undefined);
      const query = jest.fn(() => ({ delete: deleteFn, findOne }));
      global.siapi = {
        query,
        plugins: {
          i18n: {
            services: { metrics: fakeMetricsService },
          },
        },
      };

      const deletedLocale = await localesService.delete({ id: 1 });
      expect(query).toHaveBeenCalledWith('locale', 'i18n');
      expect(deleteFn).not.toHaveBeenCalled();
      expect(deletedLocale).toBeUndefined();
    });
  });

  describe('initDefaultLocale', () => {
    test('create default local if none exists', async () => {
      const count = jest.fn(() => Promise.resolve(0));
      const create = jest.fn(() => Promise.resolve());
      const set = jest.fn(() => Promise.resolve());

      global.siapi = {
        query: () => ({
          count,
          create,
        }),
        store: () => ({
          set,
        }),
        plugins: {
          i18n: {
            services: {
              metrics: fakeMetricsService,
            },
          },
        },
      };

      await localesService.initDefaultLocale();
      expect(count).toHaveBeenCalledWith();
      expect(create).toHaveBeenCalledWith({
        name: 'English (en)',
        code: 'en',
      });
      expect(set).toHaveBeenCalledWith({ key: 'default_locale', value: 'en' });
    });

    test('does not create default local if one already exists', async () => {
      const count = jest.fn(() => Promise.resolve(1));
      const create = jest.fn(() => Promise.resolve());
      const set = jest.fn(() => Promise.resolve());

      global.siapi = {
        query: () => ({
          count,
          create,
        }),
        store: () => ({
          set,
        }),
      };

      await localesService.initDefaultLocale();
      expect(count).toHaveBeenCalledWith();
      expect(create).not.toHaveBeenCalled();
      expect(set).not.toHaveBeenCalled();
    });
  });
});
