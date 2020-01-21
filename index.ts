import { SlackMessage, UserMap, UserMapChatMeta } from './lib/types';
import fetchMessages from './lib/fetch-messages';
import fetchUsers from './lib/fetch-users';
import analyzer from './lib/analyzer';
import pipeline from './lib/pipeline';
import lowestScore from './lib/utils/lowest-score';
import findLowestScore from './lib/utils/find-lowest-score';
import ora = require('ora');

export const handler = async(): Promise<void> => {
  const Spinner = ora();

  try {
    // fetch the messages
    Spinner.text = 'Fetching messages';
    Spinner.start();
    const messages: SlackMessage[] = await fetchMessages();
    Spinner.succeed('Fetched messages');

    // fetch users
    Spinner.text = 'Fetching users';
    Spinner.start();
    const users: UserMap = await fetchUsers( messages );
    Spinner.succeed('Fetched users');

    // calculate sentiment scores, message counts, and any other meta data for
    // each user
    Spinner.text = 'Calculating sentiment scores';
    Spinner.start();
    const meta: UserMapChatMeta = analyzer( users, messages ); 
    Spinner.succeed('Calculated sentiment scores');

    // save info about who has the lowest score
    lowestScore.set( findLowestScore( meta ) );

    // Run the Data Pipeline
    await pipeline({ users, messages, meta });
  } catch ( err ) {
    Spinner.fail();
    console.error( 'Failed with error: ', err );
    process.exit( 1 );
  }
};
