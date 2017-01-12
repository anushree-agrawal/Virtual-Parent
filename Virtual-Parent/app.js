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

// Uber location code
var googleMapsClient = require('@google/maps').createClient({
  key: 'AIzaSyDO2dqH6MPcVW6D5rCbjP8zYG_e0wmGBbE'
});
var Uber = require('node-uber');
var uber = new Uber({
  client_id: '8sH7pWgHVe4P57LJltX8Maj_3EDVzTrA',
  client_secret: '17Irb6HDzYj_t11gne4OJebqzKTExC6yvwvsxg52',
  server_token: 'F5NW_guYCG7wzFftAzCaX4mB-ALL3e1c3NZxzH0y',
  redirect_uri: 'REDIRECT URL',
  name: 'VirtualParent',
  language: 'en_US', // optional, defaults to en_US
  sandbox: true // optional, defaults to false
});

var curr_lat = 38.887111;
var curr_long = -77.095190;

//read in summit data
const jsonData = require("./data.json")

// Create an instance of ApiAiAssistant that will listen on /
app.post("/", function (request, response) {
  //action names from the API.AI intent
  const UBER_AVG_ACTION = "uber_avg";
  const FOOD_AVG_ACTION = "food_avg";
  const WELCOME_ACTION = "welcome";
  const MORE_INFO_ACTION = "more_info";
  // uber location
  const UBER_LOCATION = "location";
  //API.AI assistant
  const assistant = new ApiAiAssistant({request: request, response: response});

  //Create functions to handle requests here:
  function handleWelcome (assistant) { //for Google Assistant only
    assistant.ask("Hi, I'm a financial parent - ask me a question!");
  }

  function handleAverageUber (assistant) {
    let location = assistant.getArgument(UBER_LOCATION);
    let sum = 0;
    if (location != null) {
      sum = getUberPrice(location);
      console.log(sum);
    }
    const uberAPIUrl = "http://api.reimaginebanking.com/merchants/58779cb61756fc834d8e8742/accounts/5877aeff1756fc834d8e878c/purchases?key=5f754f5661ce9a56b4cff9f26ca2ba58";
    
    let speech = ""
    let balance = 0;

    //  console.log(balance + "is balance");
    httpRequest({  
      method: "GET",
      uri: uberAPIUrl,
      json: true
    }).then(function (json) {
      if (location == null) {
        sum =  findAverageCost(json);
      }
      console.log('sum is : ' + sum);
      
      findCurrentBalance(function(balance) {
        if (balance >= sum) {
          speech = "You can afford this uber!"
        } else {
          speech = "You cannot afford this uber. You have " + balance + "in your account and your average uber costs " + sum + "Do you want more info?";
        }
        replyToUser(request, response, assistant, speech);
      });
    })
    .catch(function (err) {
      console.log("Error:" + err);
      //TODO: reply to user with some kind of error message
    });
  }

  function getUberPrice(query_location) {
    googleMapsClient.places({
      query: query_location,
      location: [curr_lat, curr_long],
      radius: 50000
    }, function(err, response) {
      if (err) console.error(err);
      else {
        var coordinates = response.json.results[0].geometry.location;
        var end_lat = coordinates.lat;
        var end_long = coordinates.lng;

        console.log(coordinates)

        uber.estimates.getPriceForRoute(curr_lat, curr_long, end_lat, end_long, function (err, res) {
          if (err) console.error(err);
          else { 
            var average = (res.prices[0].low_estimate + res.prices[0].high_estimate) / 2;
            return average; 
          }  
        });
        
      }

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
              speech = "You can afford to eat out!"
            } else {
              speech = "You cannot afford to eat out. You have " + balance + "in your account and your average restaurant bill is " + sum + "Do you want more info?";
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

  function handleMoreInfo() {
    let weeks = 0
    {
      let newBalance = findCurrentBalance() - cost;
      console.log('new balance is: ' + newBalance);
      while(newBalance<0){
        newBalance+= 100
        weeks++;
      }
      console.log(weeks)
      if (weeks == 1) {
        speech = "You can afford this is in one week";
      } else {
        speech = "You can afford this in" + weeks + "weeks";
      }
      replyToUser(request, response, assistant, speech);
      return weeks;
    }
  }
  const actionMap = new Map();
  
  actionMap.set(WELCOME_ACTION, handleWelcome);
  actionMap.set(UBER_AVG_ACTION, handleAverageUber);
  actionMap.set(FOOD_AVG_ACTION, handleAverageFood);
  actionMap.set(MORE_INFO_ACTION, handleMoreInfo);
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
