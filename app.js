
/**
 * entrance module
*/

var express = require('express')
  , routes = require('./routes')
  , user = require('./routes/user')
  , http = require('http')
  , path = require('path');

var app = express();
var flag = false;

// all environments
app.set('port', process.env.PORT || 3000);
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.favicon());
app.use(express.logger('dev'));
app.use(express.bodyParser());
app.use(express.cookieParser());
app.use(express.methodOverride());
app.use(app.router);
app.use(express.static(path.join(__dirname, 'public')));

// development only
if ('development' == app.get('env')) {
  app.use(express.errorHandler());
}

var users = {};//store all online users
app.get("/", function(req, res){
  if(!req.cookies.user){
    res.redirect("/signin");
  }else{
    res.sendfile("views/index.html");
  }
});
app.get("/signin", function(req, res){
  res.sendfile("views/signin.html");
});
app.post("/signin", function(req, res){
  if(users[req.body.username]){
    res.redirect("/signin");
  }else{
    res.cookie("user", req.body.username);
    res.redirect("/");
  }
});

var server = http.createServer(app);
var io = require('socket.io').listen(server);
io.sockets.on('connection', function(socket){
  socket.on('online', function(data){
  var sqlite3 = require('sqlite3').verbose();
  var db = new sqlite3.Database('chatRecord');
  var async = require('async');
  var record = null;
  var username = data.user;
    socket.name = data.user;
    if(!users[data.user]){
      users[data.user] = data.user;
    }
//judge whether need to load previous records by using async module
  async.waterfall([
    function(callback){
     var flag = false;
     db.serialize(function() {
      db.get("SELECT * from users where user = ?", username, function(err, row) {    
        if(row){
        flag = true;//global variable
      }
      callback(null, flag);
    }); 
    });
   },
   function(flag, callback) { 
    console.log("we are the second " + flag);
    if(flag){
      //load records
      db.serialize(function() {
      db.all("SELECT user, time, info FROM record", function(err, row){
      record = row;
      callback(null, record);
    });
    }); 
      db.close();
    }else{
      // add user name to the table
      db.serialize(function() {
      db.run("CREATE TABLE IF NOT EXISTS users (user String)");
      var stmt = db.prepare("INSERT INTO users VALUES (?)");
      stmt.run(username);
      stmt.finalize();
    });
    db.close();
    callback(null, record);
    }

  }],function (err, result) {
    io.sockets.emit('online', {users:users, user:data.user, record:result});
  });

  });
  socket.on('say', function(data){
    save(data);
    socket.broadcast.emit('say', data);
  });
  socket.on('disconnect', function(){
    if(users[socket.name]){
      delete users[socket.name];
      socket.broadcast.emit('offline', {users:users, user:socket.name});
    }
  });
});

server.listen(app.get('port'), function(){
  console.log('Express server listening on port ' + app.get('port'));
});

function save(data){
var sqlite3 = require('sqlite3').verbose();
var db = new sqlite3.Database('chatRecord');
 
db.serialize(function() {
  db.run("CREATE TABLE IF NOT EXISTS record (user Integer, time String, info TEXT)");
 
  var stmt = db.prepare("INSERT INTO record VALUES (?, ?, ?)");
      stmt.run([data.user, now(), data.message]);
  
  stmt.finalize();
});

db.close();

}

//get current time
  function now() {
    var date = new Date();
    var time = (date.getMonth() + 1)+ '.' + date.getDate() + '.' + date.getFullYear()  + ' ' + date.getHours() + ':' + (date.getMinutes() < 10 ? ('0' + date.getMinutes()) : date.getMinutes());
    return time;
  }

