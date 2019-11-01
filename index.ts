import { SlackMessage, UserMap, UserMapChatMeta } from './lib/types';
import fetchMessages from './lib/fetch-messages';
import fetchUsers from './lib/fetch-users';
import analyzer from './lib/analyzer';
import pipeline from './lib/pipeline';

export const handler = async(): Promise<void> => {
  // fetch the messages
  const messages: SlackMessage[] = await fetchMessages();

  // fetch users
  const users: UserMap = await fetchUsers( messages );

  // calculate sentiment scores, message counts, and any other meta data for
  // each user
  const meta: UserMapChatMeta = analyzer( users, messages ); 

  // Run the Data Pipeline
  await pipeline({ users, messages, meta });
};
