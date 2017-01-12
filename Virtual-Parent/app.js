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
  const UBER_AVG_ACTION = "uber_avg";
  const FOOD_AVG_ACTION = "food_avg";
  const WELCOME_ACTION = "welcome";
  //API.AI assistant
  const assistant = new ApiAiAssistant({request: request, response: response});

  //Create functions to handle requests here:
  function handleWelcome (assistant) { //for Google Assistant only
    assistant.ask("Hi, I'm software summit bot - ask me a question!");
  }

  function handleAverageUber () {
    const uberAPIUrl = "http://api.reimaginebanking.com/merchants/58779cb61756fc834d8e8742/accounts/5877aeff1756fc834d8e878c/purchases?key=5f754f5661ce9a56b4cff9f26ca2ba58";
    let sum = 0;
    let speech = ""
    let balance = 0;

    //  console.log(balance + "is balance");
    httpRequest({  
      method: "GET",
      uri: uberAPIUrl,
      json: true
    }).then(function (json) {
      sum =  findAverageCost(json);
      console.log('sum is : ' + sum);
      
      findCurrentBalance(function(balance) {
        if (balance >= sum) {
          speech = "You can afford this uber!"
        } else {
          speech = "You cannot afford this uber. You have " + balance + "in your account and your average uber costs " + sum;
        }
        replyToUser(request, response, assistant, speech);
      });
    })
    .catch(function (err) {
      console.log("Error:" + err);
      //TODO: reply to user with some kind of error message
    });
  }

  function findAverageCost(json) {
    let i = 0;
    let sum = 0;
    for(; i < json.length; i++) {
      console.log(i);
      sum = sum + json[i].amount;
      console.log(sum);
    }
    return sum/i;
  }

  function findCurrentBalance(callback) {
    const balanceURL = "http://api.reimaginebanking.com/accounts/5877aeff1756fc834d8e878c?key=5f754f5661ce9a56b4cff9f26ca2ba58";
    httpRequest({  
      method: "GET",
      uri: balanceURL,
      json: true
    }).then(function (json) {
      console.log(json.balance);
      callback(json.balance);
    })
    .catch(function (err) {
      console.log("Error:" + err);
      callback(0.0);
    });
  }

  function handleAverageFood() {
    const foodIDs = ["57cf75cea73e494d8675ec5b","57cf75cea73e494d8675ec57", "57cf75cea73e494d8675ec4d", "57cf75cea73e494d8675ec49"];
    let sum = 0;
    let speech = ""
    let balance = 0;
    let costs = [];
    for (let i = 0; i<foodIDs.length; i++) {
      let foodAPIUrl = "http://api.reimaginebanking.com/merchants/" + foodIDs[i] + "/accounts/5877aeff1756fc834d8e878c/purchases?key=5f754f5661ce9a56b4cff9f26ca2ba58";
      httpRequest({  
        method: "GET",
        uri: foodAPIUrl,
        json: true
      }).then(function (json) {
        console.log(json);
        console.log(json[0].amount + "json amount");
        costs.push(json[0].amount);
        sum = sum+json[0].amount;
        if (costs.length == foodIDs.length) {
          findCurrentBalance(function(balance) {
            sum = sum/costs.length;
            if (balance >= sum) {
              speech = "You can afford this food!"
            } else {
              speech = "You cannot afford this food. You have " + balance + "in your account and your average food costs " + sum;
            }
            replyToUser(request, response, assistant, speech);
          });
        }
        console.log(costs + "costs");
      })
      .catch(function (err) {
      });
    }
  }

  // function findMerchantType(callback) {
  //   console.log("success");
  //   const merchAPIUrl = "http://api.reimaginebanking.com/merchants/" + merchID + "?key=5f754f5661ce9a56b4cff9f26ca2ba58";
  //   console.log(merchAPIUrl);
  //   httpRequest({  
  //     method: "GET",
  //     uri: merchAPIUrl,
  //     json: true
  //   }).then(function (json) {
  //     console.log(json.category);
  //     callback(json.category);
  //   })
  //   .catch(function (err) {
  //     console.log("Error:" + err);
  //     callback(0.0);
  //   });
  // }
  const actionMap = new Map();
  
  actionMap.set(WELCOME_ACTION, handleWelcome);
  actionMap.set(UBER_AVG_ACTION, handleAverageUber);
  actionMap.set(FOOD_AVG_ACTION, handleAverageFood);
  
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
