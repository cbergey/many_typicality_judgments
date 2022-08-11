Backend for typicality ratings task.

To run locally,

1. run `npm install`
2. run `node server.js` (note: if it can't be run, the port may be in use; grep for all occurences of 6004 (e.g. at the top of `store.js`, the socket request in `app.js`, etc) and change to another port)

Then the server for communicating with the Mongo database will be up and running. To run the task, you'll also need to download and run the frontend code at https://github.com/cbergey/typicality_front

To run the task on the web, launch app code in this repo on one Heroku app and frontend code in the other repo to a separate Heroku app.

To use your own set of noun-adjective pairs for the task, format your pairs as the pairs in the data folder and use the article_coding.R script to assign the correct indefinite articles to your pairs. Then use reset_stim_database.py to put your pairs in a MongoCloud database to be accessed by the task.