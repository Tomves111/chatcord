const express = require('express');
const path = require('path');
const http = require('http');
const socketio = require('socket.io')
const formatMessage = require('./utils/messages');
const {userJoin, getCurrentUser, userLeave, getRoomUsers} = require('./utils/users')

const app = express();
const server = http.createServer(app);
const io = socketio(server);

app.use(express.static(path.join(__dirname,'public')));

const botName = 'ChatCord Bot';
//run when client connects
io.on('connection', socket => {
    socket.on('joinRoom', ({username, room}) => {
        const user = userJoin(socket.id, username, room);

        socket.join(user.room);

        socket.emit('message',formatMessage(botName,'Welcome to chatcord'));

        //broadcast when a user connects
        socket.broadcast
        .to(user.room)
        .emit(
            'message',
            formatMessage(botName,`${user.username} has joined the chat`));

            //send users and rom info
            io.to(user.room).emit('roomUsers', {
                room: user.room,
                users: getRoomUsers(user.room)
            });
    });
    
    
    
//listen for chatMessage
socket.on('chatMessage', msg => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit('message', formatMessage(user.username, msg));
});
//runs when clients disconnets
socket.on('disconnect', () => {
    const user = userLeave(socket.id)
    if(user) {
        io.to(user.room).emit('message',formatMessage(botName,`${user.username} has left the chat`));
        io.to(user.room).emit('roomUsers', {
            room: user.room,
            users: getRoomUsers(user.room)
        });
    }

});

socket.on('chatMessage', (msg) => {
    io.emit('message',formatMessage('USER',msg));
});

});

const PORT = 3000 || process.env.PORT;

server.listen(PORT, () => console.log(`Server running on port ${PORT}`));