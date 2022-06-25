const httpServer = require("http").createServer();
const { Server } = require("socket.io");

class Sockets {
    constructor(ctx) {
        this.config = ctx.config;
        const { socketService: { port }} = this.config;

        this.io = new Server(httpServer, { cors: '*'});

        this.io.on("connection", (socket) => {
            socket.removeAllListeners();
            console.log("New client connected");
            
            socket.on("disconnect", () => {
              console.log("Client disconnected");
            });
          });

        httpServer.listen(port);
    }

    emit(topic, data) {
      this.io.emit(topic, data);
    }
}

module.exports = Sockets;