'use strict';

var randToken = require('rand-token').generator({chars: '0123456789abcdefghijklmnopqrstuvwxyz'});

var game = {};
var rooms = {};
var tokenOwnRoom = {};

game.init = function(io) {
    io.on('connection', function(socket) {
        // When a player joins the room
        socket.on('client_join_room', function(data) {
            // Notify other players of the new player
            io.to(data.key).emit('server_player_join', {name: data.name});

            // Set the player's room and send him the room's data
            socket.join(data.key);
            socket.emit('server_join_room', {room: rooms[data.key]});
        });

        // When the host starts the room
        socket.on('client_start_room', function(data) {
            startNewRound(key);
            io.to(data.key).emit('server_start_room');
        });

        // Get the current round's question
        socket.on('client_get_question', function(data) {
            socket.emit('server_get_question', {question: rooms[data.key].roundQuestion});
        });

        // Vote for a player
        socket.on('client_vote', function(data) {
            var room = rooms[data.key];
            var roundData = room.roundData;
            roundData.votes[data.voted]++;
            roundData.voters[data.voted].push(data.name);
            roundData.voted.push(data.name);

            // Update players with the votes
            io.to(data.key).emit('server_vote', {voted: roundData.voted});

            // Check if all players voted
            if (roundData.voted.size() == room.players.size()) {
                var finished = room.rounds == room.maxRounds;

                endRound(data.key);
                io.to(data.key).emit('server_end_round', {players: room.players, roundData: roundData, finished: finished});
                
                // Clean up game if it is finished
                if (finished) {
                    rooms[data.key] = null;
                    for (var token in tokenRoom) {
                        if (tokenRoom[token] == data.key) {
                            tokenRoom[token] = null;
                            break;
                        }
                    }
                }
            }
        });

        // When a player is ready
        socket.on('client_ready', function(data) {
            io.to(data.key).emit('server_ready', data.name);
            var room = rooms[data.key];
            room.roundReady.push(data.name);

            // All the players are ready, start a new round
            if (room.roundReady.size() == room.players.size()) {
                startNewRound();
                io.to(data.key).emit('server_start_round');
            }
        });
    });
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
            voted: [], // Number of players voted
            votes: {}, // Number of votes each player got
            voters: {} // Who voted to who
        },
        roundReady: []
    };
    rooms[key].players[name] = {score: 0};

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
        rooms[key].players[name] = {score: 0};
        return 1;
    }
}

function startNewRound(key) {
    rooms[key].rounds++;
    generateNewQuestion(key);
}

function endRound(key) {
    var room = rooms[key];
    var roundData = room.roundData;
    for (var name in roundData.votes) {
        var votesCount = roundData.votes[name];
        room.players[name].score += votesCount;
    }

    room.roundData = {};
}

function generateNewRoomKey() {
    var key = randToken.generate(4);
    while (rooms[key] != null)
        key = randToken.generate(4);

    return key;
}

function generateNewQuestion(key) {
    var questions = require('./questions');
    var rand = Math.random(0, questions.size());
    while (rooms[key].questionsAsked.indexOf(rand) > -1)
        rand = Math.random(0, questions.size());

    rooms[key].questionsAsked.push(rand);
    rooms[key].roundQuestion = questions[rand];
}

module.exports = game;