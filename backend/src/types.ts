export interface RoomUser {
  id: string; // socket id
  name: string;
  color: string;
  joinedAt: number;
}

export interface MessageReplySnapshot {
  id: string;
  userName: string;
  text: string;
}

export interface ChatMessage {
  id: string;
  userId: string;
  userName: string;
  text: string;
  timestamp: number;
  edited: boolean;
  replyTo: MessageReplySnapshot | null;
  pinned: boolean;
  reactions: Record<string, string[]>; // emoji -> userIds who reacted
}

export interface LinkPreview {
  url: string;
  title: string | null;
  description: string | null;
  image: string | null;
  domain: string;
}

export type FileCategory =
  | 'image'
  | 'video'
  | 'audio'
  | 'pdf'
  | 'document'
  | 'spreadsheet'
  | 'presentation'
  | 'archive'
  | 'code'
  | 'text'
  | 'other';

export interface FileAttachment {
  id: string;
  uploaderId: string; // socket id at time of upload
  uploaderName: string;
  originalName: string;
  storedName: string;
  mimeType: string;
  size: number; // bytes
  category: FileCategory;
  uploadedAt: number;
}

export interface SharedText {
  content: string;
  updatedByName: string | null;
  updatedAt: number;
}

export type RoomMode = 'lan' | 'private';

export interface RoomMeta {
  mode: RoomMode;
  roomName: string | null;
  ownerId: string | null;
  ownerName: string | null;
  locked: boolean;
}

export interface RoomState {
  roomId: string;
  users: RoomUser[];
  messages: ChatMessage[];
  files: FileAttachment[];
  sharedText: SharedText;
  meta: RoomMeta;
}

// ---- Client -> Server events ----
export interface ClientToServerEvents {
  'user:join': (payload: { name: string }) => void;
  'room:create': (payload: { name: string; roomName: string; password?: string }) => void;
  'room:join': (payload: { name: string; roomId: string; password: string }) => void;
  'room:delete': () => void;
  'text:update': (payload: { content: string }) => void;
  'message:send': (payload: { text: string; replyToId?: string }) => void;
  'message:edit': (payload: { id: string; text: string }) => void;
  'message:delete': (payload: { id: string }) => void;
  'message:react': (payload: { id: string; emoji: string }) => void;
  'message:pin': (payload: { id: string }) => void;
  'file:delete': (payload: { id: string }) => void;
  'typing:start': () => void;
  'typing:stop': () => void;
  'board:clear': () => void;
}

// ---- Server -> Client events ----
export interface ServerToClientEvents {
  'room:state': (state: RoomState) => void;
  'room:created': (payload: { roomId: string; roomName: string; password: string }) => void;
  'room:error': (payload: { message: string }) => void;
  'room:deleted': (payload: { byName: string }) => void;
  'user:joined': (payload: { user: RoomUser; count: number }) => void;
  'user:left': (payload: { userId: string; name: string; count: number }) => void;
  'users:update': (payload: { users: RoomUser[] }) => void;
  'text:updated': (payload: SharedText) => void;
  'message:new': (payload: ChatMessage) => void;
  'message:updated': (payload: ChatMessage) => void;
  'message:removed': (payload: { id: string }) => void;
  'file:new': (payload: FileAttachment) => void;
  'file:removed': (payload: { id: string }) => void;
  'typing:update': (payload: { userId: string; name: string; isTyping: boolean }) => void;
  'board:cleared': (payload: { byName: string }) => void;
  'error:message': (payload: { message: string }) => void;
}

export interface InterServerEvents {
  ping: () => void;
}

export interface SocketData {
  name: string;
  roomId: string;
  color: string;
  mode: RoomMode;
}
