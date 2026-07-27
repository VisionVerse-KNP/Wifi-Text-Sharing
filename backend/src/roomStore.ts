import { randomInt } from 'crypto';
import { ChatMessage, RoomMeta, RoomState, RoomUser, SharedText } from './types';

/**
 * In-memory store, one entry per LAN "room" (subnet).
 *
 * The public API here (getOrCreateRoom, addUser, removeUser, addMessage,
 * editMessage, deleteMessage, setSharedText, clearBoard) is intentionally
 * storage-agnostic. To swap this for Redis or Postgres later:
 *   - Replace the `rooms` Map with Redis hash/list operations, or
 *   - Replace it with repository calls backed by Postgres tables
 *     (rooms, room_users, messages, shared_text).
 * None of the socket handler code needs to change as long as this
 * module's function signatures stay the same.
 */

const MAX_MESSAGES_PER_ROOM = 500;
const USER_COLORS = [
  '#F97316', '#EF4444', '#EC4899', '#8B5CF6', '#6366F1',
  '#3B82F6', '#06B6D4', '#10B981', '#84CC16', '#F59E0B',
];

interface RoomRecord {
  roomId: string;
  users: Map<string, RoomUser>;
  messages: ChatMessage[];
  sharedText: SharedText;
  meta: RoomMeta;
  password: string | null;
  emptySince: number | null;
}

const rooms = new Map<string, RoomRecord>();

const ROOM_ID_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I to avoid confusion
const ROOM_ID_LENGTH = 6;
const INACTIVE_PRIVATE_ROOM_TTL_MS = 30 * 60 * 1000; // 30 min empty -> reclaimed

function defaultLanMeta(): RoomMeta {
  return { mode: 'lan', roomName: null, ownerId: null, ownerName: null, locked: false };
}

function createEmptyRoom(roomId: string, meta: RoomMeta = defaultLanMeta()): RoomRecord {
  return {
    roomId,
    users: new Map(),
    messages: [],
    sharedText: {
      content: '',
      updatedByName: null,
      updatedAt: Date.now(),
    },
    meta,
    password: null,
    emptySince: null,
  };
}

export function getOrCreateRoom(roomId: string): RoomRecord {
  let room = rooms.get(roomId);
  if (!room) {
    room = createEmptyRoom(roomId);
    rooms.set(roomId, room);
  }
  return room;
}

function generateRoomId(): string {
  let id: string;
  do {
    id = Array.from({ length: ROOM_ID_LENGTH }, () => ROOM_ID_ALPHABET[randomInt(ROOM_ID_ALPHABET.length)]).join('');
  } while (rooms.has(id));
  return id;
}

function generatePassword(): string {
  return String(randomInt(100000, 1000000)); // 6-digit numeric password
}

/** Creates a brand-new password-protected private room and returns its id + password. */
export function createPrivateRoom(
  roomName: string,
  ownerId: string,
  ownerName: string,
  requestedPassword?: string
): { roomId: string; password: string } {
  const roomId = generateRoomId();
  const password = requestedPassword && requestedPassword.length >= 4 ? requestedPassword : generatePassword();
  const meta: RoomMeta = {
    mode: 'private',
    roomName: roomName || `${ownerName}'s Room`,
    ownerId,
    ownerName,
    locked: true,
  };
  const room = createEmptyRoom(roomId, meta);
  room.password = password;
  rooms.set(roomId, room);
  return { roomId, password };
}

export type JoinPrivateRoomResult =
  | { ok: true }
  | { ok: false; reason: 'not_found' | 'bad_password' };

export function findPrivateRoom(roomId: string): RoomRecord | undefined {
  const room = rooms.get(roomId);
  if (!room || room.meta.mode !== 'private') return undefined;
  return room;
}

export function checkPrivateRoomPassword(roomId: string, password: string): JoinPrivateRoomResult {
  const room = findPrivateRoom(roomId);
  if (!room) return { ok: false, reason: 'not_found' };
  if (room.password !== password) return { ok: false, reason: 'bad_password' };
  return { ok: true };
}

export function deleteRoom(roomId: string): void {
  rooms.delete(roomId);
}

export function isRoomOwner(roomId: string, userId: string): boolean {
  const room = rooms.get(roomId);
  return !!room && room.meta.ownerId === userId;
}

export function getRoomMeta(roomId: string): RoomMeta | undefined {
  return rooms.get(roomId)?.meta;
}

/** Sweeps empty private rooms that have been inactive past the TTL. Call on an interval. */
export function cleanupInactivePrivateRooms(): number {
  const now = Date.now();
  let removed = 0;
  rooms.forEach((room, roomId) => {
    if (room.meta.mode !== 'private') return;
    if (room.users.size > 0) {
      room.emptySince = null;
      return;
    }
    if (room.emptySince === null) {
      room.emptySince = now;
      return;
    }
    if (now - room.emptySince > INACTIVE_PRIVATE_ROOM_TTL_MS) {
      rooms.delete(roomId);
      removed += 1;
    }
  });
  return removed;
}

export function colorForIndex(index: number): string {
  return USER_COLORS[index % USER_COLORS.length];
}

export function addUser(roomId: string, user: RoomUser): void {
  const room = getOrCreateRoom(roomId);
  room.users.set(user.id, user);
}

export function removeUser(roomId: string, userId: string): RoomUser | undefined {
  const room = rooms.get(roomId);
  if (!room) return undefined;
  const user = room.users.get(userId);
  room.users.delete(userId);
  return user;
}

export function getRoomState(roomId: string): RoomState {
  const room = getOrCreateRoom(roomId);
  return {
    roomId,
    users: Array.from(room.users.values()),
    messages: room.messages,
    sharedText: room.sharedText,
    meta: room.meta,
  };
}

export function addMessage(roomId: string, message: ChatMessage): void {
  const room = getOrCreateRoom(roomId);
  room.messages.push(message);
  if (room.messages.length > MAX_MESSAGES_PER_ROOM) {
    room.messages.splice(0, room.messages.length - MAX_MESSAGES_PER_ROOM);
  }
}

export function editMessage(roomId: string, id: string, userId: string, text: string): ChatMessage | null {
  const room = rooms.get(roomId);
  if (!room) return null;
  const msg = room.messages.find((m) => m.id === id);
  if (!msg || msg.userId !== userId) return null;
  msg.text = text;
  msg.edited = true;
  return msg;
}

export function deleteMessage(roomId: string, id: string, userId: string): boolean {
  const room = rooms.get(roomId);
  if (!room) return false;
  const idx = room.messages.findIndex((m) => m.id === id);
  if (idx === -1 || room.messages[idx].userId !== userId) return false;
  room.messages.splice(idx, 1);
  return true;
}

export function setSharedText(roomId: string, content: string, updatedByName: string): SharedText {
  const room = getOrCreateRoom(roomId);
  room.sharedText = {
    content,
    updatedByName,
    updatedAt: Date.now(),
  };
  return room.sharedText;
}

export function clearBoard(roomId: string): void {
  const room = getOrCreateRoom(roomId);
  room.messages = [];
  room.sharedText = { content: '', updatedByName: null, updatedAt: Date.now() };
}

export function roomUserCount(roomId: string): number {
  return rooms.get(roomId)?.users.size ?? 0;
}
