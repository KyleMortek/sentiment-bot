import { SlackMessage, User, UserMap } from './types';
import { WebAPICallResult } from '@slack/web-api';
import slack from './slack';

export default async function fetchUsers(
  messages: SlackMessage[]
): Promise<UserMap> {
  const users: UserMap = {};

  for ( const { user: id } of messages ) {
    if ( !users[ id ] ) {
      const details = await slack.users.info({
        user: id,
        include_locale: false
      }) as any;

      users[ id ] = details.user;
    }
  }

  return users;
}
