'use strict';

var express = require('express');
var bodyParser = require('body-parser');
var morgan = require('morgan');
var api = require('./api');

var app = express();

app.use(morgan("dev"));
app.use(bodyParser.urlencoded({extended: true}));
app.use(bodyParser.json());
app.use(function(req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});

var server = app.listen(3001, function(err) {
    if (err) {
        console.error(err);
        return;
    }

    console.log('Server started listening on port 3001');
});

app.get('/', function(req, res) {
    res.end('Hello, World!');
});

app.route('/auth').post(api.generateToken);
app.route('/room').post(api.createRoom);

// Initialize the game module
var io = require('socket.io')(server);
require('./game').init(io);