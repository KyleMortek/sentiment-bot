import lowestScore from '../../utils/lowest-score';

import {
  PipelineStep,
  SlackMessage,
  UserMap,
  UserMapChatMeta
} from '../../types';

function createHeader( messages: SlackMessage[] ): string {
  const count: number = messages.length;
  return `*Sentiment - last 7 days (${count} messages )* :hammer_time:`;
}

function createMessageCounts( users: UserMap, meta: UserMapChatMeta): string {
  let str: string = '```                                                  \n';
  str += 'Message Counts: \n\n';

  for ( const userId of Object.keys( meta ) ) {
    const { real_name: name } = users[ userId ];
    const { msgCount }        = meta[ userId ];

    // Add user's sentiment to message
    str += `${( name + ':' ).padEnd( 20, ' ' )} ${msgCount}\n`;
  }

  return str + '```';
}

function createScores( meta: UserMapChatMeta, users: UserMap): string {
  let scores: string = '```                                                \n';
  scores += 'Sentiment: \n\n';

  for ( const userId of Object.keys( meta ) ) {
    const { real_name: name } = users[ userId ];
    const { sentiment }       = meta[ userId ];

    // Add user's sentiment to message
    scores += `${( name + ':' ).padEnd( 20, ' ' )} ${sentiment.toFixed( 6 )}\n`;
  }

  return scores + '```';
}

const createMessage: PipelineStep = ({ users, messages, slackMsg, meta }) => {
  console.log('creating message');

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: createHeader( messages ) 
    }
  });

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: createScores( meta, users )
    }
  });

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: createMessageCounts( users, meta )
    }
  });

  const lowestUserId: string = lowestScore.get().userId;
  const lowestName: string   = users[ lowestUserId ].real_name;

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:biohazard_sign: *${lowestName} toxic again this week.*`
    }
  });
};

export default createMessage;
