export interface SlackMessage {
  readonly ts:          string;
  readonly text:        string;
  readonly user:        string;
  readonly type:        string;
  readonly attachments: [];
  sentiment:             number;
}

export interface User {
  readonly id:                  string;
  readonly team_id:             string;
  readonly name:                string;
  readonly deleted:             boolean;
  readonly color:               string;
  readonly real_name:           string;
  readonly tz:                  string;
  readonly tz_label:            string;
  readonly tz_offset:           number;
  readonly profile:             {};
  readonly is_admin:            boolean;
  readonly is_owner:            boolean;
  readonly is_primary_owner:    boolean;
  readonly is_restricted:       boolean;
  readonly is_ultra_restricted: boolean;
  readonly is_bot:              boolean;
  readonly is_app_user:         boolean;
  readonly has_2fa:             boolean;
}

export interface UserMap {
  [ userId: string ]: User
}

export interface UserMapChatMeta {
  [ userId: string ]: {
    msgCount:  number;
    sentiment: number;
  }
}

export interface PipelineStepArguments {
  readonly users:    UserMap;
  readonly messages: SlackMessage[];
  readonly meta:     UserMapChatMeta;
  slackMsg?:         Array<any>;
}

export interface PipelineStep {
  step( PipelineStepArguments ): void,
  preMsg?:                       string,
  postMsg?:                      string
}

export interface LowestScoreUser {
  userId: string;
  score:  number;
}
