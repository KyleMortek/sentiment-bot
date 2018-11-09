const { WebClient }         = require('@slack/client');
const { SentimentAnalyzer } = require('natural');
const stemmer               = require('natural').PorterStemmer;
const conf                  = require('./config');

const USE_SAMPLE    = process.env.SAMPLE;
const POST_TO_SLACK = process.env.POST_TO_SLACK || true;

const analyzer = new SentimentAnalyzer( 'English', stemmer, 'afinn' );
const slack    = new WebClient( conf.slack_token );
const users    = new Map();
const messages = new Set();

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

// function fetchMessages( oldest ) {
//   if ( USE_SAMPLE ) {
//     const sample = require('./sample');
//     console.log('Loaded sample data');
//     return { messages: sample };
//   }

//   return slack.channels.history({
//     channel: conf.channel,
//     oldest:  ( new Date( Date.now - 7 * 24 * 3.6e6 ) ).getTime()
//   });
// }

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
    const sentiment = analyzer.getSentiment( text.split(' ') );

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

    text += `${(name + ':').padEnd( 15, ' ' )} ${sentiment.toFixed( 6 )}\n`;

    if ( sentiment < lowest.sentiment ) {
      lowest = { name, sentiment };
    }
  }

  text += '```';
  text += `\n${lowest.name} you gotta chill the fuck out\n`;
  text += `\n:dirtydan: # of times Dan said ${danWords.join(', ')}: `;
  text += sentiments.danKeywordCount;

  return text;
}

async function postToSlack( text ) {
  return slack.chat.postMessage({ channel: conf.sentiment_channel, text });
}

function addMessages( data ) {
  for ( const message of data ) {
    if ( !message.text || message.text === '' || !message.user ) {
      continue;
    }

    messages.add( message );
  }
}

function fetchMessages( oldest ) {
  return slack.conversations.history({
    channel: conf.channel,
    limit: 1000,
    oldest
  });
}

async function getAllMessages() {
  if ( USE_SAMPLE ) {
    const sample = require('./sample');
    addMessages( sample );
    console.log('Loaded sample data');
    return;
  }

  const createTs = utcTime => ( new Date( utcTime ) ).getTime();

  let start    = createTs( Date.now() - 7 * 24 * 3.6e6 );
  let response = await fetchMessages( start );

  console.log( response );

  addMessages( response.messages );

  while ( response.has_more ) {
    start    = createTs( response.messages.slice( -1 )[ 0 ].ts * 1e3 );
    response = await fetchMessages( start );
    console.log( response );
    addMessages( response.messages );
  }
}

async function handler() {
  try {
    await getAllMessages();

    console.log( messages.size );

    await fetchUsers();

    const sentiments = analyze();

    console.log('\nFinished analyzing\n');

    const message = createMessage( sentiments );

    // if ( POST_TO_SLACK ) {
    //   await postToSlack( message );
    // } else {
      console.log( message );
    // }
  } catch ( err ) {
    console.log( err );
  }
}

module.exports = process.env.TEST_LOCAL ? handler() : { handler };
