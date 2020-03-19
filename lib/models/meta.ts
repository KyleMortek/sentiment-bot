import Joi = require('@hapi/joi');
import Model from '../classes/model';

const schema = Joi.object({
  user:      Joi.string(),
  sentiment: Joi.number(),
  msgCount:  Joi.number(),
  start:     Joi.date(),
  end:       Joi.date(),
  updated:   Joi.date()
});

interface MetaData {
  user:      string;
  sentiment: number;
  msgCount:  number;
  start:     Date,
  end:       Date,
  updated:   Date
}

export default class Meta extends Model {

  data: MetaData;

  constructor( meta ) {
    super( 'Meta', schema );

    this.data = {
      ...super.validate( meta ),
      updated: new Date()
    };
  }

}
