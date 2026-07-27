import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getServerUrl } from '../lib/serverUrl';
import {
  ChatMessage,
  ClientToServerEvents,
  ConnectionStatus,
  RoomMeta,
  RoomUser,
  ServerToClientEvents,
  SharedText,
  ToastItem,
} from '../types';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

const MAX_TOASTS = 4;

export type JoinConfig =
  | { mode: 'lan' }
  | { mode: 'private'; action: 'create'; roomName: string; password?: string }
  | { mode: 'private'; action: 'join'; roomId: string; password: string };

const EMPTY_META: RoomMeta = { mode: 'lan', roomName: null, ownerId: null, ownerName: null, locked: false };

export function useSocketRoom(displayName: string | null, join: JoinConfig | null) {
  const socketRef = useRef<AppSocket | null>(null);
  const [status, setStatus] = useState<ConnectionStatus>('offline');
  const [users, setUsers] = useState<RoomUser[]>([]);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [sharedText, setSharedTextState] = useState<SharedText>({
    content: '',
    updatedByName: null,
    updatedAt: Date.now(),
  });
  const [typingUsers, setTypingUsers] = useState<Record<string, string>>({});
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [selfId, setSelfId] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<string | null>(null);
  const [roomMeta, setRoomMeta] = useState<RoomMeta>(EMPTY_META);
  const [joinError, setJoinError] = useState<string | null>(null);
  const [joined, setJoined] = useState(false);
  const [roomDeleted, setRoomDeleted] = useState<string | null>(null);
  const [createdPassword, setCreatedPassword] = useState<string | null>(null);

  const pushToast = useCallback((text: string, kind: ToastItem['kind'] = 'info') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    setToasts((prev) => [...prev.slice(-(MAX_TOASTS - 1)), { id, text, kind }]);
    window.setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 4000);
  }, []);

  useEffect(() => {
    if (!displayName || !join) return;

    setJoinError(null);
    setRoomDeleted(null);

    const socket: AppSocket = io(getServerUrl(), {
      transports: ['websocket', 'polling'],
      reconnectionAttempts: Infinity,
      reconnectionDelay: 800,
      timeout: 6000,
    });
    socketRef.current = socket;

    socket.on('connect', () => {
      setStatus('connected');
      setSelfId(socket.id ?? null);

      if (join.mode === 'lan') {
        socket.emit('user:join', { name: displayName });
      } else if (join.action === 'create') {
        socket.emit('room:create', { name: displayName, roomName: join.roomName, password: join.password });
      } else {
        socket.emit('room:join', { name: displayName, roomId: join.roomId, password: join.password });
      }
    });

    socket.io.on('reconnect_attempt', () => setStatus('reconnecting'));
    socket.on('disconnect', () => setStatus('reconnecting'));
    socket.io.on('reconnect_failed', () => setStatus('offline'));

    socket.on('room:created', ({ roomId: newRoomId, password }) => {
      setRoomId(newRoomId);
      setCreatedPassword(password);
    });

    socket.on('room:error', ({ message }) => {
      setJoinError(message);
      setJoined(false);
    });

    socket.on('room:deleted', ({ byName }) => {
      setRoomDeleted(byName);
      setJoined(false);
    });

    socket.on('room:state', (state) => {
      setUsers(state.users);
      setMessages(state.messages);
      setSharedTextState(state.sharedText);
      setRoomMeta(state.meta);
      setRoomId(state.roomId);
      setJoined(true);
    });

    socket.on('user:joined', ({ user }) => {
      pushToast(`${user.name} joined`, 'join');
    });

    socket.on('user:left', ({ name }) => {
      pushToast(`${name} left`, 'leave');
      setTypingUsers((prev) => {
        const next = { ...prev };
        Object.keys(next).forEach((id) => {
          if (next[id] === name) delete next[id];
        });
        return next;
      });
    });

    socket.on('users:update', ({ users: updated }) => setUsers(updated));

    socket.on('text:updated', (updated) => {
      setSharedTextState(updated);
    });

    socket.on('message:new', (msg) => {
      setMessages((prev) => [...prev, msg]);
      if (msg.userId !== socket.id) {
        pushToast(`${msg.userName} sent a message`, 'info');
      }
    });

    socket.on('message:updated', (msg) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    });

    socket.on('message:removed', ({ id }) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    });

    socket.on('typing:update', ({ userId, name, isTyping }) => {
      setTypingUsers((prev) => {
        const next = { ...prev };
        if (isTyping) next[userId] = name;
        else delete next[userId];
        return next;
      });
    });

    socket.on('board:cleared', ({ byName }) => {
      setMessages([]);
      setSharedTextState({ content: '', updatedByName: null, updatedAt: Date.now() });
      pushToast(`Board cleared by ${byName}`, 'info');
    });

    return () => {
      socket.disconnect();
      socketRef.current = null;
      setJoined(false);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, join?.mode, join && 'action' in join ? join.action : null, join && 'roomId' in join ? join.roomId : null, pushToast]);

  const updateSharedText = useCallback((content: string) => {
    setSharedTextState((prev) => ({ ...prev, content }));
    socketRef.current?.emit('text:update', { content });
  }, []);

  const sendMessage = useCallback((text: string) => {
    socketRef.current?.emit('message:send', { text });
  }, []);

  const editMessage = useCallback((id: string, text: string) => {
    socketRef.current?.emit('message:edit', { id, text });
  }, []);

  const deleteMessage = useCallback((id: string) => {
    socketRef.current?.emit('message:delete', { id });
  }, []);

  const startTyping = useCallback(() => socketRef.current?.emit('typing:start'), []);
  const stopTyping = useCallback(() => socketRef.current?.emit('typing:stop'), []);
  const clearBoard = useCallback(() => socketRef.current?.emit('board:clear'), []);
  const deleteRoom = useCallback(() => socketRef.current?.emit('room:delete'), []);
  const leaveRoom = useCallback(() => {
    socketRef.current?.disconnect();
    socketRef.current = null;
    setJoined(false);
  }, []);

  return {
    status,
    users,
    messages,
    sharedText,
    typingUsers,
    toasts,
    selfId,
    roomId,
    roomMeta,
    joined,
    joinError,
    roomDeleted,
    createdPassword,
    updateSharedText,
    sendMessage,
    editMessage,
    deleteMessage,
    startTyping,
    stopTyping,
    clearBoard,
    deleteRoom,
    leaveRoom,
  };
}
