import { Server, Socket } from "socket.io";
import chatService from "../chat.service";

class ChatEvent {
  constructor() {}
  sayHi = async (socket: Socket) => {
    socket.on("sayHi", (data) => {
      chatService.sayHi(data);
    });
  };
  sendMessage = async (socket: Socket, io: Server) => {
    socket.on("sendMessage", async (data) => {
      try {
        await chatService.sendMessage(data, socket, io);
      } catch (error: any) {
        socket.emit("custom_error", { message: error.message });
      }
    });
  };
  join_room = async (socket: Socket, io: Server) => {
    socket.on("join_room", async (data) => {
      try {
        await chatService.join_room(data, socket, io);
      } catch (error: any) {
        socket.emit("custom_error", { message: error.message });
      }
    });
  };
  sendGroupMessage = async (socket: Socket, io: Server) => {
    socket.on("sendGroupMessage", async (data) => {
      try {
        await chatService.sendGroupMessage(data, socket, io);
      } catch (error: any) {
        socket.emit("custom_error", { message: error.message });
      }
    });
  };
}

export default new ChatEvent();
