import { WebClient } from '@slack/web-api';
import conf from '../config';

export default new WebClient( conf.slack_token );

