var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var get = require("./routes/getAPI.js");
var post = require("./routes/postAPI.js");


var azureQueue = require('azure-queue-node');
azureQueue.setDefaultClient({
  accountUrl: 'https://tbdix.queue.core.windows.net/tbdixfaultcodes',
  accountName: 'tbdix',
  accountKey: 'YI/QJHierS3d6Ckp6o4wo/B5BTM+odfQHYDLuw6BA7N5SXTN6aAKoo9I0/ZVjg76n/AxP8MtnXGSOdU3ZpgPPg=='
});

var client = azureQueue.getDefaultClient();
client.createQueue('taskqueue', true, function(data){
    console.log("created: " + data);
});

client.putMessage('taskqueue', {
  value1: 'ABCDEFG'
}, function(err, data) {
    console.log(err);
    console.log(data);
  // err is null 
  // data is undefined 
});
client.getMessages('taskqueue', {maxMessages: 10}, function(err, data) {
    console.log(err);
    console.log(data);
  // err is null 
  // data contains array with to 10 queue message objects 
});
client.deleteMessage('taskqueue', 'messageId', 'popReceipt', function(err, data) {
    console.log(err);
    console.log(data);
  // err is null 
  // data is undefined 
});

var app = express();

app.use(bodyParser.urlencoded({ extended: true}));
app.use(bodyParser.json({type: 'application/json'}));
app.use(cookieParser());

app.use('/ml', get);
app.use('/iot', post);

module.exports = app;


