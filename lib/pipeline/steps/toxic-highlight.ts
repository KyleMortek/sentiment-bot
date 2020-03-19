import lowestScore from '../../utils/lowest-score';
import { UserMap, PipelineStep, SlackMessage } from '../../types';

// Worst 5 messages
function collectMostToxic(
  messages: SlackMessage[],
  users:    UserMap
): Array<string> {
  return [ ...messages ]
    .sort( ( a, b ) => a.sentiment - b.sentiment )
    .splice( 0, 10 )
    .map( message => {
      return `"${ message.text }" -${ users[ message.user ].real_name }`;
    });
}

const step = ({ users, messages, slackMsg, meta }) => {
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

const toxicHighlights: PipelineStep = {
  step,
  preMsg: 'Adding highlights to slack message',
  postMsg: 'Added highlights to slack message'
};

export default toxicHighlights;
