export interface SlackMessage {
  ts: string;
  text: string;
  user: string;
  type: 'message',
  team: string;
  client_msg_id: string;
  edited?: {
    user: string;
    ts: string;
  }
}

export interface User {
  id: string;
  team_id: string,
  name: string,
  deleted: boolean,
  color: string,
  real_name: string,
  tz: string;
  tz_label: string;
  tz_offset: number;
  profile: {};
  is_admin: boolean;
  is_owner: boolean;
  is_primary_owner: boolean;
  is_restricted: boolean;
  is_ultra_restricted: boolean;
  is_bot: boolean;
  is_app_user: boolean;
  updated: number;
  has_2fa: boolean;
}

export interface UserMap {
  [ userId: string ]: User
}

export interface UserMapChatMeta {
  [ userId: string ]: {
    msgCount: number;
    sentiment: number;
  }
}

export interface PipelineStepArguments {
  readonly users: UserMap;
  readonly messages: SlackMessage[];
  readonly meta: UserMapChatMeta;
  slackMsg?: Array<any>;  
}

export interface PipelineStep {
  ( PipelineStepArguments ): void
}
