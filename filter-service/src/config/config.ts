import * as Joi from 'joi';

export const configValidationSchema = Joi.object({
  FILTER_SERVICE_URL: Joi.string().default('0.0.0.0:50052'),
  USERS_DATA_PATH: Joi.string().default('./src/data/users.json'),
});
