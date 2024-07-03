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
const MAXCOLLABLISTSIZE = 500;

artistNameToIdMap.set("kendrick lamar", "2YZyLoL8N0Wb9xBt1NhZWg");

let correctGuesses = 0;
let hintsRemaining = 5;
let undosRemaining = 5;

let lastArtistId = null;
let gameActive = true;
// const lastArtistCollaborations = [];
const lastArtistCollaborations = new Set();
let lastArtistCollabsHintsRemoved = [];

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

function endGame(){
    console.log("congrats u won")
    // gameActive = false
    $("#submitGuess")[0].disabled = true;
    $("#searchArtist")[0].disabled = true;
}

function updateFeaturedArtistArray(newArtistList){
    // lastArtistCollaborations.length = 0;

    
    lastArtistCollaborations.clear();
    
    
    // const albumsList = hadFeatures ? newArtistList.artists : newArtistList.items
    let albumsList = newArtistList;
  
    
          
    // loops through the appeared on from spotify checking for a match on the ids
    for (const feature in albumsList) {
        const albumsArtistList = albumsList[feature].artists;


        for(const artistIndex in albumsArtistList){
            const _thisArtist = albumsArtistList[artistIndex];

            if(!albumsArtistList.includes(_thisArtist.id) && _thisArtist.name.toLowerCase().trim() !== "various artists" && _thisArtist.name.toLowerCase().trim() !== "summer hits" && !_thisArtist.name.toLowerCase().trim().includes("soundtrack")){
                // lastArtistCollaborations.push(_thisArtist.id);
                lastArtistCollaborations.add(_thisArtist.id)

                updateMaps(_thisArtist.name, _thisArtist.id);
                if(_thisArtist.id == lastArtistId){
                    endGame() // checks if the artist they added collabed with the target artist
                }
            }
        } 
    }

    lastArtistCollabsHintsRemoved = [... Array.from(lastArtistCollaborations)];
    // console.log(lastArtistCollaborations);

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
        // imageAndNameDiv.id = `Guess${correctGuesses}`
        imageAndNameDiv.classList += "ArtistImageAndName";

        let image = document.createElement("img");
        image.src = artistObject.images[0].url;

        let artistNameItem = document.createElement("h3");
        artistNameItem.textContent = artistObject.name;


        let arrow = document.createElement("p")
        arrow.innerHTML = "&#8595;";
        arrow.id = "arrow"

        let parentWithArrow = document.createElement("div");
        parentWithArrow.id =  `Guess${correctGuesses}`;
        parentWithArrow.classList += "parentWithArrow";
        

        


        imageAndNameDiv.appendChild(image);
        imageAndNameDiv.appendChild(artistNameItem);
        // imageAndNameDiv.appendChild(arrow);
        parentWithArrow.append(imageAndNameDiv);
        parentWithArrow.appendChild(arrow);



    
        // let newArtistDiv = document.create
        $(".Target").before(parentWithArrow);

        // updateFeaturedArtistArray(artistObject);
        getFullAppearsOnTracks(token, 50, artistHistoryID.at(-1)).then(newArtistList =>{
            updateFeaturedArtistArray(newArtistList.items);
        })
        
    })
    // adds latest info before the goal artist

}


async function getArtist(token, artistName, limit, offset = 0){
    const splitArtist = artistName.replace(/ /g, "+"); // replaces spaces to put in url, regex to replace all instances
    

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
        
        addStartingArtist(artist.artists.items[0]);
        artistHistoryID.push(artist.artists.items[0].id);
        updateMaps(artist.artists.items[0].name, artist.artists.items[0].id)

    }).then(() =>

        { // only starts search after the first artist is found so that it doesnt show the goal artist before the first
            const token = localStorage.getItem("token")
            // console.log(`prev artist id ${artistHistoryID.at(-1)}`);

            // getAppearsOnTracks(token, 50, artistHistoryID.at(-1)).then(newArtistList =>{

            getFullAppearsOnTracks(token, artistHistoryID.at(-1)).then(newArtistList =>{
                updateFeaturedArtistArray(newArtistList);
        
            // updateFeaturedArtistArray(newArtistList, true);
            
                // updateFeaturedArtistArray(newArtistList, false);
            })
        }).then(() =>
        {

            getArtist(token, getRandomSearch(), randomArtistLimit, getRandomOffset()).then( artist=>{
                lastArtistId = artist.artists.items[0].id 
                
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



async function getFullAppearsOnTracks(token, artistID){
    let offsetForThisRotation = 0;
    let fullCollabList = [];
    while(offsetForThisRotation <= MAXCOLLABLISTSIZE){ // const to stop at 500 collabs regardless
        try {
            let collabList = await getAppearsOnTracks(token, 50, artistID, offsetForThisRotation)
            
            if(collabList != undefined){
                console.log(collabList);
                fullCollabList = fullCollabList.concat(collabList.items)
            }
            
            
            offsetForThisRotation+=50

        } 
        catch{
            break;
            
        }

    }

    console.log(fullCollabList);
    return await fullCollabList

    
}


async function getAppearsOnTracks(token, limit, newArtistId, offset = 0){

    try {
        const result = await fetch(`https://api.spotify.com/v1/artists/${newArtistId}/albums?include_groups=appears_on&market=US&limit=${limit}&offset=${offset}`, {
            method: "GET", headers: { Authorization: `Bearer ${token}` },
        });
        const list = await result.json();
        if(list.items.length !== 0){
            // console.log("ORIGINAL")
            // console.log(list)
            
            return list; // they have featured on tracks, return the list regularly
        }
        
    } catch{
        throw new "error WITHIN";
    }
}

//  $(document).ready( function(){
//     $("#submitTeamsButton").click(function(){
//     });
// });

function showWrongGuessMessage(message){
    const errorMessage = document.createElement("p");
    errorMessage.textContent = message
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
            
            // what they entered is a valid input
            if($("#wrongNameError").length !== 0){ // if the error message does exist
                $("#wrongNameError")[0].textContent = ""; // removes the error message
            }

            if(lastArtistCollaborations.has(newArtist)){ // have a featured 
                if(artistHistoryID.includes(newArtist)){
                    //havent previously guessed this artist so they dont go into endless cycle
                    showWrongGuessMessage("Please guess an artist not already included")

                }
                else{
                    correctGuesses++; // how much guesses theyve taken to beat the game in
                    $("#guessesUsed")[0].textContent = `Guesses: ${correctGuesses}`
                    // prevArtistiD = newArtist;

                    addGuessedArtistInfo(newArtist); // display the new artist
                    artistHistoryID.push(newArtist); // store id in list
                    updateMaps(guess,newArtist );
                }
            }
            else{
                wrongGuessAnimation();
            }
            
        }

        else{ // invalid guess show cue 
            showWrongGuessMessage("Invalid Name, Please choose a name found on spotify");
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

                let artistOption = `<option data-value = ${thisArtist.id} value = ${thisArtist.name}>`;

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

    // let collabsSetToArray = Array.from(lastArtistCollaborations);

    if(lastArtistCollaborations.length <= 0){
        console.log("array empty, no more names");
    }
    const indexToRemove = Math.floor(Math.random()*lastArtistCollabsHintsRemoved.length)
    const randomArtist = lastArtistCollabsHintsRemoved.at(indexToRemove);
    // lastArtistCollabsHintsRemoved.SLICE
  
    // let randomArtist = collabsSetToArray.at(Math.floor(Math.random()*collabsSetToArray.length));
    const chosenName = artistIdToNameMap.get(randomArtist);
    
    lastArtistCollabsHintsRemoved.splice(indexToRemove, 1); // removes the name 

    return chosenName;
}

$(document).ready(function () {
    $("#hintButton").click(function (e) { 
        e.preventDefault();

        if(hintsRemaining <= 0){
            return;
        }
        // $("#hintsUsedText")[0].textContent = `Hints Remaining: ${hintsRemaining}`;
        $(`#hintDot${hintsRemaining}`).remove();
        hintsRemaining--;

        const randomArtistChosen = selectRandomArtist();


        // const divPopup = document.createElement("div");
        // divPopup.id ="popUp";
        $(".hintPopup")[0].textContent = randomArtistChosen;
        // $(".hintPopup").fadeIn();
        $('.hintPopup').fadeIn( function(){
            $(this).css('display', 'block');
         });
        // $(selector).fadeIn();

        // const popUpText = document.createElement("span");

        

        // toggleHintSpan();
        
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

$(document).ready(function () {
    $("#undoButton").click(function (e) { 
        e.preventDefault();
        undoGuess()
        
    });
});

function undoGuess(){

    if(correctGuesses <= 0 || undosRemaining <= 0){ // cant undo if they havent guesses anything
        return;
    }

    $(`#undoDot${undosRemaining}`).remove();
    undosRemaining--;

    const artistDivToRemove = $(`#Guess${correctGuesses}`);
    artistDivToRemove.remove();

    artistHistoryID.pop(); // store id in list

    correctGuesses--;
    $("#guessesUsed")[0].textContent = `Guesses: ${correctGuesses}`;
    const token = localStorage.getItem("token"); // has to reload the data of the previous artist
    



    getFullAppearsOnTracks(token, 50, artistHistoryID.at(-1)).then(newArtistList =>{
        updateFeaturedArtistArray(newArtistList);

    })

}