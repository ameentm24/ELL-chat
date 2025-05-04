const path = require("path");
const http = require("http");
const express = require("express");
const socketio = require("socket.io");
const formatMessage = require("./utils/messages");
const {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
} = require("./utils/users");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const PORT = process.env.PORT || 3000;

//set static folder
app.use(express.static(path.join(__dirname, "public")));

const botName = "Ell";

//run when client connects
io.on("connection", (socket) => {
  socket.on("joinRoom", ({ username, room }) => {
    const user = userJoin(socket.id, username, room);
    socket.join(user.room);

    //welcome
    socket.emit("message", formatMessage(botName, "welcome"));

    //Broadcast
    socket.broadcast
      .to(user.room)
      .emit("message", formatMessage(botName, `${user.username} has joined`));

    //users and rooms info
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  //listen for chat
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);

    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  //on disconnect
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    if (user) {
      io.to(user.room).emit(
        "message",
        formatMessage(botName, ` ${user.username} has left`)
      );

      //users and rooms info
      io.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

server.listen(PORT, () => {
  console.log(`Server is running at port : ${PORT}`);
});
