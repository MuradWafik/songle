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

// const token = await getToken().access_token;
// const header = { Authorization: `Bearer ${token}` };


async function getArtist(token, artistName, limit){
    const splitArtist = artistName.replace(" ", "+");

    const result = await fetch(`https://api.spotify.com/v1/search?q=${splitArtist}&type=artist&market=US&limit=${limit}&offset=0`, {
        method: "GET", headers: { Authorization: `Bearer ${token}` },
    });

    return await result.json();
}

getToken().then(response => {
    localStorage.setItem("token", response.access_token);
    getArtist(response.access_token, "Kendrick Lamar", 1).then(artist => {
      console.log(artist)  
    })
  });

async function getAppearsOnTracks(token, limit, newArtistName, prevArtistName = null ){
    // see what tracks the artist has appeared on to know if they are able to link
}
//  $(document).ready( function(){
//     $("#submitTeamsButton").click(function(){
//     });
// });

$(document).ready( function(){
    $("#searchArtist")[0].addEventListener("input", () =>{
        
        let _artistName = $("#searchArtist").val();
        const form = $("#parentForArtists");
        form[0].textContent = "";
        

        if(_artistName.length == 0){
            return;
        }
        getArtist(localStorage.getItem("token"), _artistName, 7).then(artist => {
            // console.log(artist.artists.items)
            // calls the get artist search function on spotify, with a limit of 7

            const artistsFound = artist.artists.items // the object storing the actual individual artists
            for (const _artist in artistsFound){

                const thisArtist = artistsFound[_artist]
                const artistListItem = document.createElement("div");
                artistListItem.textContent = thisArtist.name;
                form[0].appendChild(artistListItem);
                // the individual index of each
                console.log(thisArtist.name)

            }
          });

    })
});