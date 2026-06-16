import { Server } from "socket.io";
import { Server as ServerHttp } from "http";
import redisService from "../../common/services/redis.service";
import { decodeToken_and_fetchUser } from "../../common/middleware/authentication";
import chatGateway from "../chat/realtime/chat.gateway";

class SocketGateway {
  constructor() {}
  initIo = async (httpServer: ServerHttp) => {
    // console.log("Hi2");

    const io = new Server(httpServer, {
      cors: { origin: "*" },
    });

    io.use(async (socket, next) => {
      // console.log(socket.handshake.auth.authorization);
      try {
        const { user } = await decodeToken_and_fetchUser(
          socket.handshake.auth.authorization ||
            socket.handshake.headers.authorization,
        );

        socket.data.user = user;
        next();
      } catch (error: any) {
        next(error);
      }
    });

    io.on("connection", async (socket) => {
      // console.log("Hi3");
      await chatGateway.registerEvent(socket, io);
      redisService.addSocket({
        userId: socket.data.user._id,
        socketID: socket.id,
      });
      console.log({
        userSocketsID: await redisService.getSockets(socket.data.user._id),
      });

      socket.on("disconnect", async () => {
        redisService.removeSocket({
          userId: socket.data.user._id,
          socketID: socket.id,
        });
        console.log({
          userSocketsIDAfterConnect: await redisService.getSockets(
            socket.data.user._id,
          ),
        });
      });
    });
  };
}

// socket.on("hi", (data, cb) => {
// cb("hi from BackEnd");
// socket.emit("hiBack", "hi from BackEnd");
// socket.broadcast.emit("hiBack", "hi from BackEnd");
// io.emit("hiBack", "hi from BackEnd");
// socket.to(data.id).emit("hiBack", "hi from BackEnd");
// socket.except(data.id).emit("hiBack", "hi from BackEnd");
// io.except(data.id).emit("hiBack", "hi from BackEnd");
// });

export default new SocketGateway();
