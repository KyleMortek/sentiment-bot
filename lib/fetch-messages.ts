import { SlackMessage } from './types';
import slack from './slack';
import { WebAPICallResult } from '@slack/web-api';
import conf from '../config';
import { createSlackTs, slackTsToTime } from './utils/slack-timestamps';

const oneWeek: number = Date.now() - 6.048e8;

interface SlackChannelHistoryResult extends WebAPICallResult {
  messages: SlackMessage[];
}

function isBlankorSlackBot( message: SlackMessage ): boolean {
  const slackbot: string = 'USLACKBOT';
  return !message.text || !message.user || message.user === slackbot;
}

async function *last1kMessages(): AsyncGenerator<SlackMessage[], any, any> {
  let nextCur: string;
  let hasMore: boolean = true;

  while ( hasMore ) {
    const response = await slack.conversations.history({
      channel: conf.channel,
      count: 1000,
      cursor: nextCur || undefined
    }) as SlackChannelHistoryResult;

    if ( !response.ok ) {
      throw 'Error fetching slack messages';
    }

    nextCur = response.response_metadata.next_cursor;
    hasMore = Boolean( response.has_more );
    yield response.messages;
  }
}

function filterBotAndOld( messages: SlackMessage[] ) {
  let filtered: SlackMessage[] = [];

  for ( const message of messages ) {
    if ( isBlankorSlackBot( message ) ) {
      continue;
    }

    // older than 1 week
    if ( slackTsToTime( message.ts ) < oneWeek ) {
      break;
    }

    filtered.push( message );
  }

  return filtered;
}

export default async function fetchAllMessages(): Promise<Array<SlackMessage>> {
  let messages: SlackMessage[] = [];
  const oneWeekSlackTs: string = createSlackTs( oneWeek );

  for await ( const fetched of last1kMessages() ) {
    messages = [ ...messages, ...fetched ];

    if ( fetched[ fetched.length - 1 ].ts < oneWeekSlackTs ) {
      break;
    }
  }

  return filterBotAndOld( messages );
}
