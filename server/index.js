import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { networkInterfaces } from 'os';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

app.use(cors());
app.use(express.json());

// Хранилище игровых сессий
const gameSessions = new Map();

// Генерируем уникальный ID сессии
function generateSessionId() {
  return Math.random().toString(36).substring(2, 9);
}

// Создаем новую игровую сессию
function createGameSession() {
  const sessionId = generateSessionId();
  console.log('Creating new game session with ID:', sessionId);
  const session = {
    id: sessionId,
    players: [],
    cards: {
      player1: [],
      player2: []
    },
    maxCards: 0,
    ready: {
      player1: false,
      player2: false
    },
    revealed: false,
    randomized: false
  };
  gameSessions.set(sessionId, session);
  console.log('Session created. Total sessions:', gameSessions.size);
  return sessionId;
}

// Получаем сессию (не создаем новую)
function getSession(sessionId) {
  if (!sessionId || !gameSessions.has(sessionId)) {
    return null;
  }
  return sessionId;
}

// Создаем новую сессию (только для рассказчика)
function createOrGetSession(sessionId) {
  if (!sessionId || !gameSessions.has(sessionId)) {
    return createGameSession();
  }
  return sessionId;
}

io.on('connection', (socket) => {
  console.log('\n=== New client connected ===');
  console.log('Socket ID:', socket.id);
  console.log('Total connections:', io.sockets.sockets.size);
  
  // Логируем все входящие события для отладки
  const originalOnevent = socket.onevent;
  socket.onevent = function (packet) {
    const args = packet.data || [];
    const eventName = args[0];
    console.log('📥 Incoming event:', eventName, 'from socket:', socket.id);
    if (eventName === 'join-as-storyteller') {
      console.log('  → Event args:', args.slice(1));
    }
    const result = originalOnevent.call(this, packet);
    console.log('  → Event processed, result:', result);
    return result;
  };
  
  console.log('✓ Event interceptor installed, registering handlers...');

  socket.on('join-session', (sessionId) => {
    console.log('=== Join session request ===');
    console.log('SessionId from client:', sessionId);
    
    // Игроки могут только присоединяться к существующей сессии
    if (!sessionId || !sessionId.trim()) {
      console.log('✗ No session ID provided');
      socket.emit('session-error', {
        error: 'ID сессии обязателен. Получите ID от Рассказчика.'
      });
      return;
    }
    
    const actualSessionId = getSession(sessionId.trim());
    
    if (!actualSessionId) {
      console.log('✗ Session not found:', sessionId);
      socket.emit('session-error', {
        error: 'Сессия не найдена. Проверьте ID сессии или попросите Рассказчика создать новую сессию.'
      });
      return;
    }
    
    const session = gameSessions.get(actualSessionId);
    
    // Проверяем, не является ли это рассказчиком
    const isStoryteller = session.players.some(p => p.playerId === 'storyteller');
    if (!isStoryteller) {
      console.log('✗ Session has no storyteller');
      socket.emit('session-error', {
        error: 'Сессия не активна. Рассказчик должен сначала создать сессию.'
      });
      return;
    }
    
    // Подсчитываем только игроков (не рассказчика)
    const playerCount = session.players.filter(p => p.playerId === 'player1' || p.playerId === 'player2').length;
    
    // Определяем, какой игрок присоединился
    let playerId = null;
    if (playerCount === 0) {
      playerId = 'player1';
      session.players.push({ id: socket.id, playerId: 'player1' });
    } else if (playerCount === 1) {
      playerId = 'player2';
      session.players.push({ id: socket.id, playerId: 'player2' });
    } else {
      // Если уже 2 игрока, присоединяемся как наблюдатель
      playerId = 'observer';
      session.players.push({ id: socket.id, playerId: 'observer' });
    }

    socket.join(actualSessionId);
    socket.sessionId = actualSessionId;
    socket.playerId = playerId;

    console.log('✓ Player joined:', playerId);

    // Отправляем текущее состояние сессии
    socket.emit('session-joined', {
      sessionId: actualSessionId,
      playerId: playerId,
      gameState: session
    });

    // Уведомляем всех о новом игроке
    io.to(actualSessionId).emit('player-joined', {
      playerId: playerId,
      gameState: session
    });
  });

  // Регистрируем обработчик для рассказчика СРАЗУ после подключения
  console.log('📝 Registering join-as-storyteller handler for socket:', socket.id);
  
  socket.on('join-as-storyteller', (sessionId, callback) => {
    console.log('\n🎭 === Join as storyteller handler called ===');
    console.log('SessionId from client:', sessionId);
    console.log('Socket ID:', socket.id);
    console.log('Socket connected:', socket.connected);
    console.log('Callback provided:', typeof callback === 'function');
    
    try {
      // Рассказчик может создать новую сессию или присоединиться к существующей
      console.log('Creating or getting session...');
      const actualSessionId = createOrGetSession(sessionId);
      console.log('Actual session ID:', actualSessionId);
      
      const session = gameSessions.get(actualSessionId);
      console.log('Session found:', !!session);
      if (session) {
        console.log('Session players:', session.players.length);
      }
      
      console.log('Storyteller joining session:', actualSessionId);
      console.log('Session exists:', !!session);
      
      // Рассказчик всегда получает роль 'storyteller'
      const playerId = 'storyteller';
      
      // Проверяем, не присоединился ли уже этот рассказчик
      const existingPlayer = session.players.find(p => p.id === socket.id);
      if (!existingPlayer) {
        session.players.push({ id: socket.id, playerId: 'storyteller' });
        console.log('✓ Added storyteller to session players');
      } else {
        console.log('⚠ Storyteller already in session');
      }

      console.log('Joining socket to room:', actualSessionId);
      socket.join(actualSessionId);
      socket.sessionId = actualSessionId;
      socket.playerId = playerId;
      console.log('✓ Socket joined room and properties set');

      const responseData = {
        sessionId: actualSessionId,
        playerId: playerId,
        gameState: {
          ...session,
          // Убеждаемся, что отправляем полный объект
          id: session.id,
          players: session.players,
          cards: session.cards,
          maxCards: session.maxCards,
          ready: session.ready,
          revealed: session.revealed,
          randomized: session.randomized
        }
      };
      
      console.log('Response data structure:');
      console.log('- sessionId:', responseData.sessionId);
      console.log('- playerId:', responseData.playerId);
      console.log('- gameState.id:', responseData.gameState?.id);
      console.log('- gameState.players:', responseData.gameState?.players?.length);

      // Отправляем текущее состояние сессии
      console.log('\n📤 Emitting session-joined event to socket:', socket.id);
      console.log('Socket connected before emit:', socket.connected);
      console.log('Socket in room:', socket.rooms.has(actualSessionId));
      
      socket.emit('session-joined', responseData);
      console.log('✓ session-joined event emitted to socket:', socket.id);

      // Если есть callback, вызываем его
      if (typeof callback === 'function') {
        console.log('Calling callback with success');
        callback({ success: true, sessionId: actualSessionId });
      }

      // Уведомляем всех о новом рассказчике
      console.log('Broadcasting player-joined to room:', actualSessionId);
      io.to(actualSessionId).emit('player-joined', {
        playerId: playerId,
        gameState: session
      });
      
      console.log('✅ All events sent successfully for storyteller');
    } catch (error) {
      console.error('Error in join-as-storyteller:', error);
      if (typeof callback === 'function') {
        callback({ success: false, error: error.message });
      }
    }
  });

  socket.on('update-cards', ({ cards }) => {
    if (!socket.sessionId || !socket.playerId) {
      console.log('✗ update-cards: missing sessionId or playerId');
      return;
    }
    
    // Рассказчик не может обновлять карточки
    if (socket.playerId === 'storyteller' || socket.playerId === 'observer') {
      console.log('✗ update-cards: storyteller/observer cannot update cards');
      return;
    }
    
    const session = gameSessions.get(socket.sessionId);
    if (!session) {
      console.log('✗ update-cards: session not found');
      return;
    }

    console.log(`\n📝 Updating cards for ${socket.playerId}`);
    console.log('Received cards:', JSON.stringify(cards, null, 2));

    // Нормализуем карточки - убеждаемся, что все карточки имеют правильный формат
    const normalizedCards = cards.map((card, index) => {
      let normalized;
      if (typeof card === 'string') {
        normalized = { text: card, isEmpty: !card.trim() };
      } else if (card && typeof card === 'object') {
        // Если это объект, убеждаемся что есть поле text
        normalized = {
          text: card?.text || '',
          isEmpty: !card?.text || !card.text.trim()
        };
      } else {
        normalized = { text: '', isEmpty: true };
      }
      console.log(`  Card ${index}:`, normalized);
      return normalized;
    });

    // Обновляем карточки игрока
    session.cards[socket.playerId] = normalizedCards;
    
    // Обновляем максимальное количество карточек
    const maxCards = Math.max(
      session.cards.player1.length,
      session.cards.player2.length
    );
    session.maxCards = maxCards;

    console.log(`✓ Cards updated for ${socket.playerId}, total: ${normalizedCards.length}`);
    console.log('Session maxCards:', maxCards);
    console.log('Session cards state:', {
      player1: session.cards.player1.length,
      player2: session.cards.player2.length
    });

    // Синхронизируем состояние со всеми клиентами
    io.to(socket.sessionId).emit('cards-updated', {
      gameState: session
    });
  });

  socket.on('player-ready', () => {
    if (!socket.sessionId || !socket.playerId) return;
    
    // Рассказчик не может быть готовым
    if (socket.playerId === 'storyteller' || socket.playerId === 'observer') return;
    
    const session = gameSessions.get(socket.sessionId);
    if (!session) return;

    session.ready[socket.playerId] = true;

    // Проверяем, готовы ли оба игрока
    const bothReady = session.ready.player1 && session.ready.player2;
    
    if (bothReady && !session.revealed) {
      session.revealed = true;
      
      // Запускаем рандомизацию
      setTimeout(() => {
        randomizeCards(session);
        io.to(socket.sessionId).emit('cards-revealed', {
          gameState: session
        });
      }, 1000);
    } else {
      io.to(socket.sessionId).emit('player-ready-updated', {
        gameState: session
      });
    }
  });

  // Регистрируем все обработчики перед disconnect
  console.log('✓ All event handlers registered for socket:', socket.id);
  
  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
    
    if (socket.sessionId) {
      const session = gameSessions.get(socket.sessionId);
      if (session) {
        // Удаляем игрока из сессии
        session.players = session.players.filter(p => p.id !== socket.id);
        
        // Если сессия пустая, удаляем её
        if (session.players.length === 0) {
          gameSessions.delete(socket.sessionId);
        } else {
          io.to(socket.sessionId).emit('player-left', {
            gameState: session
          });
        }
      }
    }
  });
});

// Функция рандомизации карточек
function randomizeCards(session) {
  const pairs = [];
  const maxCards = session.maxCards;
  
  console.log('\n🎲 === Randomizing cards ===');
  console.log('Max cards:', maxCards);
  console.log('Player1 cards count:', session.cards.player1?.length || 0);
  console.log('Player2 cards count:', session.cards.player2?.length || 0);
  console.log('Player1 cards raw:', JSON.stringify(session.cards.player1, null, 2));
  console.log('Player2 cards raw:', JSON.stringify(session.cards.player2, null, 2));
  
  for (let i = 0; i < maxCards; i++) {
    // Получаем карточки, обрабатывая разные форматы данных
    let card1 = session.cards.player1?.[i];
    let card2 = session.cards.player2?.[i];
    
    console.log(`\nProcessing pair ${i}:`);
    console.log('  Card1 raw:', card1);
    console.log('  Card2 raw:', card2);
    
    // Нормализуем карточку игрока 1
    if (!card1) {
      card1 = { text: '', isEmpty: true };
      console.log('  Card1: empty (not found)');
    } else if (typeof card1 === 'string') {
      card1 = { text: card1, isEmpty: !card1.trim() };
      console.log('  Card1: string ->', card1);
    } else if (card1 && typeof card1 === 'object') {
      // Убеждаемся, что есть поле text
      const text = card1.text || '';
      card1 = { text: text, isEmpty: !text.trim() };
      console.log('  Card1: object ->', card1);
    } else {
      card1 = { text: '', isEmpty: true };
      console.log('  Card1: empty (unknown type)');
    }
    
    // Нормализуем карточку игрока 2
    if (!card2) {
      card2 = { text: '', isEmpty: true };
      console.log('  Card2: empty (not found)');
    } else if (typeof card2 === 'string') {
      card2 = { text: card2, isEmpty: !card2.trim() };
      console.log('  Card2: string ->', card2);
    } else if (card2 && typeof card2 === 'object') {
      // Убеждаемся, что есть поле text
      const text = card2.text || '';
      card2 = { text: text, isEmpty: !text.trim() };
      console.log('  Card2: object ->', card2);
    } else {
      card2 = { text: '', isEmpty: true };
      console.log('  Card2: empty (unknown type)');
    }
    
    // Рандомно выбираем, какая карточка выиграла
    const winner = Math.random() < 0.5 ? 'player1' : 'player2';
    
    const pair = {
      index: i,
      player1Card: card1,
      player2Card: card2,
      winner: winner
    };
    
    pairs.push(pair);
    console.log(`  Pair ${i} created:`, {
      player1Text: pair.player1Card.text,
      player2Text: pair.player2Card.text,
      winner: pair.winner
    });
  }
  
  console.log('\n✅ Generated pairs:', JSON.stringify(pairs, null, 2));
  
  session.pairs = pairs;
  session.randomized = true;
  
  console.log('✓ Randomization complete. Pairs count:', pairs.length);
}

// Статическая раздача для production build
app.use(express.static(join(__dirname, '../client/dist')));

app.get('*', (req, res) => {
  res.sendFile(join(__dirname, '../client/dist/index.html'));
});

const PORT = process.env.PORT || 3000;
const HOST = '0.0.0.0'; // Слушаем на всех интерфейсах для доступа в локальной сети

httpServer.listen(PORT, HOST, () => {
  const addresses = [];
  const interfaces = networkInterfaces();
  
  for (const name of Object.keys(interfaces)) {
    for (const iface of interfaces[name]) {
      if (iface.family === 'IPv4' && !iface.internal) {
        addresses.push(iface.address);
      }
    }
  }
  
  console.log(`\n🚀 Server running on:`);
  console.log(`   Local:   http://localhost:${PORT}`);
  if (addresses.length > 0) {
    addresses.forEach(addr => {
      console.log(`   Network: http://${addr}:${PORT}`);
    });
  }
  console.log(`\n📱 Open this URL on your devices in the same WiFi network\n`);
});

