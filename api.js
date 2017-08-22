'use strict';

var jwt = require('jsonwebtoken');
var config = require('./config');
var game = require('./game');

var api = {};

api.generateToken = function(req, res) {
    var name = req.body.name;
    var token = jwt.sign({name: name}, config.secret, {
        expiresIn: 3600
    });

    res.status(200).json(token);
};

api.createRoom = function(req, res) {
    var token = req.body.token;
    var name = req.body.name;
    var maxRounds = req.body.max_rounds;

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

        if (game.doesTokenOwnRoom(token)) {
            res.status(500).json();
            return;
        }

        var key = game.createRoom(token, name, maxRounds);
        res.status(200).json(key);
    });
};

module.exports = api;