// Dependencies
var express = require("express");
var mongojs = require("mongojs");
var bodyParser = require("body-parser");
// Require request and cheerio. This makes the scraping possible
var request = require("request");
var cheerio = require("cheerio");
var mongoose = require('mongoose');

// If deployed, use the deployed database. Otherwise use the local mongoHeadlines database
var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/pinkbikedb";

// Set mongoose to leverage built in JavaScript ES6 Promises
// Connect to the Mongo DB
mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);
// mongoose.connect("mongodb://localhost/pinkbike");
// Port
var PORT = process.env.PORT || 3000;
// Initialize Express
var app = express();
// Setup the app with body-parser and a static folder
app.use(
    bodyParser.urlencoded({
        extended: false
    })
);
app.use(express.static("public"));
// Database configuration
var databaseUrl = "pinkbikedb";
var collections = ["pinkbikeData"];

// handlebars
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Hook mongojs configuration to the db variable
var db = mongojs(databaseUrl, collections);

// var mongodb = require('mongodb')
// var mongojs = require('mongojs')
 
// mongodb.Db.connect('mongodb://thomas:thomas@ds129670.mlab.com:29670/heroku_l1qkbqch', function (err, theDb) {
//     var db = mongojs(theDb, collections)
// })
// var db = mongojs(heroku_l1qkbqch:<dbpassword>@ds129670.mlab.com:29670/heroku_l1qkbqch, [collections]);

// Log any mongojs errors to console
db.on("error", function (error) {
    console.log("Database Error:", error);
});

// Main route
app.get("/", function (req, res) {
    db.pinkbikeData.find({}, function (error,data){
        if (error) throw error
        var hbsObj = {
            article: data
        }
        res.render("index", hbsObj)
    })
});

// Retrieve data from the db
app.get("/all", function (req, res) {
    // Find all results from the scrapedData collection in the db
    db.pinkbikeData.find({}, function (error, found) {
        // Throw any errors to the console
        if (error) {
            console.log(error);
        }
        // If there are no errors, send the data to the browser as json
        else {
            res.json(found);
        }
    });
});

// Scrape data from one site and place it into the mongodb db
app.get("/scrape", function (req, res) {
    // Make a request on the homepage of pinkbike
    request("https://www.pinkbike.com/", function (error, response, html) {
        if (error) throw error
        // Load the html body from request into cheerio
        var $ = cheerio.load(html);
        // For each element with a "title" class
        $(".f22").each(function (i, element) {
            // Save the text and href of each link enclosed in the current element
            var title = $(element).text().trim();
            var link = $(element).attr("href");
            // If this found element had both a title and a link
            if (title && link) {

                
                // Insert the data in the pinkbikeData db
                db.pinkbikeData.insert({
                    title: title,
                    link: link
                },
                    function (err, inserted) {
                        if (err) {
                            // Log the error if one is encountered during the query
                            console.log(err);
                        }
                        else {
                            // Otherwise, log the inserted data
                            console.log(inserted);
                        }
                    });
            }
        });
    });
    // Send a "Scrape Complete" message to the browser
    res.send("Scrape Complete");
});
app.listen(PORT, function () {
    console.log("App now listening at localhost:" + PORT);
  });