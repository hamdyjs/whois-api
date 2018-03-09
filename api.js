'use strict';

var jwt = require('jsonwebtoken');
var config = require('./config');
var game = require('./game');

var api = {};
var minimumVersionCode = 1;

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
            else res.status(403).json();
            return;
        }

        if (game.getTokenRoom(token) != null) {
            res.status(500).json();
            return;
        }

        var key = game.createRoom(token, name, maxRounds);
        res.status(200).json(key);
    });
};

api.joinRoom = function(req, res) {
    var key = req.body.key;
    var name = req.body.name;

    var status = game.joinRoom(key, name);
    if (status == -1) res.status(200).json(-1);
    else if (status == 0) res.status(200).json(0);
    else if (status == 1) res.status(200).json(1);
};

api.getMinimumVersionCode = function(req, res) {
    res.status(200).json(minimumVersionCode);
}

module.exports = api;