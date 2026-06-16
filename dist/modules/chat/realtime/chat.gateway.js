"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const chat_event_1 = __importDefault(require("./chat.event"));
class ChatGateway {
    constructor() { }
    registerEvent = async (socket, io) => {
        chat_event_1.default.sayHi(socket);
        chat_event_1.default.sendMessage(socket, io);
        chat_event_1.default.join_room(socket, io);
        chat_event_1.default.sendGroupMessage(socket, io);
    };
}
exports.default = new ChatGateway();
