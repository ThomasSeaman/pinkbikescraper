// Dependencies
var express = require('express');
var mongojs = require('mongojs');
var bodyParser = require('body-parser');
// Require request and cheerio. This makes the scraping possible
var request = require('request');
var axios = require('axios');
var cheerio = require('cheerio');
var mongoose = require('mongoose');
var path = require('path');

var PORT = process.env.PORT || 3000

var MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost/pinkbikedb";

mongoose.Promise = Promise;
mongoose.connect(MONGODB_URI);

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));



var db = require("./models");



// Database configuration
// var databaseUrl = "pinkbikedb";
// var collections = ["pinkbikeData"];
mongoose.connect("mongodb://localhost/pinkbikedb");
// handlebars
var exphbs = require("express-handlebars");

app.engine("handlebars", exphbs({ defaultLayout: "main" }));
app.set("view engine", "handlebars");

// Hook mongojs configuration to the db variable
// var db = mongojs(databaseUrl, collections);

// var mongodb = require('mongodb')
// var mongojs = require('mongojs')

// mongodb.Db.connect('mongodb://thomas:thomas@ds129670.mlab.com:29670/heroku_l1qkbqch', function (err, theDb) {
//     var db = mongojs(theDb, collections)
// })
// var db = mongojs(heroku_l1qkbqch:<dbpassword>@ds129670.mlab.com:29670/heroku_l1qkbqch, [collections]);

// Log any mongojs errors to console
// db.on("error", function (error) {
//     console.log("Database Error:", error);
// });

// Main route
app.get("/", function (req, res) {
    res.render(path.join(__dirname, './views/index.handlebars'));
});

// app.get("/", function (req, res) {
//     res.render(path.join(__dirname, './views/index.handlebars'));
// });
app.get("/index", function (req, res) {
    res.render(path.join(__dirname, "./views/index.handlebars"));
});


// A GET route for scraping the echoJS website
app.get("/scrape", function (req, res) {
    // First, we grab the body of the html with request
    axios.get("https://www.pinkbike.com/").then(function (response) {
        // Then, we load that into cheerio and save it to $ for a shorthand selector
        var $ = cheerio.load(response.data);

        // Now, we grab every h2 within an article tag, and do the following:
        $(".f22").each(function (i, element) {
            // Save an empty result object
            var result = {};

            // Add the text and href of every link, and save them as properties of the result object
            result.title = $(element).text().trim();
            result.link = $(element).attr("href");

            // Create a new Article using the `result` object built from scraping
            db.Article.create(result)
                .then(function (dbArticle) {
                    // View the added result in the console
                    console.log(dbArticle);
                })
                .catch(function (err) {
                    // If an error occurred, send it to the client
                    return res.json(err);
                });
        });

        res.redirect("/index");
    });
});


// // Main route
// app.get("/", function (req, res) {
//     db.Articles.find({}, function (error, data) {
//         if (error) throw error
//         var hbsObj = {
//             articles: data
//         }
//         res.render("index", hbsObj)
//     })
// });

// // Retrieve data from the db
// app.get("/articles", function (req, res) {
//     // Find all results from the scrapedData collection in the db
//     db.pinkbikeData.find({}, function (error, found) {
//         // Throw any errors to the console
//         if (error) {
//             console.log(error);
//         }
//         // If there are no errors, send the data to the browser as json
//         else {
//             res.json(found);
//         }
//     });
// });

// Route for getting all Articles from the db
app.get("/articles", function (req, res) {
    // Grab every document in the Articles collection
    db.Article.find({})
        .then(function (dbArticle) {
            // If we were able to successfully find Articles, send them back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

// Route for saving/updating an Article's associated Note
app.post("/articles/:id", function (req, res) {
    // Create a new note and pass the req.body to the entry
    db.Note.create(req.body)
        .then(function (dbNote) {
            // If a Note was created successfully, find one Article with an `_id` equal to `req.params.id`. Update the Article to be associated with the new Note
            // { new: true } tells the query that we want it to return the updated User -- it returns the original by default
            // Since our mongoose query returns a promise, we can chain another `.then` which receives the result of the query
            return db.Article.findOneAndUpdate({ _id: req.params.id }, { note: dbNote._id }, { new: true });
        })
        .then(function (dbArticle) {
            // If we were able to successfully update an Article, send it back to the client
            res.json(dbArticle);
        })
        .catch(function (err) {
            // If an error occurred, send it to the client
            res.json(err);
        });
});

//   Start the server
app.listen(PORT, function () {
    console.log("App now listening at localhost:" + PORT);
})
