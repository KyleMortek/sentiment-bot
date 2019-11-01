import slack from '../../slack';
import { PipelineStep } from '../../types';
import conf from '../../../config';

const postToSlack: PipelineStep = async({ slackMsg }) => {
  try {
    console.log('posting to slack');

    await slack.chat.postMessage({
      channel: conf.sentiment_channel,
      blocks: JSON.stringify( slackMsg ) as any,
      text: ''
    });
  } catch( err ) {
    console.error( 'Failed to send message: ', err );
  }
};

export default postToSlack;

