'use strict';

const { WebClient }         = require('@slack/web-api');
const { SentimentAnalyzer } = require('natural');
const stemmer               = require('natural').PorterStemmer;
const conf                  = require('./config');
const https                 = require('https');

const analyzer = new SentimentAnalyzer( 'English', stemmer, 'afinn' );
const slack    = new WebClient( conf.slack_token );
const users    = new Map();
const messages = new Set();

const dontPost  = conf.dont_post === 'true';
const useSample = Boolean( conf.use_sample );

const keywordUser = 'Kyle';
const keywordID   = 'U3S7MV71A';

const weeklyWords = [
  'tit',
  'tits',
  'bmw',
  'loan',
  'loans',
  'fucking',
  'fuck'
];

async function fetchMessages( latest = Date.now(), oldest = 0 ) {
  const response = await slack.channels.history({
    channel: conf.channel,
    count:   1000,
    latest,
    oldest
  });

  return response.messages;
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
  let keywordCount   = 0;

  for ( const { text, user } of messages ) {
    let sentiment = analyzer.getSentiment( text.split(' ') );

    // increase magnitude so scores arent so close
    if ( sentiment >= 1 || sentiment <= -1 ) {
      sentiment *= Math.abs( sentiment ) ** 2;
    }

    if ( user === keywordID ) {
      const toCompare = text.toLowerCase();

      if ( weeklyWords.some( keyword => toCompare.includes( keyword ) ) ) {
        keywordCount += 1;
      }
    }

    sentimentByUser.set( user, ( sentimentByUser.get( user ) + sentiment ) );
    messageCounts.set( user, messageCounts.get( user ) + 1 );
  }

  for ( const [ user, sentiment ] of sentimentByUser ) {
    sentimentByUser.set( user, ( sentiment / messageCounts.get( user ) ) );
  }

  return { sentimentByUser, keywordCount };
}

function getGiphy() {
  const apiKey = 'cZZ6JniHrox8Fnxp6DKMy2gOcKP3IfJY';
  const term   = 'asshole';
  const base   = `https://api.giphy.com/v1/gifs/search?q=${term}`;
  const rating = 'PG-13';
  const url    = `${base}&api_key=${apiKey}&rating=${rating}&limit=25`;

  return new Promise( ( resolve, reject ) => {
    let full = '';

    const req = https.get( url, res => {
      res.on( 'data', chunk => full += chunk );

      res.on( 'end', () => {
        const parsed = JSON.parse( full );
        const rand   =  Math.floor( Math.random() * Math.floor( 25 ) );
        return resolve( parsed.data[ rand ].images.fixed_height.url );
      });
    });

    req.on( 'error', e => {
      console.log( 'Giphy related error: ', e );
      return reject();
    });

    req.end();
  });
}

async function createMessage( sentiments ) {
  let header = `*Sentiment of the last 7 days (${ messages.size } messages )*`;
  header += `:hammer_time:`;

  const msgBlocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: header 
      }
    }
  ];

  let lowest = { name: '', sentiment: Infinity };
  let scores = '```                                    \n';

  for ( const [ user, sentiment ] of sentiments.sentimentByUser ) {
    const { user: { real_name: name } } = users.get( user );

    scores += `${(name + ':').padEnd( 20, ' ' )} ${sentiment.toFixed( 6 )}\n`;

    lowest = sentiment < lowest.sentiment ? { name, sentiment } : lowest;
  }

  scores += '```';

  msgBlocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: scores
    }
  });

  msgBlocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `:biohazard_sign: *${lowest.name} toxic again this week.*`
    }
  });

  const gifUrl = await getGiphy();

  msgBlocks.push({
    type: 'image',
    image_url: gifUrl,
    alt_text: 'Bad attitude'
  });

  msgBlocks.push({ type: 'divider' });

  let keywordText = `# of times ${keywordUser} said `;
  keywordText += `${weeklyWords.join(', ')}:`;

  msgBlocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `${keywordText} ${sentiments.keywordCount}`
    }
  });

  return JSON.stringify( msgBlocks );
}

async function postToSlack( blocks ) {
  return slack.chat.postMessage({ channel: conf.sentiment_channel, blocks });
}

function isBlankorSlackBot( message ) {
  const slackbot = 'USLACKBOT';
  return !message.text || message.user && message.user === slackbot;
}

// Slack is a slut and sends some stupid UNIX string/float timestamp
// converting it to a real UNIX timestamp thats accurate enough.
function slackTsToTime( slackTs ) {
  return Number( slackTs.replace( '.', '' ).slice( 0, -3 ) );
}

// Creates a slack ts from an actual UNIX date by padding it with 3 0's and
// inserting '.' before the last 6 digits
function createSlackTs( date ) {
  let asString = String( date ).padEnd( 15, '9' );
  let x = asString.slice( 0, -5 ) + '.' + asString.slice( -6 );
  return x;
}

async function fetchAllMessages() {
  const oneWeek  = Date.now() - 6.048e8;
  let fromFetch  = await fetchMessages( null, createSlackTs( oneWeek ) );
  let oldestMsg  = fromFetch.slice( -1 ).pop();
  let oldestTime = slackTsToTime( oldestMsg.ts );

  // to avoid an infinite loop in case something goes wrong
  const stopLimit = 20;
  let count = 0;

  while ( oldestTime >= oneWeek && count != stopLimit ) {
    for ( const message of fromFetch ) {
      if ( isBlankorSlackBot( message ) ) {
        continue;
      }

      // older than 1 week
      if ( slackTsToTime( message.ts ) < oneWeek ) {
        break;
      }

      messages.add( message );
    }

    fromFetch = await fetchMessages( oldestMsg.ts );
    oldestMsg  = fromFetch.slice( -1 ).pop();
    oldestTime = slackTsToTime( oldestMsg.ts );
    count++;
  }
}

async function handler() {
  try {
    await fetchAllMessages();
    await fetchUsers();

    const sentiments = analyze();

    console.log('\nFinished analyzing\n');

    const message = await createMessage( sentiments );

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
