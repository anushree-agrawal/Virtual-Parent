"use strict";

//setup / import libraries
const ApiAiAssistant = require("actions-on-google").ApiAiAssistant;
const express = require("express");
const bodyParser = require("body-parser");
const httpRequest = require("request-promise")  
require("string_score");
const app = express();
app.set("port", (process.env.PORT || 8080));
app.use(bodyParser.json({type: "application/json"}));

//read in summit data
const jsonData = require("./data.json")

// Create an instance of ApiAiAssistant that will listen on /
app.post("/", function (request, response) {
  //action names from the API.AI intent
  const WELCOME_ACTION = "welcome";
  const HOMETOWN_ACTION = "hometown";
  const PHOTO_ACTION = "photo";
  const FUN_FACT_ACTION = "funFact";
  const WEATHER_ACTION = "weather";

  //for summiteer hometown, photo, fun fact, etc..
  const FIRST_NAME_ARG = "firstName";
  const LAST_NAME_ARG = "lastName";
  const DAY_ARG = "dayOfWeek";

  //API.AI assistant
  const assistant = new ApiAiAssistant({request: request, response: response});

  //Create functions to handle requests here:
  function handleWelcome (assistant) { //for Google Assistant only
    assistant.ask("Hi, I'm software summit bot - ask me a question!");
  }

  //Handle summiteer hometown
  function handleHometown (assistant) {
    const firstName = assistant.getArgument(FIRST_NAME_ARG);
    const lastName = assistant.getArgument(LAST_NAME_ARG);
    
    const personData = findPersonData(firstName, lastName);

    let speech = "";

   if(personData && personData.hometown){
      const hometown = personData.hometown;
      speech = firstName + (lastName ? " " + lastName : "") + " is from " + hometown;
   }
   else {
      speech = "I wasn't able to find the hometown for " + firstName + (lastName ? " " + lastName : "");
   }

   replyToUser(request, response, assistant, speech);
  }

  //Handle summiteer photo
  function handlePhoto(assistant) {
    const firstName = assistant.getArgument(FIRST_NAME_ARG);
    const lastName = assistant.getArgument(LAST_NAME_ARG);
    const personData = findPersonData(firstName, lastName);

    let speech = "";

    if(personData){
      const photoUrl = "https://s3.amazonaws.com/softwaresummit/" + personData.lastName + "%2C+" + personData.firstName + "_Photo.jpg";
      speech = "Check out " + firstName + " here: :" + photoUrl;
    }
    else {
      speech = "I wasn\"t able to find a photo for " + firstName;
    }

    replyToUser(request, response, assistant, speech);
  }

  //Handle summiteer hometown
  function handleFunFact (assistant) {
    const firstName = assistant.getArgument(FIRST_NAME_ARG);
    const lastName = assistant.getArgument(LAST_NAME_ARG);
    
    const personData = findPersonData(firstName, lastName);

    let speech = "";

   if(personData && personData.funFact){
      const funFact = personData.funFact;
      speech = "Their fun fact is " + funFact;
   }
   else {
      speech = "I wasn't able to find a fun fact for " + firstName + (lastName ? " " + lastName : "");
   }

   replyToUser(request, response, assistant, speech);
  }

  function handleWeather (assistant) {
    const dayOfWeek = assistant.getArgument(DAY_ARG);

    let speech = "";
    const weatherAPIUrl = "http://api.wunderground.com/api/8e89907cda41161f/forecast10day/q/VA/Arlington.json";

    httpRequest({  
      method: "GET",
      uri: weatherAPIUrl,
      json: true
    }).then(function (json) {
      speech = speechForWeatherAPIJson(dayOfWeek, json);
      replyToUser(request, response, assistant, speech);
    })
    .catch(function (err) {
      console.log("Error:" + err);
      speech = "Unsuccessful"
      replyToUser(request, response, assistant, speech);
    });
  }

  const actionMap = new Map();
  
  actionMap.set(WELCOME_ACTION, handleWelcome);
  actionMap.set(HOMETOWN_ACTION, handleHometown);
  actionMap.set(PHOTO_ACTION, handlePhoto);
  actionMap.set(FUN_FACT_ACTION, handleFunFact);
  actionMap.set(WEATHER_ACTION, handleWeather);
  

  assistant.handleRequest(actionMap);
});

// Start the server
const server = app.listen(app.get("port"), function () {
  console.log("App listening on port %s", server.address().port);
  console.log("Press Ctrl+C to quit.");
});

// Utility functions
function replyToUser(request, response, assistant, speech) {
   if(request.body.originalRequest && request.body.originalRequest.source == "google") { //for google assistant
      assistant.ask(speech + ". What else can I help you with?"); //assistant.tell will end the conversation
   }
   else { //for slack
      return response.json({
            speech: speech,
            displayText: speech,
            source: "summit_bot"
        });
   }
}


function findPersonData(firstName,lastName){
   let nameQuery = firstName;
    if(lastName){
        nameQuery += " " + lastName;
    }

    let topScore = 0.0;
    let personIndexToReturn = 0;
    for(let i = 0; i < jsonData.length; i++) {
       const nameToCompare = (jsonData[i].firstName + " " + (lastName ? jsonData[i].lastName : "")).trim();
       const score = nameToCompare.score(nameQuery);
       if(score > topScore){
            personIndexToReturn = i;
            topScore = score;
        }
    }

    if(topScore > 0.4){
        return jsonData[personIndexToReturn];
    }
    else{
        return null;
    }
}

function speechForWeatherAPIJson(dayOfWeekRequested, json) {
  const forecastDays = json.forecast.txt_forecast.forecastday;
  for(let i = 0; i < forecastDays.length; i++) {
    const dayOfWeek = forecastDays[i].title.toLowerCase();
    dayOfWeekRequested = dayOfWeekRequested.toLowerCase();
    if(dayOfWeek == dayOfWeekRequested) {
      return "Here is the forecast for " + dayOfWeekRequested + ": " + forecastDays[i].fcttext;
    }
  }
  return "I can't find the forecast for " + dayOfWeekRequested;
}