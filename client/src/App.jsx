import { useState, useEffect } from 'react';
import { io } from 'socket.io-client';
import GameSession from './components/GameSession';
import SessionJoin from './components/SessionJoin';
import './App.css';

function App() {
  const [socket, setSocket] = useState(null);
  const [sessionId, setSessionId] = useState('');
  const [playerId, setPlayerId] = useState(null);
  const [gameState, setGameState] = useState(null);
  const [connected, setConnected] = useState(false);

  useEffect(() => {
    // Подключаемся к серверу
    // Всегда используем hostname текущей страницы для работы в локальной сети
    // Сервер работает на порту 3000, клиент на 5173 (dev) или 3000 (prod)
    const serverUrl = `http://${window.location.hostname}:3000`;
    
    console.log('=== Initializing socket connection ===');
    console.log('Server URL:', serverUrl);
    
    const newSocket = io(serverUrl, {
      transports: ['websocket', 'polling'],
      reconnection: true,
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    });

    newSocket.on('connect', () => {
      console.log('✓ Connected to server:', serverUrl);
      console.log('Socket ID:', newSocket.id);
      setConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('✗ Disconnected from server');
      setConnected(false);
    });

    newSocket.on('connect_error', (error) => {
      console.error('✗ Connection error:', error);
      setConnected(false);
    });

    // Подписываемся на обновления состояния игры один раз
    newSocket.on('session-joined', (data) => {
      console.log('=== Received session-joined event ===');
      console.log('Full data:', data);
      console.log('SessionId:', data?.sessionId);
      console.log('PlayerId:', data?.playerId);
      console.log('Has gameState:', !!data?.gameState);
      
      if (data?.sessionId) {
        console.log('Setting sessionId to:', data.sessionId);
        setSessionId(data.sessionId);
      }
      if (data?.playerId) {
        console.log('Setting playerId to:', data.playerId);
        setPlayerId(data.playerId);
      }
      if (data?.gameState) {
        console.log('Setting gameState');
        setGameState(data.gameState);
      } else {
        console.warn('No gameState in session-joined event!');
      }
    });

    newSocket.on('player-joined', (data) => {
      console.log('Received player-joined event:', data);
      setGameState(data.gameState);
    });

    newSocket.on('cards-updated', (data) => {
      setGameState(data.gameState);
    });

    newSocket.on('player-ready-updated', (data) => {
      setGameState(data.gameState);
    });

    newSocket.on('cards-revealed', (data) => {
      setGameState(data.gameState);
    });

    newSocket.on('player-left', (data) => {
      setGameState(data.gameState);
    });

    newSocket.on('session-error', (data) => {
      console.error('Session error:', data.error);
      alert(data.error || 'Ошибка при присоединении к сессии');
    });

    setSocket(newSocket);

    return () => {
      newSocket.close();
    };
  }, []);

  const handleJoinSession = (id) => {
    if (!socket || !connected) {
      console.error('Cannot join session: socket not connected');
      return;
    }
    
    const sessionToJoin = id || '';
    console.log('Joining session:', sessionToJoin);
    
    socket.emit('join-session', sessionToJoin);
  };

  const handleJoinAsStoryteller = (id) => {
    console.log('=== handleJoinAsStoryteller called ===');
    console.log('Socket:', socket);
    console.log('Connected state:', connected);
    console.log('Socket connected:', socket?.connected);
    
    if (!socket) {
      console.error('✗ Cannot join as storyteller: socket is null');
      alert('Ошибка: Socket не инициализирован. Перезагрузите страницу.');
      return;
    }
    
    // Проверяем соединение через socket.connected, а не через state
    if (!socket.connected) {
      console.error('✗ Cannot join as storyteller: socket not connected');
      console.log('Socket connected state:', socket.connected);
      alert('Ошибка: Нет соединения с сервером. Проверьте, что сервер запущен.');
      return;
    }
    
    const sessionToJoin = id || '';
    console.log('=== Joining as storyteller ===');
    console.log('Session to join:', sessionToJoin);
    console.log('Socket ID:', socket.id);
    console.log('Socket connected:', socket.connected);
    console.log('Emitting join-as-storyteller event...');
    
    // Проверяем, что событие действительно отправляется
    console.log('About to emit join-as-storyteller event...');
    const eventSent = socket.emit('join-as-storyteller', sessionToJoin);
    console.log('Event emit completed. Result:', eventSent);
    console.log('Socket still connected:', socket.connected);
    
    // Подписываемся на ошибки
    socket.once('error', (error) => {
      console.error('✗ Socket error:', error);
    });
    
    // Проверяем все события от сервера
    socket.once('session-joined', (data) => {
      console.log('✓ Received session-joined in handler!', data);
    });
    
    // Дополнительная проверка через небольшую задержку
    setTimeout(() => {
      if (!gameState && !playerId) {
        console.warn('⚠️ No response received after 3 seconds');
        console.log('Current sessionId:', sessionId);
        console.log('Current playerId:', playerId);
        console.log('Current gameState:', gameState);
        console.log('Socket connected:', socket?.connected);
        console.log('Socket ID:', socket?.id);
      }
    }, 3000);
  };

  const handleUpdateCards = (cards) => {
    if (!socket) return;
    socket.emit('update-cards', { cards });
  };

  const handlePlayerReady = () => {
    if (!socket) return;
    socket.emit('player-ready');
  };

  if (!connected) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center">
          <div className="text-white text-xl mb-4">Подключение к серверу...</div>
          <div className="text-white/60 text-sm">
            Убедитесь, что сервер запущен на порту 3000
          </div>
          <div className="text-white/40 text-xs mt-2 font-mono">
            {`http://${window.location.hostname}:3000`}
          </div>
        </div>
      </div>
    );
  }

  // Показываем форму входа только если мы еще не присоединились
  if (!sessionId && !playerId) {
    return <SessionJoin onJoin={handleJoinSession} onJoinAsStoryteller={handleJoinAsStoryteller} />;
  }
  
  // Если есть sessionId или playerId, но gameState еще не загружен, показываем загрузку
  if ((sessionId || playerId) && !gameState) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="text-white text-xl mb-2">Загрузка сессии...</div>
          <div className="text-white/60 text-sm">
            {playerId === 'storyteller' ? 'Подключение как Рассказчик...' : 'Подключение к игре...'}
          </div>
        </div>
      </div>
    );
  }

  return (
    <GameSession
      socket={socket}
      sessionId={sessionId}
      playerId={playerId}
      gameState={gameState}
      onUpdateCards={handleUpdateCards}
      onPlayerReady={handlePlayerReady}
    />
  );
}

export default App;

