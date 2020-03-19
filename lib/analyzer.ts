import { SentimentAnalyzer, PorterStemmer as stemmer } from 'natural';
import { UserMap, SlackMessage, UserMapChatMeta } from './types';

const analyzer = new SentimentAnalyzer( 'English', stemmer, 'afinn' );

function emptyUserMetaDataObj( ids: string[] ): UserMapChatMeta {
  return ids.reduce( ( obj, id ) => {
    return Object.assign( obj, { [ id ]: { sentiment: 0, msgCount: 0 } });
  }, {} );
}

export default function analyze(
  users: UserMap,
  messages: SlackMessage[]
): UserMapChatMeta {
  const metaData = emptyUserMetaDataObj( Object.keys( users ) );

  for ( const message of messages ) {
    const { text, user } = message;
    let sentiment: number = analyzer.getSentiment( text.split(' ') );

    // add sentiment score to the message
    message.sentiment = sentiment;

    // increase magnitude so scores arent so close
    if ( sentiment >= 1 || sentiment <= -1 ) {
      sentiment *= Math.abs( sentiment ) ** 2;
    }

    metaData[ user ].sentiment += sentiment;
    metaData[ user ].msgCount += 1;
  }

  for ( const [ userId, data ] of Object.entries( metaData ) ) {
    metaData[ userId ].sentiment = data.sentiment / data.msgCount;
  }

  return metaData;
}
