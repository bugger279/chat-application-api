const socketio = require('socket.io');
const mongoose = require('mongoose');
const shortid = require('shortid');
const logger = require('./loggerLib.js');
const events = require('events');
const eventEmitter = new events.EventEmitter();

const tokenLib = require("./tokenLib.js");
const check = require("./checkLib.js");
const response = require('./responseLib')

let setServer = (server) => {
    let  allOnlineUsers = [];
    // initializing the socket
    let io = socketio.listen(server);
    let myIo = io.of('');

    // handling events
    // Main Event handler

    myIo.on('connection', (socket) => {
        console.log("on connection--emitting verify user");
        socket.emit("verifyUser", "");

        // code to verify user
        socket.on('set-user', (authToken) => {
            tokenLib.verifyClaimWithoutSecret(authToken, (err, user) => {
                if (err) {
                    socket.emit('auth-error', { status: 500, error: 'Please provide correct auth token' });
                } else {
                    console.log("user is verified..setting details");
                    let currentUser = user.data;
                    socket.userId = currentUser.userId;
                    let fullName = `${currentUser.firstName} ${currentUser.lastName}`;
                    console.log(`${fullName} is online`);

                    let userObj = {userId:currentUser.userId,fullName:fullName};
                    allOnlineUsers.push(userObj);
                    console.log(allOnlineUsers);

                    // Setting Room name
                    socket.room = 'edChat';
                    // Joining room
                    socket.join(socket.room);
                    socket.to(socket.room).broadcast.emit('online-user-list',allOnlineUsers);
                }
            })
        });
        // End of Set User

        // Disconnecting User
        socket.on('disconnect', () => {
            // disconnect user from socket 
            // Remive user from list
            // Unsubscribe form the room

            console.log('User disconnected');
            console.log(socket.userId);

            var removeIndex = allOnlineUsers.map(function(user) { return user.userId; }).indexOf(socket.userId);
            allOnlineUsers.splice(removeIndex,1)
            console.log(allOnlineUsers)

            socket.to(socket.room).broadcast.emit('online-user-list',allOnlineUsers);
            socket.leave(socket.room)
        });
    });
}