'use strict';

const { yup, formatYupErrors } = require('siapi-utils');
const { get } = require('lodash/fp');

const handleReject = error => Promise.reject(formatYupErrors(error));

const validateGetNonLocalizedAttributesSchema = yup
  .object()
  .shape({
    model: yup.string().required(),
    id: yup.mixed().when('model', {
      is: model => get('kind', siapi.getModel(model)) === 'singleType',
      then: yup.siapiID().nullable(),
      otherwise: yup.siapiID().required(),
    }),
    locale: yup.string().required(),
  })
  .noUnknown()
  .required();

const validateGetNonLocalizedAttributesInput = data => {
  return validateGetNonLocalizedAttributesSchema
    .validate(data, { strict: true, abortEarly: false })
    .catch(handleReject);
};

module.exports = {
  validateGetNonLocalizedAttributesInput,
};
