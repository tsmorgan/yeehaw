const express = require('express');
const app = express();
const http = require('http');
const path = require('path');
const server = http.createServer(app);
const { Server } = require("socket.io");
const io = new Server(server);
const  nunjucks = require('nunjucks')
const _ = require('lodash');

nunjucks.configure('public', {
  autoescape:  true,
  express:  app,
  watch: true
})

let users = [];
let hidden = false;

app.get('/', (req, res) => {
  console.log('got here');
  res.render('index.html', {});
});

app.use(express.static(path.join(__dirname, 'public')));

/** 
 *  - - - - - - - - - - - - 
    All the SOCKET.IO stuff
    - - - - - - - - - - - - 
 */
io.on('connection', (socket) => {
  
  // console.log('a user connected: ',socket.id);  
  socket.emit('users', users);

  socket.on('disconnect', () => {
    // console.log('user disconnected: ',socket.id);
    const i = _.findIndex(users, { id: socket.id });
    if (i !== -1) {
      users.splice(i, 1)[0];
      io.sockets.emit('users', users,hidden);
    }
  });  

  /**
   * When clients sends a new username
   */
  socket.on('new user', (msg) => {
    console.log('new user: ', msg, socket.id);
    users.push({name:msg, id:socket.id});
    io.sockets.emit('users', users,hidden);
  });

  /**
   * when client picks a card
   */
  socket.on('choice', (num) => {
    const user = _.find(users, { id: socket.id });
    if (user) user.choice = num;
    io.sockets.emit('users', users,hidden);
  });

  /**
   * when click triggers reset
   */
  socket.on('reset', (num) => {
    io.sockets.emit('reset', 1);
    _.forEach(users, (obj) => {
      obj.choice = undefined;
    });
    io.sockets.emit('users', users,hidden);
  });

   /**
   * when click triggers reset
   */
    socket.on('toggle', (hide) => {
      hidden = !hidden;
      io.sockets.emit('users', users, hidden);
    });

});

server.listen(3000, () => {
  console.log('listening on http://localhost:3000/');
});