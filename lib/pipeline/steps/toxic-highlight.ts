import lowestScore from '../../utils/lowest-score';
import { PipelineStep, SlackMessage } from '../../types';

// Worst 5 messages from the user
function collectSample( messages: SlackMessage[] ): Array<string> {
  return [ ...messages ]
    .sort( ( a, b ) => a.sentiment - b.sentiment )
    .splice( 0, 5 )
    .map( message => '"' + message.text + '"' );
}

function messagesForUser(
  id:       string,
  messages: SlackMessage[]
): SlackMessage[] {
  return messages.filter( message => message.user === id );
}

const toxicHighlights: PipelineStep = ({ users, messages, slackMsg, meta }) => {
  console.log('adding highlights for toxic user');

  let messagesFromUser: SlackMessage[];
  const lowestScoring: string = lowestScore.get().userId;

  messagesFromUser = messagesForUser( lowestScoring, messages );

  const sample: Array<string> = collectSample( messagesFromUser );

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
      text: '```' + sample.join('\n') + '```'
    }
  });
};

export default toxicHighlights;
