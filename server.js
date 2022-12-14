'use strict';

const _ = require('lodash');
const bodyParser = require('body-parser');
const express = require('express');
const fs = require('fs');
const path = require('path');
const sendPostRequest = require('request').post;
const colors = require('colors/safe');
const app = express();


const mongodb = require('mongodb');
const ObjectID = mongodb.ObjectID;
const { MongoClient, ServerApiVersion } = require('mongodb');
const port = process.env.PORT || 6004
const mongoURL = process.env.MONGODB_URI
//const mongoCreds = require('./auth.json');
//const mongoURL = `mongodb+srv://${mongoCreds.user}:${mongoCreds.password}@cluster0.vmf3v.mongodb.net/?retryWrites=true&w=majority`
const handlers = {};
//const client = new MongoClient(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 });


////  ***** helper functions ****** ////

function makeMessage(text) {
  return `${colors.blue('[store]')} ${text}`;
}

function log(text) {
  console.log(makeMessage(text));
}

function error(text) {
  console.error(makeMessage(text));
}

function failure(response, text) {
  const message = makeMessage(text);
  console.error(message);
  return response.status(500).send(message);
}

function success(response, text) {
  const message = makeMessage(text);
  console.log(message);
  return response.send(message);
}

function mongoConnectWithRetry(delayInMilliseconds, callback) {
  MongoClient.connect(mongoURL, { useNewUrlParser: true, useUnifiedTopology: true, serverApi: ServerApiVersion.v1 }, (err, connection) => {
    if (err) {
      console.error(`Error connecting to MongoDB: ${err}`);
      setTimeout(() => mongoConnectWithRetry(delayInMilliseconds, callback), delayInMilliseconds);
    } else {
      log('connected succesfully to mongodb');
      callback(connection);
    }
  });
}

function markAnnotation(collection, gameid, sketchid) {
  collection.updateOne({_id: ObjectID(sketchid)}, {
    $push : {games : gameid},
    $inc  : {numGames : 1}
  }, function(err, items) {
    if (err) {
      console.log(`error marking annotation data: ${err}`);
    } else {
      console.log(`successfully marked annotation. result: ${JSON.stringify(items)}`);
      console.log(`now shows: ${collection.findOne({_id: ObjectID(sketchid)}, {limit : 1}, (err, docs) => {console.log(docs);})}`);
    }
  });
};




function serve() {

  mongoConnectWithRetry(2000, (connection) => {

    app.use(bodyParser.json());
    app.use(bodyParser.urlencoded({ extended: true}));

    app.post('/db/exists', (request, response) => {            

      if (!request.body) {
        return failure(response, '/db/exists needs post request body');
      }
      const databaseName = request.body.dbname;
      const database = connection.db(databaseName);
      const query = request.body.query;
      const projection = request.body.projection;

      var collectionList = ['experiment1', 'experiment2'];

      function checkCollectionForHits(collectionName, query, projection, callback) {
        const collection = database.collection(collectionName);
        collection.findOne(query, {limit : 1}, (err, items) => {          
          callback(!_.isEmpty(items));
        }); 
      }

      function checkEach(collectionList, checkCollectionForHits, query,
                         projection, evaluateTally) {
        var doneCounter = 0;
        var results = 0;          
        collectionList.forEach(function (collectionName) {
          checkCollectionForHits(collectionName, query, projection, function (res) {
            log(`got request to find_one in ${collectionName} with` +
                ` query ${JSON.stringify(query)} and projection ${JSON.stringify(projection)}`);          
            doneCounter += 1;
            results+=res;
            if (doneCounter === collectionList.length) {
              evaluateTally(results);
            }
          });
        });
      }
      function evaluateTally(hits) {
        console.log("hits: ", hits);
        response.json(hits>0);
      }

      checkEach(collectionList, checkCollectionForHits, query, projection, evaluateTally);

    });


    app.post('/db/insert', (request, response) => {
      if (!request.body) {
        return failure(response, '/db/insert needs post request body');
      }
      console.log(`got request to insert into ${request.body.colname}`);

      const databaseName = request.body.dbname;
      const collectionName = request.body.colname;
      if (!collectionName) {
        return failure(response, '/db/insert needs collection');
      }
      if (!databaseName) {
        return failure(response, '/db/insert needs database');
      }

      const database = connection.db(databaseName);

      // Add collection if it doesn't already exist
      if (!database.collection(collectionName)) {
        console.log('creating collection ' + collectionName);
        database.createCollection(collectionName);
      }

      const collection = database.collection(collectionName);

      const data = _.omit(request.body, ['colname', 'dbname']);
      collection.insertOne(data, (err, result) => {
        if (err) {
          return failure(response, `error inserting data: ${err}`);
        } else {
          return success(response, `successfully inserted data. result: ${JSON.stringify(result)}`);
        }
      });
    });


    app.post('/db/getstims', (request, response) => {
      if (!request.body) {
        return failure(response, '/db/getstims needs post request body');
      }
      console.log(`got request to get stims from ${request.body.dbname}/${request.body.colname}`);

      const databaseName = request.body.dbname;
      const collectionName = request.body.colname;
      if (!collectionName) {
        return failure(response, '/db/getstims needs collection');
      }
      if (!databaseName) {
        return failure(response, '/db/getstims needs database');
      }

      const database = connection.db(databaseName);
      const collection = database.collection(collectionName);

      // sort by number of times previously served up and take the first
      collection.findOne({}, {
        sort: [['numGames', 1]],
        limit : 1
      }, (err, results) => {
        if(err) {
          console.log(err);
        } else {
          console.log(results);
          // Immediately mark as annotated so others won't get it too
          markAnnotation(collection, request.body.gameid, results['_id']);
          response.send(results);
        }
      });
    });
    
    app.listen(port, () => {
      log(`running at http://localhost:${port}`);
    });

  });

}


serve();





