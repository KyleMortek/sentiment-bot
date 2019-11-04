import lowestScore from '../../utils/lowest-score';
import { UserMap, PipelineStep, SlackMessage } from '../../types';

// Worst 5 messages
function collectMostToxic(
  messages: SlackMessage[],
  users:    UserMap
): Array<string> {
  return [ ...messages ]
    .sort( ( a, b ) => a.sentiment - b.sentiment )
    .splice( 0, 5 )
    .map( message => {
      return `"${ message.text }" -${ users[ message.user ].real_name }`;
    });
}

const toxicHighlights: PipelineStep = ({ users, messages, slackMsg, meta }) => {
  console.log('adding highlights');

  const highlights: Array<string> = collectMostToxic( messages, users );

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: ':dumpsterfire: Some highlights from the dumpster fire:'
    }
  });

  slackMsg.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: '```' + highlights.join('\n') + '```'
    }
  });
};

export default toxicHighlights;
