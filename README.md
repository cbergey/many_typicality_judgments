To run locally,

1. run `npm install`
2. run `node app.js`
3. go to `http://localhost:8887/index.html` in the browser

To run on the server,

Make sure `node server.js` is also running (note: if it can't be run, the port may be in use; grep for all occurences of 6004 (e.g. at the top of `store.js`, the socket request in `app.js`, etc) and change to another port.