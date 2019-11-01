import { PipelineStep } from '../../types';
import * as https from 'https';

async function getGiphy(): Promise<string> {
  const apiKey: string = 'cZZ6JniHrox8Fnxp6DKMy2gOcKP3IfJY';
  const term: string   = 'asshole';
  const base: string   = `https://api.giphy.com/v1/gifs/search?q=${term}`;
  const rating: string = 'PG-13';
  const url: string    = `${base}&api_key=${apiKey}&rating=${rating}&limit=25`;

  return new Promise( ( resolve, reject ) => {
    let full: string = '';

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

const addGiphy: PipelineStep = async({ slackMsg }) => {
  try {
    console.log('adding giphy');

    const gifUrl: string = await getGiphy();

    slackMsg.push({
      type: 'image',
      image_url: gifUrl,
      alt_text: 'Bad attitude'
    });
  } catch ( err ) {
    console.error( 'Failed to add giphy: ', err );
  }
};

export default addGiphy;
