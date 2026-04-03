import type { Server as SocketIOServer } from 'socket.io';

let socketServer: SocketIOServer | null = null;

export const setSocketServer = (io: SocketIOServer) => {
    socketServer = io;
};

export const getSocketServer = () => socketServer;

export const getUserSocketRoom = (userId: string) => `user_${String(userId || '').trim()}`;

export const emitToUserRoom = (userId: string, eventName: string, payload: unknown) => {
    if (!socketServer) {
        return;
    }

    socketServer.to(getUserSocketRoom(userId)).emit(eventName, payload);
};
