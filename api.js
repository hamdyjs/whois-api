'use strict';

var jwt = require('jsonwebtoken');
var io = require('socket.io');
var config = require('./config');

var api = {};
var tokens = {};

api.generateToken = function(req, res) {
    var name = req.body.name;
    var token = jwt.sign({name: name}, config.secret, {
        expiresIn: Math.floor(Date.now() / 1000) + (60 * 60)
    });

    console.log('Generated token: ' + token);
    tokens[token] = {rooms: 0, lastTimestamp: Date.now()};
    res.status(200).json(token);
};

api.createRoom = function(req, res) {
    var token = req.body.token;
    if (!token) {
        res.status(403).json();
        return;
    }

    jwt.verify(token, config.secret, function(err, decoded) {
        if (err) {
            if (err.name == 'TokenExpiredError') res.status(403).json(true);
            else res.status(403).json(false);
            return;
        }

        console.log(decoded);
        tokens[token].rooms++;
        tokens[token].lastTimestamp = Date.now();
        
        // Generate room key
        res.status(200).json();
    });
};

module.exports = api;