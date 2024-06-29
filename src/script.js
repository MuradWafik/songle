import { clientId, clientSecret } from "./spotifyTokens.js";
import { Buffer } from 'buffer';
// import { getRandomSearch, getRandomOffset, randomArtistLimit } from "./randomGeneratorFunctions.js";
var jQueryScript = document.createElement('script');
jQueryScript.setAttribute('src', 'https://ajax.googleapis.com/ajax/libs/jquery/3.7.1/jquery.min.js');
document.head.appendChild(jQueryScript);

const randomArtistLimit = 50;
const artistHistoryID = [];
const artistNameToIdMap = new Map();
const artistIdToNameMap = new Map();

artistNameToIdMap.set("kendrick lamar", "2YZyLoL8N0Wb9xBt1NhZWg");

let correctGuesses = 0;
let hintsUsed = 0;
let lastArtistId = null;
// const lastArtistCollaborations = [];
const lastArtistCollaborations = new Set();

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


function updateMaps(artistName, artistId){
    let filteredName = artistName.toLowerCase().trim();
    if(!artistNameToIdMap.has(filteredName)){
        // map of the id and name, if name is not in it, add it
        artistNameToIdMap.set(filteredName, artistId);
        artistIdToNameMap.set(artistId, filteredName);
    }

}

function wonGame(){
    console.log("congrats u won")
}

function updateFeaturedArtistArray(newArtistList, hadFeatures){
    // lastArtistCollaborations.length = 0;
    lastArtistCollaborations.clear()
    // const albumsList = hadFeatures ? newArtistList.artists : newArtistList.items
    let albumsList
    if(hadFeatures){
        albumsList = newArtistList.items;
    }
    else{
        albumsList = newArtistList.artists
    }
    
          
    // loops through the appeared on from spotify checking for a match on the ids
    for (const feature in albumsList) {
        const albumsArtistList = albumsList[feature].artists;


        for(const artistIndex in albumsArtistList){
            const _thisArtist = albumsArtistList[artistIndex];

            if(!albumsArtistList.includes(_thisArtist.id) && _thisArtist.name.toLowerCase().trim() !== "various artists" && _thisArtist.name.toLowerCase().trim() !== "summer hits"){
                // lastArtistCollaborations.push(_thisArtist.id);
                lastArtistCollaborations.add(_thisArtist.id)

                updateMaps(_thisArtist.name, _thisArtist.id);
                if(_thisArtist.id == lastArtistId){
                    wonGame() // checks if the artist they added collabed with the target artist
                }
            }
        } 
    }
    console.log(lastArtistCollaborations);

}

function addStartingArtist(artist){
    const divForStarter = $(".Starting");
    let imageAndNameDiv = document.createElement("div");
    imageAndNameDiv.classList += "ArtistImageAndName";
    let image = document.createElement("img");
    image.src = artist.images[0].url;
    
    let artistName = document.createElement("h3");
    artistName.textContent = artist.name;

    imageAndNameDiv.appendChild(image);
    imageAndNameDiv.appendChild(artistName);

    divForStarter[0].appendChild(imageAndNameDiv);

}

function addTargetArtist(artist){
    const divForStarter = $(".Target");
    let imageAndNameDiv = document.createElement("div");
    imageAndNameDiv.classList += "ArtistImageAndName";
    let image = document.createElement("img");
    image.src = artist.images[0].url;
    
    let artistName = document.createElement("h3");
    artistName.textContent = artist.name;

    imageAndNameDiv.appendChild(image);
    imageAndNameDiv.appendChild(artistName);

    divForStarter[0].appendChild(imageAndNameDiv);
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

        imageAndNameDiv.id = `Guess${correctGuesses}`
        imageAndNameDiv.classList += "ArtistImageAndName";

        let image = document.createElement("img");
        image.src = artistObject.images[0].url;

        let artistNameItem = document.createElement("h3");
        artistNameItem.textContent = artistObject.name;

        imageAndNameDiv.appendChild(image);
        imageAndNameDiv.appendChild(artistNameItem);
    
        // let newArtistDiv = document.create
        $(".Target").before(imageAndNameDiv);

        // updateFeaturedArtistArray(artistObject);
        getAppearsOnTracks(token, 50, artistHistoryID.at(-1)).then(newArtistList =>{
            // console.log()
            // console.log(`features? ${newArtistList[1]}`)
            updateFeaturedArtistArray(newArtistList[0], newArtistList.at(1));
        })
        
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
        nameToAdd = nameToAdd.toLowerCase().trim();
        updateMaps(nameToAdd, _artist.id);
    }
    return artistReturning;
}


function generateStartAndGoalArtists(){
    const token = localStorage.getItem("token")
    getArtist(token, getRandomSearch(), randomArtistLimit, getRandomOffset()).then( artist=>{
        // prevArtistiD = artist.artists.items[0].id;
        // console.log(prevArtistiD);
        addStartingArtist(artist.artists.items[0]);
        artistHistoryID.push(artist.artists.items[0].id);
        updateMaps(artist.artists.items[0].name, artist.artists.items[0].id)

    }).then(() =>

        { // only starts search after the first artist is found so that it doesnt show the goal artist before the first
            const token = localStorage.getItem("token")
            console.log(`prev artist id ${artistHistoryID.at(-1)}`);

            getAppearsOnTracks(token, 50, artistHistoryID.at(-1)).then(newArtistList =>{

            // updateFeaturedArtistArray(newArtistList, true);
            // console.log(`features? ${newArtistList[1]}`)
            updateFeaturedArtistArray(newArtistList[0], newArtistList.at(1));
        })
    }).then(() =>
        {

        getArtist(token, getRandomSearch(), randomArtistLimit, getRandomOffset()).then( artist=>{
            lastArtistId = artist.artists.items[0].id 
            console.log(lastArtistId);
            addTargetArtist(artist.artists.items[0]);
        })
    })
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
    const list = await result.json();

    if(list.items.length !== 0){
        console.log("ORIGINAL")
        console.log(list)
        return [list, true]; // they have featured on tracks, return the list regularly
    }

    
    // const similar = await getSimilarArtists(token, newArtistId);
    // console.log(`using similar, ${similar.artists}`);
    console.log("using similar")
    getSimilarArtists(token, newArtistId).then( newList =>{
        // console.log(newList.artists);
        console.log("NEW LIST")
        console.log(newList);
        return [newList, false];
    })
    // return similar
}

async function getSimilarArtists(token, artistId){
    const result = await fetch(`https://api.spotify.com/v1/artists/${artistId}/related-artists`, {
        method: "GET", headers: { Authorization: `Bearer ${token}` },
    });
    return await result.json();
}

//  $(document).ready( function(){
//     $("#submitTeamsButton").click(function(){
//     });
// });

function showWrongGuessMessage(){
    const errorMessage = document.createElement("p");
    errorMessage.textContent = "Invalid Name, Please choose a name found on spotify";
    errorMessage.id = "wrongNameError";

    // $("#wrongNameError")
    $("#formParent")[0].appendChild(errorMessage);
}

$(document).ready(function(){
    $("#submitGuess").click(function (e) { 
        e.preventDefault();
        const token = localStorage.getItem("token");

        const guess = ($("#searchArtist").val()).toLowerCase().trim();
        // const oldArtist = artistHistoryID.at(-1);

        const newArtist = artistNameToIdMap.get(guess);
        let matchExists = false;
        if(artistNameToIdMap.has(guess)){
            // console.log("good guess")
            
            // what they entered is a valid input
            if($("#wrongNameError").length !== 0){ // if the error message does exist
                $("#wrongNameError")[0].textContent = ""; // removes the error message
            }

            if(lastArtistCollaborations.has(newArtist)){
                correctGuesses++; // how much guesses theyve taken to beat the game in
                matchExists = true;
                // prevArtistiD = newArtist;

                addGuessedArtistInfo(newArtist); // display the new artist
                artistHistoryID.push(newArtist); // store id in list
                updateMaps(guess,newArtist )
            }
            else{
                wrongGuessAnimation();
            }
            // console.log(`match exists: ${matchExists}`)
        }

        else{ // invalid guess show cue 
            showWrongGuessMessage();
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

function selectRandomArtist(){
    // "various artists";

    let collabsSetToArray = Array.from(lastArtistCollaborations)
  
        let randomArtist = collabsSetToArray.at(Math.floor(Math.random()*collabsSetToArray.length))
        let chosenName = artistIdToNameMap.get(randomArtist);
        // some artists have "various artists" listed as a feature, so this avoids it being picked
        

    return chosenName;
}

$(document).ready(function () {
    $("#hintButton").click(function (e) { 
        e.preventDefault();
        hintsUsed++;
        $("#hintsUsedText")[0].textContent = `Hints Used: ${hintsUsed}`;
        const randomArtistChosen = selectRandomArtist();
        console.log(randomArtistChosen);
        
    });
});

function wrongGuessAnimation(){
    let form = $("#form");
    form[0].animate(
    [
        { transform: 'translateX(-2em)'},
        { transform: 'translateX(0em)'},
        { transform: 'translateX(2em)'},
        { transform: 'translateX(0em)'}
        // { color: '#431236', offset: 0.3 },
        // { transform: 'rotate(360deg) translate3D(-50%, -50%, 0)', color: '#000' }
      ], {
        duration: 350,
        iterations: 1
      }
    );
}

