import { io, Socket } from 'socket.io-client';
import { SOCKET_URL } from '@env';

class SocketService {
  public socket: Socket | null = null;

  connect(token: string) {
    if (this.socket) {
      this.socket.disconnect();
    }
    this.socket = io(SOCKET_URL || 'https://wapipulse.com', {
      auth: { token },
      transports: ['websocket'],
    });

    this.socket.on('connect', () => {
      console.log('Socket connected:', this.socket?.id);
    });

    this.socket.on('disconnect', () => {
      console.log('Socket disconnected');
    });
  }

  disconnect() {
    if (this.socket) {
      this.socket.disconnect();
      this.socket = null;
    }
  }
}

export const socketService = new SocketService();
