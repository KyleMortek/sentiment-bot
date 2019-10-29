import {
  PipelineStep,
  SlackMessage,
  UserMap,
  UserMapChatMeta
} from '../../types';

function createHeader( messages: SlackMessage[] ): string {
  const count = messages.length;
  return `*Sentiment - last 7 days (${count} messages )* :hammer_time:`;
}

function createScores( meta: UserMapChatMeta, users: UserMap ): string {
  let scores: string = '```                                    \n';

  for( const userId of Object.keys( meta ) ) {
    const { real_name: name } = users[ userId ];
    const { sentiment } = meta[ userId ];

    // Add user's sentiment to message
    scores += `${(name + ':').padEnd( 20, ' ' )} ${sentiment.toFixed( 6 )}\n`;
  }

  scores += '```';
  return scores;
}

function findLowestScore( meta: UserMapChatMeta ): string {
  let lowest: number = Infinity;
  let user: string;

  for ( const userId of Object.keys( meta ) ) {
    const { sentiment } = meta[ userId ];

    if ( sentiment < lowest ) {
      lowest = sentiment;
      user = userId;
    }
  }

  return user;
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

  const lowestUserId: string = findLowestScore( meta );
  const lowestName: string = users[ lowestUserId ].real_name;

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:biohazard_sign: *${lowestName} toxic again this week.*`
    }
  });
};

export default createMessage;
