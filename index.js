/* Start Here */
var express = require('express');
var app = require('express')();

let MongoClient = require('mongodb').MongoClient;
var http = require('http').Server(app);
var io = require('socket.io')(http);
var port = process.env.PORT || 3000;
let url = "mongodb://localhost:27017/";

app.use(express.static('public'));

app.get('/', function(req, res){
  res.sendFile(__dirname + '/home.html');
  //res.send('Server Started...On http://192.168.0.104:3000')
});
app.get('/chat', function(req, res){
  res.sendFile(__dirname + '/chat.html');
});
app.get('/register_page', function(req, res){
  res.sendFile(__dirname + '/register.html');
});

app.get('/how_to_play', function(req, res){
  res.sendFile(__dirname + '/how_to_play.html');
});

app.get('/home', function(req, res){
  res.sendFile(__dirname + '/home.html');
});
app.get('/login', function(req, res){
  res.sendFile(__dirname + '/login.html');
});


io.on('connection', function(socket){
  console.log("Some client Connected..");

      socket.on('join_room', function(data){
        console.log("Name :",data.name);
        console.log("Room :",data.room);
        socket.myData = {};
        socket.myData.name = data.name;
        socket.myData.room = data.room;
        console.log("socket.mydata :",socket.myData);
        socket.join(data.room); // join room

        io.to(data.room).emit('msg_broadcast', data.name+' Join This Room!'); // perticular room 
        
        //io.emit('msg_broadcast','Server is Loading'); // Server is Loading

      });
      /*Register*/
      socket.on('register_function', function(data){
        console.log("Name :",data.name);
        console.log("Email :",data.email);
        console.log("Mobile  No: ",data.mobileno);
        console.log("Password",data.password);
        socket.myData = {};
        socket.myData.name = data.name;
        socket.myData.email = data.email;
        socket.myData.mobileno = data.mobileno;
        socket.myData.password = data.password;
        console.log("socket.mydata :",socket.myData);
        MongoClient.connect(url , function(err , db){
            if(err) throw err;

            console.log("MongoClient On for Insert Data");
            console.log("Socket Id :" , socket.id);
            let dbo = db.db("cricket");
            let value = { email : socket.myData.email , _id : socket.id, username : socket.myData.name, mobileno : socket.myData.mobileno , dated : new Date() , password : socket.myData.password};
            dbo.collection("players").insertOne(value , function (err, resp){
            if(err) 
              {
                  throw err;
              }
            db.close();
            console.log("ready for redirect");
            io.to(socket.id).emit('redirect', 'Leave Now');
            
        }); 
        });
});


      // Authentication
      socket.on('authentication', function(data){
        console.log("Name :",data.username);
        console.log("Password",data.password);
        socket.myData = {};
        // socket.myData.username = data.username;
       // socket.myData.password = data.password;
        console.log("socket.mydata :",socket.myData);
        MongoClient.connect(url , function(err , db){
            if(err) throw err;

            console.log("MongoClient On for Authentication");
            console.log("Socket Id :" , socket.id);
            let dbo = db.db("cricket");
            let value = { username : data.username, password : data.password};
            //let query = { address : "Ahmedabad" };
        dbo.collection("players").find(value).toArray(function(err, res) {
        //dbo.collection("players").find({}).toArray(function(err, res) {
        if(res.length==0){
              console.log("Please Enter Valid Id");
              io.to(socket.id).emit('redirect', 'Leave Now');
            }
        else{
          console.log("SuccessFully ");
          io.to(socket.id).emit('redirect_to_chat', 'Leave Now');
          console.log(res);
            db.close();

        }
        }); 
        });
        //socket.join(data.room); // join room

        //io.to(data.room).emit('msg_broadcast', data.name+' Join This Room!'); // perticular room 
        
        //io.emit('msg_broadcast','Server is Loading'); // Server is Loading

      });





      socket.on('leave_room', function(data){
        console.log("leave name",socket.myData.name);
        socket.leave(socket.myData.room);
        io.to(socket.myData.room).emit('broadcast', socket.myData.name+' Leave This Room!');
        /*let time_dec = 3;
        let countdown =   setInterval(function(){
            if(time_dec == -1){
              clearTimeout(countdown);
              io.to(socket.id).emit('redirect', 'Leave Now');
            }

            io.to(socket.id).emit('broadcast', 'You Are Redirect in '+time_dec);
            time_dec--;
             // io.to(socket.id).emit('redirect', 'Levae Niow');
          },1000);*/
          io.to(socket.id).emit('redirect_leave_room', 'Leave Now');
      });

      socket.on('send_msg', function(msg){
        io.to(socket.myData.room).emit('msg_broadcast', socket.myData.name+' Say :'+msg);
      });

      /* Logout */
      socket.on('logout', function(msg){
          console.log("logout name",socket.myData.name);
          socket.leave(socket.myData.room);
          io.to(socket.myData.room).emit('broadcast', socket.myData.name+' Leave This Room!');
          io.to(socket.id).emit('redirect_logout', 'Leave Now');
      });

});

http.listen(port, function(){
  console.log('listening on *:' + port);
});
