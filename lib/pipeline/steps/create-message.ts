import { PipelineStep } from '../../types';

const createMessage: PipelineStep = ({ users, messages, slackMsg, meta }) => {
  console.log('creating message');

  let header = `*Sentiment of the last 7 days (${ messages.length } messages )*`;
  header += `:hammer_time:`;

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: header 
    }
  });

  let lowest = { name: '', sentiment: Infinity };
  let scores: string = '```                                    \n';

  for( const userId of Object.keys( meta ) ) {
    const { real_name: name } = users[ userId ];
    const { sentiment } = meta[ userId ];

    // Add user's sentiment to message
    scores += `${(name + ':').padEnd( 20, ' ' )} ${sentiment.toFixed( 6 )}\n`;

    // Check if this user has the lowest (so far) sentiment score
    lowest = sentiment < lowest.sentiment ? { name, sentiment } : lowest;
  }

  scores += '```';

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: scores
    }
  });

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:biohazard_sign: *${lowest.name} toxic again this week.*`
    }
  });
};

export default createMessage;
