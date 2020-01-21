import { SlackMessage } from './types';
import slack from './slack';
import { WebAPICallResult } from '@slack/web-api';
import conf from '../config';
import { createSlackTs, slackTsToTime } from './utils/slack-timestamps';
import axios from 'axios';

const oneWeek: number = Date.now() - 6.048e8;

interface SlackChannelHistoryResult extends WebAPICallResult {
  messages: SlackMessage[];
}

function isBlankorSlackBot( message: SlackMessage ): boolean {
  const slackbot: string = 'USLACKBOT';
  return !message.text || !message.user || message.user === slackbot;
}

async function fetchMessages(
  latest?: string,
  oldest?: string
): Promise<Array<SlackMessage>> {
  const response = await slack.conversations.history({
    channel: conf.channel,
    count: 1000,
    latest,
    oldest
  }) as SlackChannelHistoryResult;

  return response.messages;
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
  let fromFetch: Array<SlackMessage>;
  const oneWeekSlackTs: string = createSlackTs( oneWeek );

  fromFetch = await fetchMessages();

  let oldestMsg: SlackMessage = fromFetch.slice( -1 ).pop();
  let oldestTime: number = slackTsToTime( oldestMsg.ts );

  // to avoid an infinite loop in case something goes wrong
  const stopLimit: number = 20;
  let count: number = 0;

  while ( oldestTime >= oneWeek && count != stopLimit ) {
    messages = [ ...messages, ...filterBotAndOld( fromFetch ) ];
    fromFetch = await fetchMessages( oldestMsg.ts );
    oldestMsg = fromFetch.slice( -1 ).pop();
    oldestTime = slackTsToTime( oldestMsg.ts );
    count++;
  }

  return messages;
}
