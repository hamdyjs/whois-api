'use strict';

var randToken = require('rand-token').generator({chars: '0123456789abcdefghijklmnopqrstuvwxyz'});

var game = {};
var rooms = {};
var tokenOwnRoom = {};

game.init = function(io) {
    
};

game.createRoom = function(token, name, maxRounds) {
    var key = generateNewRoomKey();

    rooms[key] = {
        players: [{name: name, score: 0}],
        rounds: 0,
        maxRounds: maxRounds,
        lastRound: {
            votes: [],
            voters: []
        }
    };
    tokenOwnRoom[token] = true;

    return key;
};

game.doesTokenOwnRoom = function(token) {
    return tokenOwnRoom[token];
}

function generateNewRoomKey() {
    var key = randToken.generate(4);
    while (rooms[key] != null)
        key = randToken.generate(4);

    return key;
}

module.exports = game;