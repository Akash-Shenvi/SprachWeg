"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.emitToUserRoom = exports.getUserSocketRoom = exports.getSocketServer = exports.setSocketServer = void 0;
let socketServer = null;
const setSocketServer = (io) => {
    socketServer = io;
};
exports.setSocketServer = setSocketServer;
const getSocketServer = () => socketServer;
exports.getSocketServer = getSocketServer;
const getUserSocketRoom = (userId) => `user_${String(userId || '').trim()}`;
exports.getUserSocketRoom = getUserSocketRoom;
const emitToUserRoom = (userId, eventName, payload) => {
    if (!socketServer) {
        return;
    }
    socketServer.to((0, exports.getUserSocketRoom)(userId)).emit(eventName, payload);
};
exports.emitToUserRoom = emitToUserRoom;
