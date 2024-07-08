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
const MAXCOLLABLISTSIZE = 200;

artistNameToIdMap.set("kendrick lamar", "2YZyLoL8N0Wb9xBt1NhZWg");

let correctGuesses = 0;
let hintsRemaining = 5;
let undosRemaining = 5;
let totalScore = 0;

let lastArtistId = null;
const lastArtistCollaborations = new Set();
let lastArtistCollabsHintsRemoved = [];

let canPressEnterToSubmitGuess = false;


const bannedNames = new Set("ヴァリアス・アーティスト", "various artists", "soundtrack", "summer hits");

function getRandomSearch() { // allows getting a random artist from the spotify search
   // A list of all characters that can be chosen.
   const characters = 'abcdefghijklmnopqrstuvwxyz';
   
   // Gets a random character from the characters string.
   const randomCharacter = characters.charAt(Math.floor(Math.random() * characters.length));
   let randomSearch = '';
 
   // Places the wildcard character at the beginning, or both beginning and end, randomly.
   switch (Math.round(Math.random())) {
     case 0:
       randomSearch = randomCharacter + '%25'; // %25 is how to format a % sign for calling to the spotify api
       break;
     case 1:
       randomSearch = '%25' + randomCharacter + '%25';
       break;
   }
 
   return randomSearch;
 }

function getRandomOffset(){
   return Math.floor(Math.random() * randomArtistLimit); 
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

function getBonusPoints(){
    console.log("congrats u won");

    totalScore += 3; // they get 3 points for getting the bonus artist
    
    // gameActive = false
    // $("#submitGuess")[0].disabled = true;
    // $("#searchArtist")[0].disabled = true;
}

function getFeaturedArtistArray(newArtistList){ // just returns the values, doesnt set the values

    const thisArtistFeatures = new Set();
    
    
    // const albumsList = hadFeatures ? newArtistList.artists : newArtistList.items

  
    
          
    // loops through the appeared on from spotify checking for a match on the ids
    for (const feature in newArtistList) {
        const albumsArtistList = newArtistList[feature].artists;


        for(const artistIndex in albumsArtistList){
            const _thisArtist = albumsArtistList[artistIndex];

            if(!albumsArtistList.includes(_thisArtist.id) && _thisArtist.name.toLowerCase().trim() !== "various artists" && _thisArtist.name.toLowerCase().trim() !== "summer hits" && !_thisArtist.name.toLowerCase().trim().includes("soundtrack")){
                // lastArtistCollaborations.push(_thisArtist.id);
                thisArtistFeatures.add(_thisArtist.id)

            }
        } 
    }

    return Array.from(thisArtistFeatures);
    // console.log(lastArtistCollaborations);


}

function updateFeaturedArtistArray(newArtistList){
    // lastArtistCollaborations.length = 0;

    // console.log(newArtistList); // after guess the new artist list is undefined

    lastArtistCollaborations.clear();
    
    
    // const albumsList = hadFeatures ? newArtistList.artists : newArtistList.items
    let albumsList = newArtistList;
  
    
          
    // loops through the appeared on from spotify checking for a match on the ids
    for (const feature in albumsList) {
        const albumsArtistList = albumsList[feature].artists;

        for(const artistIndex in albumsArtistList){
            const _thisArtist = albumsArtistList[artistIndex];

            if(!albumsArtistList.includes(_thisArtist.id) && _thisArtist.name.toLowerCase().trim() !== "various artists" && _thisArtist.name.toLowerCase().trim() !== "summer hits" && !_thisArtist.name.toLowerCase().trim().includes("soundtrack")){

                lastArtistCollaborations.add(_thisArtist.id);
                updateMaps(_thisArtist.name, _thisArtist.id);

                if(_thisArtist.id == lastArtistId){
                    getBonusPoints(); // checks if the artist they added collabed with the target artist

                    break; // stops loop to not call on this multiple times
                }
            }
        } 
    }
    lastArtistCollabsHintsRemoved = [... Array.from(lastArtistCollaborations)];
    // console.log(lastArtistCollaborations);

}

function addStartingArtist(artist){

    $("#startArtistImg")[0].src = artist.images[0].url;

    $("#startingArtistName")[0].textContent = artist.name;


}

function addTargetArtist(artist){
    // const divForTarget = $("#targetArtistInfo");
    

    // instead of creating the elements with DOM, just accesses preset and changes the values, also helps with styling the page
    $("#targetArtistImg")[0].src = artist.images[0].url;
    $("#bonusArtistName")[0].textContent = artist.name;

}


async function getArtistById(token, artistId){
    
    const result = await fetch(`https://api.spotify.com/v1/artists/${artistId}`, {
        method: "GET", headers: { Authorization: `Bearer ${token}` },
    });

    return await result.json();
}


function addGuessedArtistInfo(artistID){
    const token = localStorage.getItem("token");

    allowButtonsToBeUsed(false); // buttons arent synced yet, so just disables them
    enableWrongGuessMessage(false);

    getArtistById(token, artistID).then( artistObject =>{
        let imageAndNameDiv = document.createElement("div");
        // imageAndNameDiv.id = `Guess${correctGuesses}`
        imageAndNameDiv.classList += "ArtistImageAndName";

        let image = document.createElement("img");
        image.src = artistObject.images[0].url;
        image.alt = `spotify profile photo of guessed artist number ${correctGuesses}`;

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


        $(".Target").before(parentWithArrow);

        $('.hintPopup').fadeOut(); // fades out in case it was visible

        // updateFeaturedArtistArray(artistObject);
        getFullAppearsOnTracks(token, artistID).catch( ()=>{

            possibleGameOverSequence(); // artist they guessed has 0 features found
            return;
            throw Error("Artist had no Features");
            
        
        }).then(newArtistList =>{
            updateFeaturedArtistArray(newArtistList);

            allowButtonsToBeUsed(true);
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
    const token = localStorage.getItem("token");


    artistHistoryID.length = 0;

    allowButtonsToBeUsed(false);  // cant use buttons before initial artists are picked
    
    getArtist(token, getRandomSearch(), randomArtistLimit, getRandomOffset()).then( artist=>{

        
        addStartingArtist(artist.artists.items[0]);
        artistHistoryID.push(artist.artists.items[0].id);
        updateMaps(artist.artists.items[0].name, artist.artists.items[0].id)

    })
    .then(() =>
    { 
            // only starts search after the first artist is found so that it doesnt show the goal artist before the first
        const token = localStorage.getItem("token");

        getFullAppearsOnTracks(token, artistHistoryID.at(-1)).catch( () =>{

            generateStartAndGoalArtists();

                 // calls on itself again if the artist that was generated has no features since the game would just end right there

                 // still results in error if feature does exist but its from an invalid source ...
                 // for instance (macklemore & ryan lewis) have 1 feature so no error is thrown, but the featere is to "various artists"
                 // so the user is unable to input anything, but the game thinks the artist is valid
            
        })
        .then(newArtistList =>{
            updateFeaturedArtistArray(newArtistList);
        })
    })
    .then(() =>
    {
        getArtist(token, getRandomSearch(), randomArtistLimit, getRandomOffset()).then( artist=>{
            lastArtistId = artist.artists.items[0].id;
            addTargetArtist(artist.artists.items[0]);
        })

        allowButtonsToBeUsed(true);
    })
}


$(document).ready(function () {
    getToken().then(response => {
        localStorage.setItem("token", response.access_token);
        generateStartAndGoalArtists();
    
    });
});


async function getFullAppearsOnTracks(token, artistID){
    let offsetForThisRotation = 0;
    let fullCollabList = [];
    while(offsetForThisRotation < MAXCOLLABLISTSIZE){ // const to stop at the limit if the end is not reached naturally
        try {
            let collabList = await getAppearsOnTracks(token, 50, artistID, offsetForThisRotation)
            
            if(collabList != undefined){
                // console.log(collabList);
                fullCollabList = fullCollabList.concat(collabList.items)
            }
            
            offsetForThisRotation+=50 // limit for one search is 50, so just have to keep offsetting by 50
        } 
        catch{ // an error is thrown if you go out of index meaning out of features, so just ends it anyways
            break;  
        }
    }


    let featuresAmmount = getFeaturedArtistArray(fullCollabList).length;
    // console.log(fullCollabList);
    if(featuresAmmount == 0){ // filters to also exclude banned names like "various artists" before confirming it is a valid list
        throw new Error("No Artists");
    }
    return fullCollabList
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

function enableWrongGuessMessage(state, text = null){
    // if they entered a name that doesnt exist, or was already guessed, enables text for it, and making the message reflect the error
    if(state){
        $("#wrongNameError").fadeIn();
        $("#wrongNameError")[0].textContent = text;
    }

    else{
        $("#wrongNameError").fadeOut();
    }
}

$(document).ready(function(){
    $("#submitGuess").click(function (e) { 
        e.preventDefault();

        submitGuess();
        
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
    



    getFullAppearsOnTracks(token, artistHistoryID.at(-1)).then(newArtistList =>{
        updateFeaturedArtistArray(newArtistList);

    })

}

function allowButtonsToBeUsed(buttonsCanBeUsed){        
    $("#submitGuess")[0].disabled = !buttonsCanBeUsed;
    $("#searchArtist")[0].disabled = !buttonsCanBeUsed;

    canPressEnterToSubmitGuess = buttonsCanBeUsed; // the enter press returns if this is false

    if(buttonsCanBeUsed){
        $(".bottomButton").removeAttr("disabled");
    
    }

    else{
        $('.bottomButton').attr('disabled', true);
         // the whole class is disabled, cant access the disabled element
    }
}


function showGameOverPopup(){
    // $("#gameOverScreen")[0]
    $("#gameOverScreen").fadeIn();
    $("body").addClass("modal-open"); // stop scrolling for the background

    $("#gameOverGuesses")[0].textContent = `Final Score: ${totalScore + correctGuesses}`;
    
    allowButtonsToBeUsed(false);
    

}

function hideGameOverPopup(){
    $("#gameOverScreen").fadeOut();
    $("body").removeClass("modal-open");
    // allowButtonsToBeUsed(true);  
}

$(document).ready(function () { // game over button
    $("#giveUpButton").click(function (e) { 
        e.preventDefault();
        showGameOverPopup();
        
    });

    $(window).click(function (e) { 
        e.preventDefault(); // if game over screen is active, and they press in the outside area
        if (e.target == $("#gameOverScreen")[0]) {
            // modal.style.display = "none";
            hideGameOverPopup();
          }
        
    });
});


$(document).ready(function () {
    $(".close").click(function (e) { 
        e.preventDefault();
        hideGameOverPopup();
        
    });
});


$(document).ready(function () {
    $("#searchArtist").keypress(function(event) {  // instead of pressing submit button, they just just press the enter key to submit a guess
        let keycode = event.keyCode || event.which;
        if(keycode == '13' && canPressEnterToSubmitGuess) {

            submitGuess()
            // alert('You pressed a "enter" key in input');    
        }
    });
});


function submitGuess(){
    const guess = ($("#searchArtist").val()).toLowerCase().trim();

        // const oldArtist = artistHistoryID.at(-1);

        const newArtist = artistNameToIdMap.get(guess);

        if(artistNameToIdMap.has(guess)){
            
            // what they entered is a valid input
            if($("#wrongNameError").length !== 0){ // if the error message does exist
                $("#wrongNameError")[0].textContent = ""; // removes the error message
            }

            if(lastArtistCollaborations.has(newArtist)){ // have a featured 
                if(artistHistoryID.includes(newArtist)){
                    //havent previously guessed this artist so they dont go into endless cycle
                    enableWrongGuessMessage(true, "Please guess an artist not already included")

                }
                else{
                    correctGuesses++; // how much guesses theyve taken to beat the game in
                    $("#guessesUsed")[0].textContent = `Guesses: ${correctGuesses}`


                    addGuessedArtistInfo(newArtist); // display the new artist
                    artistHistoryID.push(newArtist); // store id in list
                    updateMaps(guess, newArtist);

                    $('#searchArtist').val(''); // clears the input field

                }
            }

            else{ // artist does exist, wasnt already guessed, but the no feature between them exists
                wrongGuessAnimation();
            }
            
        }

        else{ // artist does not exist
            enableWrongGuessMessage(true, "Invalid Name, Please choose a name found on spotify");
        }
}

$(document).ready(function () {
    $("#playAgain").click(function (e) { 
        e.preventDefault();

        $('#searchArtist').val('');


        generateStartAndGoalArtists(); // regenerates the artists for the user
        hideGameOverPopup();

        artistHistoryID.length = 0;
    
        lastArtistId = null;
        lastArtistCollaborations.clear();
        lastArtistCollabsHintsRemoved.length = 0; // resets all data history by default so it doesnt affect user if they play again
        
        $("div.parentWithArrow").remove();

        correctGuesses = 0;
        hintsRemaining = 5;
        undosRemaining = 5;
        totalScore = 0;

        $("#guessesUsed")[0].textContent = `Guesses: ${correctGuesses}`;

        $("#undoDots").html($('#undoDots').data('old-undo'));
        $("#hintDots").html($('#hintDots').data('old-hint'));


    });
});

$(document).ready(function () {
    $("#viewArtistList").click(function (e) { 
        e.preventDefault();
        
        // location.href = `https://open.spotify.com/artist/${artistHistoryID[artistHistoryID.length-1]}`;
        // location.target = "_blank";
        window.open(`https://open.spotify.com/artist/${artistHistoryID[artistHistoryID.length-1]}`, '_blank')
        
    });
});

function possibleGameOverSequence(){
    let text;
    if(undosRemaining > 0){
        text = "Undo guess or Give up to continue game";
        console.log(text);
    }
    else{

    }

    // artist has no features, tells to either end game, or undo
}


$(document).ready(function () {
    $('#hintDots').data('old-hint', $('#hintDots').html());
    $('#undoDots').data('old-undo', $('#undoDots').html());

    // stores this data so that they can be reverted to full ammounts if player presses play again
});


//TODO:
// If you play again after guessing something already, the html from previous round guesses still show, also just check
// all the lists and stuff to see if they reflect the current state of the game