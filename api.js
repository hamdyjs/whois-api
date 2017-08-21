'use strict';

var jwt = require('jsonwebtoken');
var io = require('socket.io');
var config = require('./config');

var api = {};
var tokens = {};

api.generateToken = function(req, res) {
    var name = req.body.name;
    var token = jwt.sign(name, config.secret, {
        expiresIn: 3600
    });

    console.log('Generated token: ' + token);
    tokens[token] = {rooms: 0, lastTimestamp: Date.now()};
    res.json(token);
};

api.createRoom = function(req, res) {
    
};

module.exports = api;