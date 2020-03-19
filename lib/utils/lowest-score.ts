// A singleton that stores the user with the lowest score

import { LowestScoreUser } from '../types';

let userId: string = null;
let score: number  = null;

export default {

  set( info: LowestScoreUser ): void {
    score = info.score;
    userId = info.userId;
  },

  get(): LowestScoreUser {
    return { userId, score };
  }

};
