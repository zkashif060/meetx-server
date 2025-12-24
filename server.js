const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
const server = http.createServer(app);
const io = socketIo(server, {
    cors: { origin: '*' }
});

io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('join-room', (roomId) => {
        socket.join(roomId);
        // Send new user ID to all other users in the room
        socket.to(roomId).emit('user-joined', socket.id);

        // Send existing participants to new user
        const clients = Array.from(io.sockets.adapter.rooms.get(roomId) || []);
        const otherClients = clients.filter(id => id !== socket.id);
        socket.emit('existing-users', otherClients);
    });

    socket.on('signal', (data) => {
        io.to(data.to).emit('signal', { from: socket.id, signal: data.signal });
    });

    socket.on('disconnecting', () => {
        const rooms = Array.from(socket.rooms).filter(r => r !== socket.id);
        rooms.forEach(roomId => {
            socket.to(roomId).emit('user-left', socket.id);
        });
    });
});


server.listen(5000, () => console.log('Server running on port 5000'));
