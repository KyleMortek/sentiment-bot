'use strict';

const { WebClient }         = require('@slack/client');
const { SentimentAnalyzer } = require('natural');
const stemmer               = require('natural').PorterStemmer;
const conf                  = require('./config');
const https                 = require('https');

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

function getGiphy() {
  const apiKey = 'cZZ6JniHrox8Fnxp6DKMy2gOcKP3IfJY';
  const term   = 'bad+attitude';
  const base   = `https://api.giphy.com/v1/gifs/search?q=${term}`;
  const rating = 'g';
  const url    = `${base}&api_key=${apiKey}&rating=${rating}&limit=1`;

  return new Promise( ( resolve, reject ) => {
    let full = '';

    const req = https.get( url, res => {
      res.on( 'data', chunk => full += chunk );

      res.on( 'end', () => {
        const parsed = JSON.parse( full );
        return resolve( parsed.data[ 0 ].images.original.url );
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
  const msgBlocks = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: '*Sentiment of the last 1000 messages or 7 days* :hammer_time:'
      }
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: ':grey_question: Lower = negative, Higher = positive'
        }
      ]
    },
    {
      type: 'divider'
    }
  ];

  let lowest = { name: '', sentiment: Infinity };
  let scores = '```';

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
      text: `:biohazard_sign: *_${lowest.name} toxic again this week._*`
    }
  });

  const gifUrl = await getGiphy();

  msgBlocks.push({
    type: 'image',
    image_url: gifUrl,
    alt_text: 'Bad attitude'
  });

  msgBlocks.push({ type: 'divider' });

  const danText = `# of times Dan said ${danWords.join(', ')}:`;

  msgBlocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `${danText} ${sentiments.danKeywordCount}`
    },
    accessory: {
      type: 'image',
      image_url: 'https://emoji.slack-edge.com/T2L7MHMEG/dirtydan/62380b71e4c8b3a2.jpg',
      alt_text: 'Dirty dan'
    }
  });

  return JSON.stringify( msgBlocks );
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
