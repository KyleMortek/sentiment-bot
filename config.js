'use strict';

module.exports = {
  // auth token for slack bot
  slack_token:       process.env.SLACK_TOKEN,

  // channel to read from
  channel:           process.env.CHANNEL,

  // channel to post results to
  sentiment_channel: process.env.SENTIMENT_CHANNEL
}
