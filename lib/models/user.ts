import Joi = require('@hapi/joi');
import { User as UserType } from '../types';
import Model from '../classes/model';

const schema = Joi.object({
  color:               Joi.string(),
  deleted:             Joi.boolean(),
  has_2fa:             Joi.boolean(),
  id:                  Joi.string(),
  is_admin:            Joi.boolean(),
  is_app_user:         Joi.boolean(),
  is_bot:              Joi.boolean(),
  is_owner:            Joi.boolean(),
  is_primary_owner:    Joi.boolean(),
  is_restricted:       Joi.boolean(),
  is_ultra_restricted: Joi.boolean(),
  name:                Joi.string(),
  profile:             Joi.object(),
  real_name:           Joi.string(),
  team_id:             Joi.string(),
  tz:                  Joi.string(),
  tz_label:            Joi.string(),
  tz_offset:           Joi.number(),
  updated:             Joi.date()
});

interface UserData extends UserType {
  updated: Date;
}

export default class User extends Model {

  data: UserData;

  constructor( user: UserType ) {
    super( 'User', schema );

    this.data = {
      ...super.validate( user ),
      updated: new Date()
    };
  }

}
