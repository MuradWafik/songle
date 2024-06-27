import { clientId, clientSecret } from "./spotifyTokens.js";
import { Buffer } from 'buffer';
// import { getRandomSearch, getRandomOffset, randomArtistLimit } from "./randomGeneratorFunctions.js";
var jQueryScript = document.createElement('script');
jQueryScript.setAttribute('src', 'https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js');
document.head.appendChild(jQueryScript);

const randomArtistLimit = 50;
const artistsGuessByID = [];
const artistNameToIdMap = new Map()

artistNameToIdMap.set("kendrick lamar", "2YZyLoL8N0Wb9xBt1NhZWg");
let prevArtistiD = "";
let correctGuesses = 1;

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

function addKeyArtistInfo(artist, specialText){
    // let artistDescription = document.createElement("h2");

    // shows image and name of starting artist
    const form = $("#parentForArtists");

    // let parentDivWithTitle = document.createElement("div");
    // parentDivWithTitle.id = "parentDivWithTitle";

    let imageAndNameDiv = document.createElement("div");
    imageAndNameDiv.classList += "ArtistImageAndName";



    let image = document.createElement("img");
    image.src = artist.images[0].url;
    
    let artistName = document.createElement("h3");
    artistName.textContent = artist.name;

    // makes description of goal and start

    // artistDescription.textContent = specialText + ":";
    imageAndNameDiv.id = specialText.replace(/\s/g, '');
    

    // form[0].appendChild(artistDescription);

    // div with their name and image
    imageAndNameDiv.appendChild(image);
    imageAndNameDiv.appendChild(artistName);

    const parentDivWithTitle = $(`.${specialText}`);

    // parentDivWithTitle[0].appendChild(artistDescription);
    parentDivWithTitle[0].appendChild(imageAndNameDiv);

    form[0].appendChild(parentDivWithTitle[0]);
    


}

async function getArtistById(token, artistId){
    
    const result = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        method: "GET", headers: { Authorization: `Bearer ${token}` },
    });

    return await result.json();
}


function addGuessedArtistInfo(artistID){
    const token = localStorage.getItem("token");
    getArtistById(token, artistID).then( artistObject =>{
        let imageAndNameDiv = document.createElement("div");
        imageAndNameDiv.classList += "ArtistImageAndName";

        let image = document.createElement("img");
        image.src = artistObject.images[0].url;

        let artistNameItem = document.createElement("h3");
        artistNameItem.textContent = artistObject.name;

        imageAndNameDiv.appendChild(image);
        imageAndNameDiv.appendChild(artistNameItem);
    
        // let newArtistDiv = document.create
        $(".Target").before(imageAndNameDiv);
        
    })
    // adds latest info before the goal artist






}


async function getArtist(token, artistName, limit, offset = 0){
    const splitArtist = artistName.replace(/ /g, "+"); // replaces spaces to put in url, regex to replace all instances
    // console.log(`split artist ${splitArtist}`);

    const result = await fetch(`https://api.spotify.com/v1/search?q=${splitArtist}&type=artist&market=US&limit=${limit}&offset=${offset}`, {
        method: "GET", headers: { Authorization: `Bearer ${token}` },
    });

    const artistReturning = await result.json();

    // puts in the map of name to id before returning
    for(const key in artistReturning.artists.items ){
        const _artist = artistReturning.artists.items[key];
        let nameToAdd = _artist.name;
        nameToAdd = nameToAdd.toLowerCase()
        if(!artistNameToIdMap.has(nameToAdd)){
            // map of the id and name, if name is not in it, add it
            artistNameToIdMap.set(nameToAdd, _artist.id);
        }
    }
    return artistReturning;
}


function generateStartAndGoalArtists(){
    const token = localStorage.getItem("token")
    getArtist(token, getRandomSearch(), randomArtistLimit, getRandomOffset()).then( artist=>{
        // console.log(artist.artists.items + "ARTIST");
        prevArtistiD = artist.artists.items[0].id;
        console.log(prevArtistiD);
        addKeyArtistInfo(artist.artists.items[0], "Starting"); // the first artist found

    }
    ).then(() =>
        { // only starts search after the first artist is found so that it doesnt show the goal artist before the first
        getArtist(token, getRandomSearch(), randomArtistLimit, getRandomOffset()).then( artist=>{

            addKeyArtistInfo(artist.artists.items[0], "Target") // the first artist found
        })

    })
    // let currentArtist = artistNameToIdMap.get("kendrick lamar")
    // let prevArtistiD = "1RyvyyTE3xzB2ZywiAwp0i";
    
}

getToken().then(response => {
    localStorage.setItem("token", response.access_token);
    // getArtist(response.access_token, "Kendrick Lamar", 1).then(artist => {

    // })
    generateStartAndGoalArtists();
    
});


async function getAppearsOnTracks(token, limit, newArtistId){
    // see what tracks the artist has appeared on to know if they are able to link
    const result = await fetch(`https://api.spotify.com/v1/artists/${newArtistId}/albums?include_groups=appears_on&market=US&limit=${limit}&offset=0`, {
        method: "GET", headers: { Authorization: `Bearer ${token}` },
    });
    return await result.json();
}

//  $(document).ready( function(){
//     $("#submitTeamsButton").click(function(){
//     });
// });

$(document).ready(function(){
    $("#submitGuess").click(function (e) { 
        e.preventDefault();
        const token = localStorage.getItem("token");

        const guess = ($("#searchArtist").val()).toLowerCase().trim();
        const oldArtist = prevArtistiD;
        const newArtist = artistNameToIdMap.get(guess);
        let matchExists = false;
        if(artistNameToIdMap.has(guess)){
            console.log("good guess")
            // what they entered is a valid input

            getAppearsOnTracks(token, 50, oldArtist).then(result => {

                const albumsList = result.items;
                // let artistsTheyHaveFeaturedWith = [];

          
                // loops through the appeared on from spotify checking for a match on the ids
                for (const feature in albumsList) {
                    if(matchExists){
                        // stops search if the found that they have a song together
                        break;
                    }
        
        
                        // const featureObj = ;
                        const albumsArtistList = albumsList[feature].artists;
                        if(albumsArtistList.length == 1){
                            // console.log(`found artist id ${albumsArtistList[0].id} and desired is ${newArtist}`)
                            
                            if(albumsArtistList[0].id == newArtist){
                                matchExists = true;
                            }  
                        }
                        else{ // collab albums like we dont trust you have multiple artist
                            for(const artistIndex in albumsArtistList){
                                const _thisArtist = albumsArtistList[artistIndex];
        
                                if(_thisArtist.id == newArtist){
                                    matchExists = true;
                                    
                                    break; // breaks the inner for loop
                                } 
                            }
                        }
        
                    if(matchExists){
                        prevArtistiD = newArtist;
                        addGuessedArtistInfo(newArtist);
                        // console.log("exists")
                    }                 
                }
                console.log(`match exists: ${matchExists}`)
            })
        }



        else{ // invalid guess show cue 
            console.log("wrong guess")
        }
    });
    
});

$(document).ready( function(){
    $("#searchArtist")[0].addEventListener("input", () =>{
        
        let _artistName = $("#searchArtist").val();
        // const form = $("#parentForArtists");
        const form = $("#artistList");

        $("#artistList").empty();

        let fullArtistList = "";
        if(_artistName.length == 0){
            return;
        }

        getArtist(localStorage.getItem("token"), _artistName, 7).then(artist => {
            // calls the get artist search function on spotify, with a limit of 7

            const artistsFound = artist.artists.items // the object storing the actual individual artists
            for (const _artist in artistsFound){
                const thisArtist = artistsFound[_artist]
                // the individual index of each

                let artistOption = `<option value = "${thisArtist.name}">`;

                if(!fullArtistList.includes(artistOption)){
                    fullArtistList += artistOption;
                } // avoids small cases of dupelicate artists
            }
            form[0].innerHTML = fullArtistList;
          });
    })
});

