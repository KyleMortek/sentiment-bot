import { SlackMessage, UserMap, UserMapChatMeta } from './lib/types';
import fetchMessages from './lib/fetch-messages';
import fetchUsers from './lib/fetch-users';
import analyzer from './lib/analyzer';
import pipeline from './lib/pipeline';
import lowestScore from './lib/utils/lowest-score';
import findLowestScore from './lib/utils/find-lowest-score';

export const handler = async(): Promise<void> => {
  // fetch the messages
  const messages: SlackMessage[] = await fetchMessages();

  // fetch users
  const users: UserMap = await fetchUsers( messages );

  // calculate sentiment scores, message counts, and any other meta data for
  // each user
  const meta: UserMapChatMeta = analyzer( users, messages ); 

  // save info about who has the lowest score
  lowestScore.set( findLowestScore( meta ) );

  // Run the Data Pipeline
  await pipeline({ users, messages, meta });
};
