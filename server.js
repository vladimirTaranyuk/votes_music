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
    voters: new Set(),
    randomResult: null
};

app.use(express.static(path.join(__dirname, '/public')));
// В server.js убедитесь, что есть обработчик для корневого пути
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '/public/Index.html'));
});



io.on('connection', (socket) => {
    // Отправляем текущее состояние при подключении
    socket.emit('update', votes);
    
    // Обработка голосования
    socket.on('vote', (side) => {
        const voterId = socket.id;
        
        if (!votes.voters.has(voterId)) {
            votes[side]++;
            votes.voters.add(voterId);
            io.emit('update', votes);
        }
    });
    
    // Обработка сброса
    socket.on('reset', () => {
        votes.left = 0;
        votes.right = 0;
        votes.voters.clear(); // Очищаем список проголосовавших
        votes.randomResult = null;
        io.emit('update', votes);
        io.emit('resetVotingState'); // Сообщаем клиентам о сбросе
    });

    
    // Обработка рандомайзера
    socket.on('randomize', () => {
        votes.randomResult = Math.random() < 0.5 ? 'left' : 'right';
        io.emit('update', votes);
    });
});

    app.get('/', (req, res) => {
       res.send('Главная страница работает!');
});
const PORT = process.env.PORT || 8080;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
