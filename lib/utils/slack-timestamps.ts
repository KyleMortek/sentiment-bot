// Slack is a slut and sends some stupid UNIX string/float timestamp
// converting it to a real UNIX timestamp thats accurate enough.
export function slackTsToTime( slackTs: string ): number {
  return Number( slackTs.replace( '.', '' ).slice( 0, -3 ) );
}

// Creates a slack ts from an actual UNIX date by padding it with 3 0's and
// inserting '.' before the last 6 digits
export function createSlackTs( date: number ): string {
  let asString: string = String( date ).padEnd( 15, '9' );
  return asString.slice( 0, -5 ) + '.' + asString.slice( -6 );
}
