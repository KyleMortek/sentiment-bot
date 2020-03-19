import { PipelineStep } from '../../types';
import createMessage from './create-message';
import sendSlackMsg from './send-slack-msg';
import toxicHighlight from './toxic-highlight';
import save from './save';
import conf from '../../../config';

const steps: PipelineStep[] = [
  createMessage,
  toxicHighlight,
  /* save */
];

if ( !conf.dont_post ) {
  steps.push( sendSlackMsg );
}

export default steps;
