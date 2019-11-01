/* This is the bulk of the work. This is all the stuff thats run after all
 * the needed data like messages, users, and metadata (sentiment, etc) has
 * been calculated. 
 * 
 * The pipeline is where the slack message should be created, the stats saved to
 * a database, slack messages sent, etc. This pipeline doesn't necessarily
 * collect or generarte data. Instead, its responsible for doing things -with-
 * the data.
 */

import steps from './steps';

async function pipeline({ users, messages, meta }): Promise<void> {
  const slackMsg: Array<any> = [];

  for ( const step of steps ) {
    await step({ users, messages, meta, slackMsg });
  }
};

export default pipeline;
