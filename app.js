var app = require('express')();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var mongoose = require('mongoose');
var chatLog = require('./models/chatlog');
var cookie = require('cookie');
var jpickle = require('jpickle');
var redis = require('redis');

// Connect to mongodb
var db = mongoose.connection;
db.on('error', console.error);
db.once('open', function() {
  console.log('Connected to mongod server');
});

mongoose.connect('mongodb://localhost/qara');

var redisClient = redis.createClient(6379, '127.0.0.1');


app.get('/', function(req, res) {
  res.sendFile(__dirname + '/index.html');
});

io.on('connection', function(socket) {

  socket.on('login', function(data) {
    // console.log('Cookie : '+socket.request.headers.cookie);
    var cookies = cookie.parse(socket.request.headers.cookie);
    var sid = cookies['qara_sc'];

    if(sid) {
      redisClient.get('sessiion:'+sid, function(err, data) {
        if(err) {
          console.log(err);
          return;
        }
        decoded_data = jpickle.loads(data);
        // socket.name = decoded_data['username'];
        socket.userid = decoded_data['username'];
        io.emit('login', socket.userid);
        console.log('Client logged-in userame:'+socket.userid);
        setChatLog(socket.userid, 'LOGIN', socket.userid+' is logged in');
      });
    }


    // socket.name = data.name;
    // socket.userid = data.userid;

   // io.emit('login', data.name);

   // setInterval( sendMsg(socket), 1000);

   // setChatLog(data.userid, 'LOGIN', data.userid+' is logged in');
  });

  socket.on('chat', function(data) {
    console.log('Message from %s: %s', socket.userid, data.msg);

    var msg = {
      from: {
        // name: socket.name,
        userid: socket.userid
      },
      msg: data.msg
    };

    io.emit('chat', msg);

    setChatLog(socket.userid, 'CHAT', data.msg);

  });


  socket.on('forceDisconnect', function() {
    socket.disconnect();
  });

  socket.on('disconnect', function() {
    console.log('user disconnected: '+socket.userid);
  });

});


function setChatLog(fromUser, type, msg) {
  let chatlog = new chatLog();
  chatlog.fromUser = fromUser;
  chatlog.type = type;
  chatlog.msg = msg;

  chatlog.save(function(err) {
    if(err) {
      console.error(err);
      return;
    }
  });
}

server.listen(5002, function() {
  console.log('Socket IO Server listening on port 5002');
});
