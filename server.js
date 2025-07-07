const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Хранилище данных
let votes = {
    left: 0,
    right: 0,
    voters: [], // Массив объектов {socketId, username, side}
    randomResult: null
};

app.use(express.static(path.join(__dirname, '/public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '/public/index.html'));
});

io.on('connection', (socket) => {
    // Отправляем текущее состояние при подключении
    socket.emit('update', votes);

    // Обработка регистрации пользователя
    socket.on('register', (username) => {
        // Сохраняем имя пользователя в объекте socket
        socket.username = username;
    });

    // Обработка голосования
    socket.on('vote', (data) => {
        const { side, username } = data;
        const voterId = socket.id;

        // Проверяем, не голосовал ли уже этот пользователь
        const alreadyVoted = votes.voters.some(voter => voter.socketId === voterId);

        if (!alreadyVoted && username) {
            votes[side]++;
            votes.voters.push({
                socketId: voterId,
                username: username,
                side: side
            });
            io.emit('update', votes);
        }
    });

    // Обработка сброса
    socket.on('reset', () => {
        votes.left = 0;
        votes.right = 0;
        votes.voters = [];
        votes.randomResult = null;
        io.emit('update', votes);
        io.emit('resetVotingState');
    });

    // Обработка рандомайзера
    socket.on('randomize', () => {
        votes.randomResult = Math.random() < 0.5 ? 'left' : 'right';
        io.emit('update', votes);
    });

    // При отключении пользователя
    socket.on('disconnect', () => {
        // Можно добавить логику обработки отключения, если нужно
    });
});

const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});