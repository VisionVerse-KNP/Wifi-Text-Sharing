import { useCallback, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import { getServerUrl } from '../lib/serverUrl';
import { setAppBadge, showAppNotification } from '../lib/notifications';
import {
  ChatMessage,
  ClientToServerEvents,
  ConnectionStatus,
  FileAttachment,
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
  const [files, setFiles] = useState<FileAttachment[]>([]);
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

  // Socket event handlers below are set up once per connection and can live
  // a long time — reading `roomMeta` (React state) directly inside them
  // would capture a stale value from whenever the effect last ran. This ref
  // is kept in sync so handlers always see the current room info.
  const roomMetaRef = useRef<RoomMeta>(EMPTY_META);
  useEffect(() => {
    roomMetaRef.current = roomMeta;
  }, [roomMeta]);

  const hasConnectedBeforeRef = useRef(false);
  const unreadCountRef = useRef(0);

  useEffect(() => {
    const clearUnread = () => {
      if (document.visibilityState === 'visible' && document.hasFocus()) {
        unreadCountRef.current = 0;
        setAppBadge(0);
      }
    };
    window.addEventListener('visibilitychange', clearUnread);
    window.addEventListener('focus', clearUnread);
    return () => {
      window.removeEventListener('visibilitychange', clearUnread);
      window.removeEventListener('focus', clearUnread);
    };
  }, []);

  const bumpUnread = () => {
    unreadCountRef.current += 1;
    setAppBadge(unreadCountRef.current);
  };

  const roomLabel = () => {
    const meta = roomMetaRef.current;
    return meta.mode === 'lan' ? 'Local WiFi' : meta.roomName ?? 'Private Room';
  };

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

      if (hasConnectedBeforeRef.current) {
        pushToast('Connection restored', 'info');
      }
      hasConnectedBeforeRef.current = true;

      if (join.mode === 'lan') {
        socket.emit('user:join', { name: displayName });
      } else if (join.action === 'create') {
        socket.emit('room:create', { name: displayName, roomName: join.roomName, password: join.password });
      } else {
        socket.emit('room:join', { name: displayName, roomId: join.roomId, password: join.password });
      }
    });

    socket.io.on('reconnect_attempt', () => setStatus('reconnecting'));
    socket.on('disconnect', () => {
      setStatus('reconnecting');
      if (hasConnectedBeforeRef.current) pushToast('Connection lost — reconnecting…', 'error');
    });
    socket.io.on('reconnect_failed', () => setStatus('offline'));

    socket.on('room:created', ({ roomId: newRoomId, roomName, password }) => {
      setRoomId(newRoomId);
      setCreatedPassword(password);
      pushToast(`Room "${roomName}" created!`, 'info');
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
      setFiles(state.files);
      setSharedTextState(state.sharedText);
      setRoomMeta(state.meta);
      setRoomId(state.roomId);
      setJoined(true);
    });

    socket.on('user:joined', ({ user }) => {
      pushToast(`${user.name} joined`, 'join');
      showAppNotification({
        title: roomLabel(),
        body: `${user.name} joined the room`,
        tag: 'wts-join',
      });
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
        bumpUnread();
        const mentioned = displayName ? msg.text.toLowerCase().includes(`@${displayName.toLowerCase()}`) : false;
        showAppNotification({
          title: mentioned ? `${msg.userName} mentioned you` : msg.userName,
          body: `${msg.text}\n${roomLabel()}`,
          tag: 'wts-message',
        });
      }
    });

    socket.on('message:updated', (msg) => {
      setMessages((prev) => prev.map((m) => (m.id === msg.id ? msg : m)));
    });

    socket.on('message:removed', ({ id }) => {
      setMessages((prev) => prev.filter((m) => m.id !== id));
    });

    socket.on('file:new', (file) => {
      setFiles((prev) => [...prev, file]);
      if (file.uploaderId !== socket.id) {
        pushToast(`${file.uploaderName} shared a file`, 'info');
        bumpUnread();
        showAppNotification({
          title: file.uploaderName,
          body: `Shared a file: ${file.originalName}\n${roomLabel()}`,
          tag: 'wts-file',
        });
      }
    });

    socket.on('file:removed', ({ id }) => {
      setFiles((prev) => prev.filter((f) => f.id !== id));
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
      setFiles([]);
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

  const sendMessage = useCallback((text: string, replyToId?: string) => {
    socketRef.current?.emit('message:send', { text, replyToId });
  }, []);

  const editMessage = useCallback((id: string, text: string) => {
    socketRef.current?.emit('message:edit', { id, text });
  }, []);

  const deleteMessage = useCallback((id: string) => {
    socketRef.current?.emit('message:delete', { id });
  }, []);

  const reactToMessage = useCallback((id: string, emoji: string) => {
    socketRef.current?.emit('message:react', { id, emoji });
  }, []);

  const togglePinMessage = useCallback((id: string) => {
    socketRef.current?.emit('message:pin', { id });
  }, []);

  const deleteFile = useCallback((id: string) => {
    socketRef.current?.emit('file:delete', { id });
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
    files,
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
    reactToMessage,
    togglePinMessage,
    deleteFile,
    startTyping,
    stopTyping,
    clearBoard,
    deleteRoom,
    leaveRoom,
    pushToast,
  };
}
