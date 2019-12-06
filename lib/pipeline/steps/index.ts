import { PipelineStep } from '../../types';
import createMessage from './create-message';
import addGiphy from './giphy';
import sendSlackMsg from './send-slack-msg';
import toxicHighlight from './toxic-highlight';

const steps: PipelineStep[] = [
  createMessage,
  toxicHighlight,
  sendSlackMsg
];

export default steps;
