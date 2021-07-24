'use strict';

const { prop } = require('lodash/fp');

const getCoreStore = () =>
  siapi.store({
    environment: '',
    type: 'plugin',
    name: 'i18n',
  });

// retrieve a local service
const getService = name => {
  return prop(`i18n.services.${name}`, siapi.plugins);
};

module.exports = {
  getService,
  getCoreStore,
};
