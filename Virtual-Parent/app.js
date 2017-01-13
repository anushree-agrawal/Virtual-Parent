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
  // 250 - amount he has to pay a month and 200 is amt for pay periods left
  const DISCR = 250 - 200;
  //API.AI assistant
  const assistant = new ApiAiAssistant({request: request, response: response});

  //Create functions to handle requests here:
  function handleWelcome (assistant) { //for Google Assistant only
    assistant.ask("Hi, I'm a financial parent - ask me a question!");
  }

  function handleAverageUber (assistant) {
    let location = assistant.getArgument(UBER_LOCATION);
    let sum = 0;
    let speech = ""
    if (location != null) {
      getUberPrice(location, function(sum) {
      	sum = Math.round(sum * 100) / 100; 
		console.log('sum is : ' + sum);
	    findCurrentBalance(function(balance) {
	    	var spendable = balance - DISCR; 
	    	spendable = Math.round(spendable * 100) / 100; 
	        if (spendable >= sum) {
	          speech = "You can afford this uber! ";
	          speech += "You have " + (Math.round(100 * balance) / 100) + 
	        " dollars in your account and your uber costs " + sum + ". You should only spend " +
	        (spendable - sum) + " dollars more this month. "; 
	        } else {
	          speech = "You cannot afford this uber. ";
	          speech += "You have " + (Math.round(100 * balance) / 100) + 
	        " dollars in your account and your uber costs " + sum + ". You will owe $250 on February 1st. You can afford this uber in " +
	        handleWhenCanAfford(balance, sum) + " weeks. ";
	        }

	        replyToUser(request, response, assistant, speech);
	      });
      });
      
    } else {
	    const uberAPIUrl = "http://api.reimaginebanking.com/merchants/58779cb61756fc834d8e8742/accounts/5877aeff1756fc834d8e878c/purchases?key=5f754f5661ce9a56b4cff9f26ca2ba58";
	    
	    let balance = 0;

	    //  console.log(balance + "is balance");
	    httpRequest({  
	      method: "GET",
	      uri: uberAPIUrl,
	      json: true
	    }).then(function (json) {
	      sum =  findAverageCost(json);
	      sum = Math.round(sum * 100) / 100; 
	      console.log('sum is : ' + sum);
	      
	      findCurrentBalance(function(balance) {
	    	var spendable = balance - DISCR;
	    	spendable = Math.round(spendable * 100) / 100; 

	        if (spendable >= sum) {
	          speech = "You can afford this uber! ";
	          speech += "You have " + (Math.round(100*balance) / 100) + 
	        " dollars in your account and your uber costs " + sum + ". You should only spend " +
	        (spendable - sum) + " dollars more this month. "; 
	        } else {
	          speech = "You cannot afford this uber. ";
	          speech += "You have " + (Math.round(100*balance) / 100) + 
	        " dollars in your account and your uber costs " + sum + ". You will owe $250 on February 1st. You can afford this uber in " +
	        handleWhenCanAfford(balance, sum) + " weeks. ";
	        }

	        replyToUser(request, response, assistant, speech);
	      });
	    })

	    .catch(function (err) {
	      console.log("Error:" + err);
	      //TODO: reply to user with some kind of error message
	    });

	 }

  }

  function getUberPrice(query_location, callback) {
    googleMapsClient.places({
      query: query_location,
      location: [curr_lat, curr_long],
      radius: 50000
    }, function(err, response) {
      if (err) {
      	console.error(err)
        callback(200); 
      }
      else {
        var coordinates = response.json.results[0].geometry.location;
        var end_lat = coordinates.lat;
        var end_long = coordinates.lng;

        console.log(coordinates)

        uber.estimates.getPriceForRoute(curr_lat, curr_long, end_lat, end_long, function (err, res) {
          if (err) {
          	console.error(err)
          	callback(200);
          }
          else { 
            var average = (res.prices[0].low_estimate + res.prices[0].high_estimate) / 2;
            callback(average); 
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
            sum = Math.round(sum * 100) / 100; 
            var spendable = balance - DISCR;
            spendable = Math.round(spendable * 100) / 100; 

            if (spendable >= sum) {
              speech = "You can afford to eat out! If you do, you should only spend " + (spendable - sum) + " dollars more this month."; 
            } else {
              speech = "You cannot afford to eat out. You have " + (Math.round(100*balance)/100) + 
              " in your account and your average restaurant bill is " + sum + ". You will owe $250 on February 1st. You can afford this meal in " +
	        handleWhenCanAfford(balance, sum) + " weeks. ";
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

function handleWhenCanAfford(currentBalance, cost) {    
	let indiscretionary = 250;
	let pay = 100;
	let discretionary = currentBalance - indiscretionary; 
    
    return Math.ceil((cost - discretionary) / pay); 
 }

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
