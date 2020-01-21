import Joi = require('@hapi/joi');
import { SlackMessage } from '../types';
import Model from '../classes/model';

const schema = Joi.object({
  edited:    Joi.object({ user: Joi.string(), ts: Joi.string() }),
  sentiment: Joi.number().required(),
  text:      Joi.string().required(),
  ts:        Joi.string().required(),
  type:      Joi.string().required(),
  updated:   Joi.date(),
  user:      Joi.string().required(),
});

interface MessageData extends SlackMessage {
  updated: Date;
}

export default class Message extends Model {

  data: MessageData;

  constructor( message: SlackMessage ) {
    super( 'Message', schema );

    this.data = {
      ...super.validate( message ),
      updated: new Date()
    };
  }

}
