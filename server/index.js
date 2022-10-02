const express = require("express");
const connectDB = require("./config/db");
const app = express();
const {chats} = require("./temp")
const userRoutes = require('./routes/userRoutes');
const { notFound, errorHandler } = require("./middleware/errorMiddleware");
const chatRoutes = require('./routes/chatRoutes');
const messageRoutes = require('./routes/messageRoutes');

require('dotenv').config();
connectDB();

app.use(express.json());
app.get("/",(req,res)=>{
    res.send("Hi this is Home!!");
})
app.use('/api/chat',chatRoutes);

app.use('/api/user',userRoutes);

app.use('/api/message',messageRoutes);
app.use(notFound);

app.use(errorHandler );

const PORT = process.env.PORT;
const server = app.listen(PORT,()=>{
    console.log(`Server is running at ${PORT}`);
})
const io = require('socket.io')(server,{
    pingTimeout: 60000,
    cors:{
        origin:"http://localhost:3000"
    }
})

io.on("connection",(socket)=>{
    console.log("connected to socket.io");

    socket.on('setup',(userData)=>{
        socket.join(userData._id);
        socket.emit('connected');
    })

    socket.on('join chat',(room)=>{
        socket.join(room);
        console.log("User joined Room "+room);
    });

    socket.on('typing',(room)=>socket.in(room).emit("typing"))
    socket.on('stop typing',(room)=>socket.in(room).emit("stop typing"))

    socket.on('new message',(newMessageRecieved)=>{
        var chat = newMessageRecieved.chat;
        if(!chat.users)
            return console.log("chat.users not defined");
        chat.users.forEach(user=>{
            if(user._id==newMessageRecieved.sender._id)
                return;
            socket.in(user._id).emit("message recieved", newMessageRecieved);
        })
    })

    socket.off('setup',()=>{
        console.log("User Disconnected");
        socket.leave(userData._id);
    })
});