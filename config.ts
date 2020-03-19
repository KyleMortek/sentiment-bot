'use strict';

const env = process.env.NODE_ENV || 'dev';

export default {
  // auth token for slack bot
  slack_token:       process.env.SLACK_TOKEN,

  // channel to read from
  channel:           process.env.CHANNEL,

  // channel to post results to
  sentiment_channel: process.env.SENTIMENT_CHANNEL,

  // Dont post to slack
  dont_post:         process.env.DONT_POST,

  // use sample data
  use_sample:        process.env.SAMPLE,

  db: {
    get connString() {
      if ( env === 'prod' ) {
        const username = process.env.db_username;
        const password = encodeURIComponent( process.env.db_password );

        let connString = 'mongodb+srv://';
        connString += `${ username }:${ password }`;
        connString += '@cluster0-ltj7y.mongodb.net/test';
        connString += '?retryWrites=true&w=majority';

        return connString;
      }

      return 'mongodb://localhost:27017';
    }
  }
};
