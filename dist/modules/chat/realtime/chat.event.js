"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chat_service_1 = __importDefault(require("../chat.service"));
class ChatEvent {
    constructor() { }
    sayHi = async (socket) => {
        socket.on("sayHi", (data) => {
            chat_service_1.default.sayHi(data);
        });
    };
    sendMessage = async (socket, io) => {
        socket.on("sendMessage", async (data) => {
            try {
                await chat_service_1.default.sendMessage(data, socket, io);
            }
            catch (error) {
                socket.emit("custom_error", { message: error.message });
            }
        });
    };
    join_room = async (socket, io) => {
        socket.on("join_room", async (data) => {
            try {
                await chat_service_1.default.join_room(data, socket, io);
            }
            catch (error) {
                socket.emit("custom_error", { message: error.message });
            }
        });
    };
    sendGroupMessage = async (socket, io) => {
        socket.on("sendGroupMessage", async (data) => {
            try {
                await chat_service_1.default.sendGroupMessage(data, socket, io);
            }
            catch (error) {
                socket.emit("custom_error", { message: error.message });
            }
        });
    };
}
exports.default = new ChatEvent();
