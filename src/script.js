import { clientId, clientSecret } from "./spotifyTokens.js";
import { Buffer } from 'buffer';
// import { getRandomSearch, getRandomOffset, randomArtistLimit } from "./randomGeneratorFunctions.js";
var jQueryScript = document.createElement('script');
jQueryScript.setAttribute('src', 'https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js');
document.head.appendChild(jQueryScript);

const randomArtistLimit = 50;

function getRandomSearch() { // allows getting a random artist from the spotify search
   // A list of all characters that can be chosen.
   const characters = 'abcdefghijklmnopqrstuvwxyz';
   
   // Gets a random character from the characters string.
   const randomCharacter = characters.charAt(Math.floor(Math.random() * characters.length));
   let randomSearch = '';
 
   // Places the wildcard character at the beginning, or both beginning and end, randomly.
   switch (Math.round(Math.random())) {
     case 0:
       randomSearch = randomCharacter + '%25';
       break;
     case 1:
       randomSearch = '%25' + randomCharacter + '%25';
       break;
   }
 
   return randomSearch;
 }

function getRandomOffset(){
   return Math.floor(Math.random() * randomArtistLimit); // limit is 1000
 }


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
function addArtistInfo(artist, specialText = null){

    let artistDescription = document.createElement("h2");
    artistDescription.textContent = specialText;

    // shows image and name of starting artist
    console.log(artist)
    const form = $("#parentForArtists");
    let image = document.createElement("img");
    // image.height = 128;
    // image.width = 12;
    // image.length = 128
    image.src = artist.images[0].url;
    

    let artistName = document.createElement("h3");
    artistName.textContent = artist.name;
    
    form[0].appendChild(artistDescription)
    form[0].appendChild(image);
    form[0].appendChild(artistName)

}


async function getArtist(token, artistName, limit, offset = 0){
    const splitArtist = artistName.replace(/ /g, "+"); // replaces spaces to put in url, regex to replace all instances
    // console.log(`split artist ${splitArtist}`);

    const result = await fetch(`https://api.spotify.com/v1/search?q=${splitArtist}&type=artist&market=US&limit=${limit}&offset=${offset}`, {
        method: "GET", headers: { Authorization: `Bearer ${token}` },
    });

    return await result.json();
}

getToken().then(response => {
    localStorage.setItem("token", response.access_token);
    // getArtist(response.access_token, "Kendrick Lamar", 1).then(artist => {
    //   console.log(artist)  
    // })
    

    // starting artist
    getArtist(response.access_token, getRandomSearch(), randomArtistLimit, getRandomOffset()).then( artist=>{
        // console.log(artist);
        addArtistInfo(artist.artists.items[0], "Starting Artist") // the first artist found
    })


    // goal artist
    getArtist(response.access_token, getRandomSearch(), randomArtistLimit, getRandomOffset()).then( artist=>{
        // console.log(artist);
        addArtistInfo(artist.artists.items[0], "Goal") // the first artist found
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
                // the individual index of each

                const artistListItem = document.createElement("div");
                artistListItem.textContent += thisArtist.name; // div for the item
                artistListItem.id = "artistNameDiv";


                const artistInputItem = document.createElement("input"); // input so they can click on it
                artistInputItem.value = thisArtist.name;
                artistInputItem.type = "hidden";

                
                form[0].appendChild(artistListItem);

                artistListItem.appendChild(artistInputItem);
                
                
                // console.log(thisArtist.name)

            }
          });
    })
});

