'use strict';

var randToken = require('rand-token').generator({chars: '0123456789abcdefghijklmnopqrstuvwxyz'});

var game = {};
var rooms = {};
var tokenOwnRoom = {};
var tokenRoom = {};

game.init = function(io) {
    io.on('connection', function(socket) {
        // When a player joins the room
        socket.on('client_join_room', function(data) {
            // Notify other players of the new player
            io.to(data.key).emit('server_player_join_room', [data.name, rooms[data.key].players[data.name]]);
            // Set the player's room and send him the room's data
            socket.join(data.key);
            socket.emit('server_join_room', rooms[data.key].players);
        });

        // When the host starts the room
        socket.on('client_start_room', function(key) {
            startNewRound(key);
            io.to(key).emit('server_start_room');
        });

        // Get the current round's question
        socket.on('client_get_question', function(key) {
            socket.emit('server_get_question', [rooms[key].roundQuestion, rooms[key].players]);
        });

        // Vote for a player
        socket.on('client_vote', function(data) {
            var room = rooms[data.key];
            var roundData = room.roundData;
            roundData.votes[data.voted]++;
            roundData.voters[data.voted].push(data.name);
            room.players[data.name].voted = true;

            // Check if all players voted
            var allVoted = true;
            for (var name in room.players)
                if (!room.players[name].voted) allVoted = false;
            
            if (allVoted)
                endRound(data.key);
            
            // Update players with the votes
            io.to(data.key).emit('server_player_vote', [data.name, allVoted]);
            // Tell player whether all voted or not, to decide to start voted or score activity
            socket.emit('server_vote', allVoted);
        });

        socket.on('client_get_voted', function(key) {
            socket.emit('server_get_voted', rooms[key].players);
        });

        socket.on('client_get_score', function(data) {
            var room = rooms[data.key];
            var finished = room.rounds == room.maxRounds;
            socket.emit('server_get_score', [room.players, room.roundData, room.rounds, finished]);

            // Clean up game if it is finished
            if (finished) {
                room.players[data.name].finished = true;

                var allFinished = true;
                for (var name in room.players)
                    if (!room.players[name].finished) allFinished = false;

                if (allFinished) {
                    rooms[data.key] = null;
                    for (var token in tokenRoom) {
                        if (tokenRoom[token] == key) {
                            tokenRoom[token] = null;
                            break;
                        }
                    }
                }
            }
        });

        // When a player is ready
        socket.on('client_ready', function(data) {
            var room = rooms[data.key];
            room.players[data.name].ready = true;

            // All the players are ready, start a new round
            var allReady = true;
            for (var name in room.players)
                if (!room.players[name].ready) allReady = false;
            
            if (allReady) {
                startNewRound(data.key);
            }

            io.to(data.key).emit('server_ready', [data.name, allReady]);
        });
    });
};

game.createRoom = function(token, name, maxRounds) {
    var key = generateNewRoomKey();

    rooms[key] = {
        players: {},
        rounds: 0,
        maxRounds: parseInt(maxRounds),
        questionsAsked: [],
        roundQuestion: null,
        roundData: {
            votes: {}, // Number of votes each player got
            voters: {} // Who voted to who
        }
    };
    rooms[key].players[name] = {score: 0, host: true, ready: false, voted: false, finished: false};

    tokenRoom[token] = key;

    return key;
};

game.getTokenRoom = function(token) {
    return tokenRoom[token];
}

game.joinRoom = function(key, name) {
    if (rooms[key] == null)
        return -1;
    else if (rooms[key].players[name] != null)
        return 0;
    else {
        rooms[key].players[name] = {score: 0, host: false, ready: false, voted: false, finished: false};
        return 1;
    }
}

function startNewRound(key) {
    console.log('called startNewRound with key', key);
    var room = rooms[key];
    room.rounds++;
    room.roundData = {
        votes: {}, // Number of votes each player got
        voters: {} // Who voted to who
    };

    for (var name in room.players) {
        room.players[name].ready = false;
        room.players[name].voted = false;
        room.roundData.votes[name] = 0;
        room.roundData.voters[name] = [];
    }
    generateNewQuestion(key);
}

function endRound(key) {
    var room = rooms[key];
    var roundData = room.roundData;
    for (var name in roundData.votes) {
        var votesCount = roundData.votes[name];
        room.players[name].score += votesCount;
    }
}

function generateNewRoomKey() {
    var key = randToken.generate(4);
    while (rooms[key] != null)
        key = randToken.generate(4);

    return key;
}

function generateNewQuestion(key) {
    var questions = require('./questions');
    var rand = Math.round(Math.random() * (questions.length - 1));
    while (rooms[key].questionsAsked.indexOf(rand) > -1)
        rand = Math.round(Math.random() * (questions.length - 1));
    rooms[key].questionsAsked.push(rand);
    rooms[key].roundQuestion = questions[rand];
}

module.exports = game;