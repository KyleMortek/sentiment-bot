import slack from '../../slack';
import { PipelineStep } from '../../types';
import conf from '../../../config';

const step = async({ slackMsg }) => {
  await slack.chat.postMessage({
    channel: conf.sentiment_channel,
    blocks:  JSON.stringify( slackMsg ) as any,
    text:    ''
  });
};

const postToSlack: PipelineStep = {
  step,
  preMsg:  'Posting to slack',
  postMsg: 'Posted to slack'
};

export default postToSlack;

