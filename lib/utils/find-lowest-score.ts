import { LowestScoreUser, UserMapChatMeta } from '../types';

function findLowestScore( meta: UserMapChatMeta ): LowestScoreUser {
  let score: number = Infinity;
  let userId: string;

  for ( const id of Object.keys( meta ) ) {
    const { sentiment } = meta[ id ];

    if ( sentiment < score ) {
      score = sentiment;
      userId = id;
    }
  }

  return { userId, score };
}

export default findLowestScore;
