import { MongoClient } from 'mongodb';
import conf from '../../../config';
import ora = require('ora');
import Message from '../../models/message';
import User from '../../models/user';
import Meta from '../../models/meta';
import { slackTsToTime } from '../../utils/slack-timestamps'; 

import {
  User as UserType,
  PipelineStep,
  SlackMessage,
  UserMapChatMeta
} from '../../types';

let client;
let db;

async function connect() {
  if ( db ) return;
  const opts = { useUnifiedTopology: true, useNewUrlParser: true};
  client = await MongoClient.connect( conf.db.connString, opts );
  db = client.db('vandelay-industries');
}

async function saveUsers( users: UserType[] ): Promise<void> {
  const col = db.collection('users');
  
  // upsert users
  for ( const user of Object.values( users ) ) {
    const model: User = new User( user ); 
    const filter = { id: model.data.id };
    const opts = { upsert: true };
    await col.findOneAndReplace( filter, model.data, opts );
  }
}

function saveMessages( messages: SlackMessage[] ): Promise<void> {
  let toInsert = [];

  for ( const msg of messages ) {
    const model = new Message({
      attachments: msg.attachments,
      sentiment:   msg.sentiment,
      text:        msg.text,
      ts:          msg.ts,
      type:        msg.type,
      user:        msg.user
    });

    toInsert.push( model.data );
  }

  return db.collection('messages').insertMany( toInsert );
}

async function saveMeta(
  messages: SlackMessage[],
  meta: UserMapChatMeta
): Promise<void> {
  let toInsert = [];
  const oldestMsg = slackTsToTime( messages[ messages.length - 1 ].ts );
  const newestMsg = slackTsToTime( messages[ 0 ].ts );

  for ( const [ user, data ] of Object.entries( meta ) ) {
    const model = new Meta({
      user,
      sentiment: data.sentiment,
      msgCount: data.msgCount,
      start: new Date( oldestMsg ),
      end: new Date( newestMsg )
    });

    toInsert.push( model.data );
  }

  return db.collection('meta').insertMany( toInsert );
}

const step = async ({ users, messages, slackMsg, meta }) => {
  try {
    await connect();
    await saveUsers( users );
    await saveMessages( messages );
    await saveMeta( messages, meta );
  } finally {
    client.close();
  }
};

const save: PipelineStep = {
  step,
  preMsg: 'Saving to db',
  postMsg: 'Saved to db'
};

export default save;
