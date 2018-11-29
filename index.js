'use strict';

const { WebClient }         = require('@slack/client');
const { SentimentAnalyzer } = require('natural');
const stemmer               = require('natural').PorterStemmer;
const conf                  = require('./config');

const analyzer = new SentimentAnalyzer( 'English', stemmer, 'afinn' );
const slack    = new WebClient( conf.slack_token );
const users    = new Map();
const messages = new Set();

const dontPost  = Boolean( conf.dont_post );
const useSample = Boolean( conf.use_sample );

const danWords = [
  'gym',
  'workout',
  'working out',
  'exercise',
  'lifting',
  'sore',
  'routine',
  'push pull',
  'work out'
];

function fetchMessages( oldest ) {
  if ( useSample ) {
    const sample = require('./sample');
    console.log('Loaded sample data');
    return { messages: sample };
  }

  return slack.channels.history({
    channel: conf.channel,
    count:   1000,
    oldest:  ( new Date( Date.now - 7 * 24 * 3.6e6 ) ).getTime()
  });
}

async function fetchUsers() {
  for ( const { user } of messages ) {
    if ( !users.has( user ) ) {
      const userDetail = await slack.users.info({
        user,
        include_locale: false
      });

      users.set( user, userDetail );
    }
  }
}

function analyze() {
  const empty           = [ ...users.keys() ].map( key => ( [ key, 0 ] ) );
  const sentimentByUser = new Map( empty );
  const messageCounts   = new Map( empty );
  let danKeywordCount   = 0;

  for ( const { text, user } of messages ) {
    let sentiment = analyzer.getSentiment( text.split(' ') );

    // increase magnitude so scores arent so close
    if ( sentiment >= 1 || sentiment <= -1 ) {
      sentiment *= Math.abs( sentiment );
    }

    if ( user === 'U30T7S4HF' ) {
      if ( danWords.some( keyword => text.includes( keyword ) ) ) {
        danKeywordCount += 1;
      }
    }

    sentimentByUser.set( user, ( sentimentByUser.get( user ) + sentiment ) );
    messageCounts.set( user, messageCounts.get( user ) + 1 );
  }

  for ( const [ user, sentiment ] of sentimentByUser ) {
    sentimentByUser.set( user, ( sentiment / messageCounts.get( user ) ) );
  }

  return { sentimentByUser, danKeywordCount };
}

function createMessage( sentiments ) {
  let lowest = { name: '', sentiment: Infinity };
  let text   = '*Sentiment of last 1000 messages or 7 days*';

  text += '\n(lower=negative, higher=positive):\n';
  text += '```\n';

  for ( const [ user, sentiment ] of sentiments.sentimentByUser ) {
    const { user: { real_name: name } } = users.get( user );

    text += `${(name + ':').padEnd( 20, ' ' )} ${sentiment.toFixed( 6 )}\n`;

    lowest = sentiment < lowest.sentiment ? { name, sentiment } : lowest;
  }

  text += '```';
  text += `\n\n${lowest.name} you gotta chill the fuck out\n`;
  text += `\n\n:dirtydan: # of times Dan said ${danWords.join(', ')}: `;
  text += sentiments.danKeywordCount;

  return text;
}

async function postToSlack( text ) {
  return slack.chat.postMessage({ channel: conf.sentiment_channel, text });
}

async function handler() {

  try {
    const { messages: data } = await fetchMessages();

    for ( const message of data ) {
      const slackbot = 'USLACKBOT';

      if (
        !message.text
        || message.text === ''
        || !message.user
        || message.user === slackbot
      ) {
        continue;
      }

      messages.add( message );
    }

    await fetchUsers();

    const sentiments = analyze();

    console.log('\nFinished analyzing\n');

    const message = createMessage( sentiments );

    if ( !dontPost ) {
      await postToSlack( message );
    } else {
      console.log( message );
    }
  } catch ( err ) {
    console.log( err );
  }
}

module.exports = { handler };
