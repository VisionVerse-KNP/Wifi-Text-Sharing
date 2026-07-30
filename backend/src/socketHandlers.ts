import { Server, Socket } from 'socket.io';
import { randomUUID } from 'crypto';
import {
  ClientToServerEvents,
  ServerToClientEvents,
  InterServerEvents,
  SocketData,
  ChatMessage,
} from './types';
import { resolveRoomId } from './network';
import * as store from './roomStore';

type IOServer = Server<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;
type IOSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

const MAX_NAME_LENGTH = 30;
const MAX_MESSAGE_LENGTH = 2000;
const MAX_EMOJI_LENGTH = 8;
const MAX_TEXT_LENGTH = 20000;
const MAX_ROOM_NAME_LENGTH = 60;
const MAX_PASSWORD_LENGTH = 64;

function sanitize(input: string, maxLength: number): string {
  return input.replace(/\s+/g, (m) => (m === ' ' ? ' ' : m)).trim().slice(0, maxLength);
}

/**
 * Minimal fixed-window rate limiter, keyed per socket + action. Not a
 * replacement for infra-level protection, but stops a single misbehaving
 * client from flooding a room with messages or spinning up rooms in a loop.
 */
function createRateLimiter(maxHits: number, windowMs: number) {
  const hits = new Map<string, { count: number; resetAt: number }>();
  return (key: string): boolean => {
    const now = Date.now();
    const entry = hits.get(key);
    if (!entry || now > entry.resetAt) {
      hits.set(key, { count: 1, resetAt: now + windowMs });
      return true;
    }
    if (entry.count >= maxHits) return false;
    entry.count += 1;
    return true;
  };
}

const allowMessage = createRateLimiter(20, 10_000); // 20 messages / 10s per socket
const allowRoomCreate = createRateLimiter(5, 60_000); // 5 room creations / min per socket
const allowRoomJoinAttempt = createRateLimiter(10, 60_000); // 10 join attempts / min per socket

export function registerSocketHandlers(io: IOServer): void {
  // Reclaim empty private rooms periodically so memory doesn't grow unbounded.
  setInterval(() => store.cleanupInactivePrivateRooms(), 5 * 60 * 1000).unref();

  io.on('connection', (socket: IOSocket) => {
    const rawAddress = socket.handshake.address;
    const lanRoomId = resolveRoomId(rawAddress);

    function attachToRoom(roomId: string, mode: 'lan' | 'private', cleanName: string) {
      const color = store.colorForIndex(store.roomUserCount(roomId));

      socket.data.name = cleanName;
      socket.data.roomId = roomId;
      socket.data.color = color;
      socket.data.mode = mode;

      socket.join(roomId);

      const user = { id: socket.id, name: cleanName, color, joinedAt: Date.now() };
      store.addUser(roomId, user);

      // Send full current state to the newly joined client
      socket.emit('room:state', store.getRoomState(roomId));

      // Notify everyone else in the room
      socket.to(roomId).emit('user:joined', { user, count: store.roomUserCount(roomId) });
      io.to(roomId).emit('users:update', { users: store.getRoomState(roomId).users });
    }

    socket.on('user:join', ({ name }) => {
      const cleanName = sanitize(name || 'Guest', MAX_NAME_LENGTH) || 'Guest';
      attachToRoom(lanRoomId, 'lan', cleanName);
    });

    socket.on('room:create', ({ name, roomName, password }) => {
      if (!allowRoomCreate(socket.id)) {
        socket.emit('room:error', { message: 'Too many rooms created. Please wait a moment and try again.' });
        return;
      }
      const cleanName = sanitize(name || 'Guest', MAX_NAME_LENGTH) || 'Guest';
      const cleanRoomName = sanitize(roomName || '', MAX_ROOM_NAME_LENGTH);
      const cleanPassword = password ? sanitize(password, MAX_PASSWORD_LENGTH) : undefined;

      const { roomId, password: finalPassword } = store.createPrivateRoom(
        cleanRoomName,
        socket.id,
        cleanName,
        cleanPassword
      );

      socket.emit('room:created', {
        roomId,
        roomName: store.getRoomMeta(roomId)?.roomName ?? cleanRoomName,
        password: finalPassword,
      });

      attachToRoom(roomId, 'private', cleanName);
    });

    socket.on('room:join', ({ name, roomId, password }) => {
      if (!allowRoomJoinAttempt(socket.id)) {
        socket.emit('room:error', { message: 'Too many join attempts. Please wait a moment and try again.' });
        return;
      }
      const cleanName = sanitize(name || 'Guest', MAX_NAME_LENGTH) || 'Guest';
      const cleanRoomId = sanitize((roomId || '').toUpperCase(), 12);
      const cleanPassword = sanitize(password || '', MAX_PASSWORD_LENGTH);

      const result = store.checkPrivateRoomPassword(cleanRoomId, cleanPassword);
      if (!result.ok) {
        const message =
          result.reason === 'not_found'
            ? 'Room not found. Check the Room ID and try again.'
            : 'Incorrect password for this room.';
        socket.emit('room:error', { message });
        return;
      }

      attachToRoom(cleanRoomId, 'private', cleanName);
    });

    socket.on('room:delete', () => {
      const roomId = socket.data.roomId;
      if (!roomId || socket.data.mode !== 'private') return;
      if (!store.isRoomOwner(roomId, socket.id)) {
        socket.emit('room:error', { message: 'Only the room owner can delete this room.' });
        return;
      }
      io.to(roomId).emit('room:deleted', { byName: socket.data.name });
      const socketsInRoom = io.sockets.adapter.rooms.get(roomId);
      socketsInRoom?.forEach((sid) => {
        io.sockets.sockets.get(sid)?.leave(roomId);
      });
      store.deleteRoom(roomId);
    });

    socket.on('text:update', ({ content }) => {
      if (!socket.data.roomId) return;
      const clean = typeof content === 'string' ? content.slice(0, MAX_TEXT_LENGTH) : '';
      const updated = store.setSharedText(socket.data.roomId, clean, socket.data.name);
      socket.to(socket.data.roomId).emit('text:updated', updated);
    });

    socket.on('message:send', ({ text, replyToId }) => {
      if (!socket.data.roomId) return;
      if (!allowMessage(socket.id)) {
        socket.emit('error:message', { message: 'You are sending messages too quickly. Please slow down.' });
        return;
      }
      const clean = sanitize(text || '', MAX_MESSAGE_LENGTH);
      if (!clean) return;

      const repliedTo = replyToId ? store.findMessage(socket.data.roomId, replyToId) : null;

      const message: ChatMessage = {
        id: randomUUID(),
        userId: socket.id,
        userName: socket.data.name,
        text: clean,
        timestamp: Date.now(),
        edited: false,
        replyTo: repliedTo
          ? { id: repliedTo.id, userName: repliedTo.userName, text: repliedTo.text.slice(0, 200) }
          : null,
        pinned: false,
        reactions: {},
      };
      store.addMessage(socket.data.roomId, message);
      io.to(socket.data.roomId).emit('message:new', message);
    });

    socket.on('message:edit', ({ id, text }) => {
      if (!socket.data.roomId) return;
      const clean = sanitize(text || '', MAX_MESSAGE_LENGTH);
      if (!clean) return;
      const updated = store.editMessage(socket.data.roomId, id, socket.id, clean);
      if (updated) io.to(socket.data.roomId).emit('message:updated', updated);
    });

    socket.on('message:delete', ({ id }) => {
      if (!socket.data.roomId) return;
      const removed = store.deleteMessage(socket.data.roomId, id, socket.id);
      if (removed) io.to(socket.data.roomId).emit('message:removed', { id });
    });

    socket.on('message:react', ({ id, emoji }) => {
      if (!socket.data.roomId) return;
      const clean = typeof emoji === 'string' ? emoji.trim().slice(0, MAX_EMOJI_LENGTH) : '';
      if (!clean) return;
      const updated = store.toggleReaction(socket.data.roomId, id, socket.id, clean);
      if (updated) io.to(socket.data.roomId).emit('message:updated', updated);
    });

    socket.on('message:pin', ({ id }) => {
      if (!socket.data.roomId) return;
      const updated = store.togglePin(socket.data.roomId, id);
      if (updated) io.to(socket.data.roomId).emit('message:updated', updated);
    });

    socket.on('file:delete', ({ id }) => {
      if (!socket.data.roomId) return;
      const removed = store.removeFileRecord(socket.data.roomId, id, socket.id);
      if (removed) io.to(socket.data.roomId).emit('file:removed', { id });
    });

    socket.on('typing:start', () => {
      if (!socket.data.roomId) return;
      socket.to(socket.data.roomId).emit('typing:update', {
        userId: socket.id,
        name: socket.data.name,
        isTyping: true,
      });
    });

    socket.on('typing:stop', () => {
      if (!socket.data.roomId) return;
      socket.to(socket.data.roomId).emit('typing:update', {
        userId: socket.id,
        name: socket.data.name,
        isTyping: false,
      });
    });

    socket.on('board:clear', () => {
      if (!socket.data.roomId) return;
      store.clearBoard(socket.data.roomId);
      io.to(socket.data.roomId).emit('board:cleared', { byName: socket.data.name });
    });

    socket.on('disconnect', () => {
      const rid = socket.data.roomId;
      if (!rid) return;
      const removedUser = store.removeUser(rid, socket.id);
      if (removedUser) {
        io.to(rid).emit('user:left', {
          userId: socket.id,
          name: removedUser.name,
          count: store.roomUserCount(rid),
        });
        io.to(rid).emit('users:update', { users: store.getRoomState(rid).users });
      }
    });
  });
}
