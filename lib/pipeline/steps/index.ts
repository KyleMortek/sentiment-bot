import { PipelineStep } from '../../types';
import createMessage from './create-message';
import addGiphy from './giphy';
import sendSlackMsg from './send-slack-msg';

const steps: PipelineStep[] = [
  createMessage,
  addGiphy,
  sendSlackMsg
];

export default steps;
