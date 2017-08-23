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
        players: {},
        rounds: 0,
        maxRounds: maxRounds,
        questionsAsked: [],
        roundQuestion: null,
        roundData: {
            voted: 0, // Number of players voted
            votes: {}, // Number of votes each player got
            voters: {} // Who voted to who
        },
        roundReady: {}
    };
    rooms[key].players[name] = {score: 0};

    tokenOwnRoom[token] = true;

    return key;
};

game.doesTokenOwnRoom = function(token) {
    return tokenOwnRoom[token];
}

game.joinRoom = function(key, name) {
    if (rooms[key] == null)
        return -1;
    else if (rooms[key].players[name] != null)
        return 0;
    else {
        rooms[key].players[name] = {score: 0};
        return 1;
    }
}

function generateNewRoomKey() {
    var key = randToken.generate(4);
    while (rooms[key] != null)
        key = randToken.generate(4);

    return key;
}

module.exports = game;