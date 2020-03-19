import Joi from '@hapi/joi';

export default abstract class Model {

  constructor( readonly name, readonly schema ) {}

  protected validate<T> ( payload: T ): T {
    /**
     * I dont care if slack adds new stuff, I just want to assert that stuff
     * that was there previously has not changed. Becuase,
     *
     * 1. I make sure any custom properties added to the database will override
     *    any Slack defaults.
     * 2. If I build out a feature, I only want to assert that existing
     *    properties on the document haven't changed.
     **/
    const opts = { allowUnknown: true };

    const { value, error } = this.schema.validate( payload, opts );

    if ( error ) {
      throw `
      Problem creating ${ this.name }
      Model: ${ error }
      Data: ${ JSON.stringify( payload, null, 2 ) }
      `;
    }

    return value;
  }

}
