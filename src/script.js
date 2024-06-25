import { clientId, clientSecret } from "./spotifyTokens.js";
import { Buffer } from 'buffer';
var jQueryScript = document.createElement('script');
jQueryScript.setAttribute('src', 'https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js');
document.head.appendChild(jQueryScript);


async function getToken() {
  const response = await fetch('https://accounts.spotify.com/api/token', {
    method: 'POST',
    body: new URLSearchParams({
      'grant_type': 'client_credentials',
    }),
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      'Authorization': 'Basic ' + (Buffer.from(clientId + ':' + clientSecret).toString('base64')),
    },
  });

  return await response.json();
}

async function getArtist(token, artistName){
    // const splitArtist = artistName.replace(" ", "+");

    const result = await fetch("https://api.spotify.com/v1/search?q=Kendrick+Lamar&type=artist&market=US&offset=0", {
        method: "GET", headers: { Authorization: `Bearer ${token}` },
    });

    return await result.json();
}

getToken().then(response => {
    getArtist(response.access_token, "Kendrick Lamar").then(artist => {
      console.log(artist)
    })
  });

//  $(document).ready( function(){
//     $("#submitTeamsButton").click(function(){
//     });
// });