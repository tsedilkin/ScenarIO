import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { networkInterfaces } from 'os';
import { existsSync, readdirSync } from 'fs';

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

// Статическая раздача GIF файлов
const publicDir = join(__dirname, '..', 'public');
const gifsDir = join(publicDir, 'gifs');
app.use('/gifs', express.static(gifsDir));

// Кэш списка доступных локальных GIF файлов
let localGifsCache = null;

// Функция для получения списка локальных GIF файлов
function getLocalGifs() {
  if (localGifsCache !== null) {
    return localGifsCache;
  }
  
  try {
    if (!existsSync(gifsDir)) {
      localGifsCache = [];
      return [];
    }
    
    const files = readdirSync(gifsDir);
    // Фильтруем только .gif файлы и извлекаем номера
    const gifNumbers = files
      .filter(file => file.startsWith('poza-') && file.endsWith('.gif'))
      .map(file => {
        const match = file.match(/poza-(\d+)\.gif/);
        return match ? parseInt(match[1]) : null;
      })
      .filter(num => num !== null && num >= 1 && num <= 65);
    
    localGifsCache = gifNumbers;
    
    if (gifNumbers.length > 0) {
      console.log(`✓ Найдено ${gifNumbers.length} локальных GIF файлов`);
    }
    
    return gifNumbers;
  } catch (error) {
    console.error('Error reading local GIFs:', error);
    localGifsCache = [];
    return [];
  }
}

// Инициализируем кэш при старте сервера
getLocalGifs();

// Endpoint для получения GIF позы
app.post('/api/get-pose-gif', async (req, res) => {
  try {
    const localGifs = getLocalGifs();
    
    let gifUrl;
    
    // Если есть локальные GIF файлы, используем их
    if (localGifs.length > 0) {
      // Выбираем случайный номер из доступных локальных файлов
      const randomIndex = Math.floor(Math.random() * localGifs.length);
      const randomPose = localGifs[randomIndex];
      
      // Формируем URL для локального файла
      const host = req.headers.host || `localhost:${process.env.PORT || 3000}`;
      const protocol = req.protocol || (req.secure ? 'https' : 'http');
      gifUrl = `${protocol}://${host}/gifs/poza-${randomPose}.gif`;
    } else {
      // Если локальных файлов нет, используем внешний URL (старый способ)
      const randomPose = Math.floor(Math.random() * 65) + 1;
      gifUrl = `https://fanty-online.com/data/uploads/poza-${randomPose}.gif`;
    }
    
    res.json({ gifUrl });
  } catch (error) {
    console.error('Error generating GIF URL:', error);
    // Fallback - случайная поза с внешнего URL
    const randomPose = Math.floor(Math.random() * 65) + 1;
    res.json({ 
      gifUrl: `https://fanty-online.com/data/uploads/poza-${randomPose}.gif`,
      error: error.message,
      fallback: true
    });
  }
});

// Endpoint для генерации вариантов действий через Ollama
app.post('/api/generate-suggestions', async (req, res) => {
  try {
    const { context } = req.body;
    
    // Промпт для генерации эротических и интимных действий для пары
    // Формат: тип секса + место/положение
    // ОГРАНИЧЕНИЯ: только реальные места в квартире, только 2 человека, только реальные предметы
    const prompt = `Придумай одно задание для эротической игры для ДВУХ человек. Используй формат: тип секса + место/положение.

СТРОГИЕ ОГРАНИЧЕНИЯ:
- Только реальные места в обычной квартире: кровать, диван, стул, стол, пол, ванна, душ, туалет, балкон, окно, стена, кресло, кухня, спальня
- Только реальные предметы из обычного дома: подушка, полотенце, стул, стол, кровать, диван, кресло, ванна, душ, окно, стена
- НЕ используй: машину, фитбол, тачку, крендель, бабочку, лотос и другие необычные позы или предметы
- Всегда только 2 человека (партнеры)
- Используй разнообразные позы из камасутры простым языком: миссионерская (партнер сверху), наездница (партнер снизу, партнер сверху), сзади (на четвереньках), стоя, сидя, лёжа на боку (ложки), 69 (одновременно), с ногами на плечах, лицом к лицу, обратная наездница (партнер сверху спиной), на животе, на краю кровати, с поднятыми ногами, на коленях, в позе раком, с опорой на руки
- НЕ используй слово "Вагинальный" - просто "Секс" (и так понятно)
- Анальный секс используй редко (не более 10% примеров)
- Будь более детальным и развратным: добавляй описания интенсивности, скорости, глубины, использования рук, поцелуев, прикосновений
- Используй разнообразие: страстный, медленный, быстрый, глубокий, нежный, интенсивный, с доминированием, с подчинением
- Оральный секс используй часто (не более 20% примеров)

ПРИМЕРЫ (используй ТОЧНО такой же стиль, будь детальным и развратным):
- Секс страстный с глубокими проникновениями на кровати
- Секс сзади на четвереньках интенсивный на кровати
- Оральный секс медленный с использованием рук сидя на стуле
- Секс стоя у стены с поднятыми ногами
- Оральный секс лёжа в 69 страстный на кровати
- Секс сверху наездницей с контролем ритма на кровати
- Ручная стимуляция нежная с поцелуями на диване
- Секс в ложках на боку медленный на кровати
- Оральный секс стоя в ванной с доминированием
- Секс на кухонном столе быстрый и страстный
- Секс с игрушкой в ванне с одновременной стимуляцией
- Оральный секс на краю кровати глубокий
- Секс сидя на стуле лицом к лицу с поцелуями
- Ручная стимуляция с массажем на диване
- Оральный секс с завязанными глазами и прикосновениями на кровати
- Секс у окна стоя сзади страстный
- Секс с вибратором на стуле с контролем партнера
- Секс в миссионерской медленный с глубокими поцелуями на кровати
- Оральный секс в душе стоя с водой
- Секс сзади у стены интенсивный с поднятыми ногами
- Ручная стимуляция лёжа на животе с массажем на кровати
- Секс сверху обратной наездницей с контролем на кровати
- Оральный секс на балконе на коленях
- Секс на диване в позе раком страстный
- Секс с пробкой на диване с дополнительной стимуляцией
- Оральный секс с кубиком льда и горячими поцелуями на кровати
- Секс на полу на животе с доминированием
- Ручная стимуляция стоя в ванной с поцелуями
- Оральный секс на кухне на коленях
- Секс с ногами на плечах глубокий на кровати
- Секс с ремешком в спальне на кровати с подчинением
- Оральный секс с массажем всего тела на кровати
- Секс в кресле сидя с контролем партнера
- Ручная стимуляция в душе стоя с водой
- Секс обратный догги интенсивный на кровати
- Оральный секс сверху на кровати с использованием рук
- Секс на балконе стоя сзади страстный
- Секс с фаллоимитатором сидя на стуле с контролем
- Оральный секс медленный тантрический с дыханием на кровати
- Секс плоский на животе с глубокими проникновениями на кровати
- Ручная стимуляция с поцелуями и прикосновениями на диване
- Секс лицом к лицу медленный с глубокими поцелуями на кровати
- Оральный секс на краю ванны с массажем
- Секс с подушкой под бёдрами для глубокого проникновения на кровати
- Анальный секс в душе стоя сзади
- Анальный секс сзади на четвереньках медленный на кровати

Твоя задача: придумай ОДНО новое задание в таком же формате. Используй ТОЛЬКО реальные места в квартире и реальные предметы. Всегда только 2 человека.

Будь креативным, детальным и развратным! Добавляй описания интенсивности, скорости, глубины, использования рук, поцелуев, прикосновений, доминирования или подчинения. Используй разнообразие поз и действий. Делай задания более интересными и возбуждающими.

Только задание, одна строка, без объяснений.`;

    // Запрос к локальному Ollama API
    const ollamaUrl = process.env.OLLAMA_URL || 'http://localhost:11434/api/generate';
    // Dolphin-llama3:8b - модель, оптимизированная для эротического контента
    const model = process.env.OLLAMA_MODEL || 'dolphin-llama3:8b';
    
    const response = await fetch(ollamaUrl, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: model,
        prompt: prompt,
        stream: false,
        options: {
          temperature: 1.1, // Увеличиваем для более разнообразных и креативных ответов
          top_p: 0.95,
          top_k: 40,
          repeat_penalty: 1.1,
          num_predict: 100, // Немного длиннее для детальных описаний
        }
      }),
    });

    if (!response.ok) {
      throw new Error(`Ollama API error: ${response.statusText}`);
    }

    const data = await response.json();
    let generatedText = data.response || '';
    
    // Если модель отказалась, пробуем еще раз с другим промптом
    if (generatedText.toLowerCase().includes('не могу') || 
        generatedText.toLowerCase().includes('cannot') ||
        generatedText.toLowerCase().includes('i cannot') ||
        generatedText.toLowerCase().includes('i\'m sorry') ||
        generatedText.toLowerCase().includes('извините')) {
      console.log('Model refused, trying alternative prompt...');
      
      // Альтернативный промпт - формат: тип секса + место/положение (только реальные места)
      const altPrompt = `Примеры заданий для ДВУХ человек (формат: тип секса + место/положение):
Только реальные места в квартире: кровать, диван, стул, стол, пол, ванна, душ, балкон, окно, стена, кресло.
Используй разнообразные позы: миссионерская, наездница, сзади, стоя, сидя, лёжа на боку, 69, с ногами на плечах.
НЕ используй слово "Вагинальный" - просто "Секс".
Будь детальным и развратным: добавляй описания интенсивности, скорости, использования рук, поцелуев.

- Секс страстный с глубокими проникновениями на кровати
- Секс сзади на четвереньках интенсивный на кровати
- Оральный секс медленный с использованием рук сидя на стуле
- Секс стоя у стены с поднятыми ногами
- Оральный секс лёжа в 69 страстный на кровати
- Секс сверху наездницей с контролем ритма на кровати
- Ручная стимуляция нежная с поцелуями на диване
- Секс с игрушкой в ванне с одновременной стимуляцией

Придумай одно задание в таком же формате, используя только реальные места в квартире. Будь креативным и развратным:`;
      
      const altResponse = await fetch(ollamaUrl, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: model,
          prompt: altPrompt,
          stream: false,
          options: {
            temperature: 1.5,
            top_p: 0.95,
          }
        }),
      });
      
      if (altResponse.ok) {
        const altData = await altResponse.json();
        generatedText = altData.response || '';
      }
    }
    
    // Парсим текст - берем первую строку как одно действие
    let suggestion = generatedText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && !line.match(/^\d+[\.\)]/)) // Убираем нумерацию
      .find(line => line.length > 0) || ''; // Берем первую непустую строку
    
    // Убираем кавычки и лишние символы
    suggestion = suggestion.replace(/^["']|["']$/g, '').trim();
    
    // Добавляем эмодзи лампочки в начало, если текст сгенерирован ИИ
    if (suggestion && !suggestion.startsWith('💡')) {
      suggestion = '💡 ' + suggestion;
    }
    
    // Фильтрация насилия, опасности и страп-она
    const filteredSuggestion = suggestion.toLowerCase();
    const forbidden = ['насилие', 'убийство', 'кровь', 'убить', 'убивать', 'избить', 'избивать', 'несовершеннолетн', 'страп', 'страпон'];
    const hasForbidden = forbidden.some(word => filteredSuggestion.includes(word));
    
    // Если модель все равно отказалась или пустой ответ - используем варианты в формате: тип секса + место/положение
    // ТОЛЬКО реальные места в квартире и реальные предметы
    // Более детальные и развратные варианты (с эмодзи лампочки)
    const fallbackSuggestions = [
      '💡 Секс страстный с глубокими проникновениями на кровати',
      '💡 Секс сзади на четвереньках интенсивный на кровати',
      '💡 Оральный секс медленный с использованием рук сидя на стуле',
      '💡 Секс стоя у стены с поднятыми ногами',
      '💡 Оральный секс лёжа в 69 страстный на кровати',
      '💡 Секс сверху наездницей с контролем ритма на кровати',
      '💡 Ручная стимуляция нежная с поцелуями на диване',
      '💡 Секс в ложках на боку медленный на кровати',
      '💡 Оральный секс стоя в ванной с доминированием',
      '💡 Секс на кухонном столе быстрый и страстный',
      '💡 Секс с игрушкой в ванне с одновременной стимуляцией',
      '💡 Оральный секс на краю кровати глубокий',
      '💡 Секс сидя на стуле лицом к лицу с поцелуями',
      '💡 Ручная стимуляция с массажем на диване',
      '💡 Оральный секс с завязанными глазами и прикосновениями на кровати',
      '💡 Секс у окна стоя сзади страстный',
      '💡 Секс с вибратором на стуле с контролем партнера',
      '💡 Секс в миссионерской медленный с глубокими поцелуями на кровати',
      '💡 Оральный секс в душе стоя с водой',
      '💡 Секс сзади у стены интенсивный с поднятыми ногами',
      '💡 Ручная стимуляция лёжа на животе с массажем на кровати',
      '💡 Секс сверху обратной наездницей с контролем на кровати',
      '💡 Оральный секс на балконе на коленях',
      '💡 Секс на диване в позе раком страстный',
      '💡 Секс с пробкой на диване с дополнительной стимуляцией',
      '💡 Оральный секс с кубиком льда и горячими поцелуями на кровати',
      '💡 Секс на полу на животе с доминированием',
      '💡 Ручная стимуляция стоя в ванной с поцелуями',
      '💡 Оральный секс на кухне на коленях',
      '💡 Секс с ногами на плечах глубокий на кровати',
      '💡 Секс с ремешком в спальне на кровати с подчинением',
      '💡 Оральный секс с массажем всего тела на кровати',
      '💡 Секс в кресле сидя с контролем партнера',
      '💡 Ручная стимуляция в душе стоя с водой',
      '💡 Секс обратный догги интенсивный на кровати',
      '💡 Оральный секс сверху на кровати с использованием рук',
      '💡 Секс на балконе стоя сзади страстный',
      '💡 Секс с фаллоимитатором сидя на стуле с контролем',
      '💡 Оральный секс медленный тантрический с дыханием на кровати',
      '💡 Секс плоский на животе с глубокими проникновениями на кровати',
      '💡 Ручная стимуляция с поцелуями и прикосновениями на диване',
      '💡 Секс лицом к лицу медленный с глубокими поцелуями на кровати',
      '💡 Оральный секс на краю ванны с массажем',
      '💡 Секс с подушкой под бёдрами для глубокого проникновения на кровати',
      '💡 Анальный секс в душе стоя сзади',
      '💡 Анальный секс сзади на четвереньках медленный на кровати'
    ];
    
    let finalSuggestion = suggestion;
    if (hasForbidden || !suggestion || suggestion.length < 5) {
      // Выбираем случайный fallback
      finalSuggestion = fallbackSuggestions[Math.floor(Math.random() * fallbackSuggestions.length)];
    }

    res.json({ suggestion: finalSuggestion });
  } catch (error) {
    console.error('Error generating suggestions:', error);
    // Если Ollama недоступен, возвращаем заготовленный вариант
    const fallbackSuggestion = 'Страстный поцелуй в течение минуты';
    res.json({ 
      suggestion: fallbackSuggestion,
      error: error.message,
      fallback: true
    });
  }
});

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
        normalized = { text: card, isEmpty: !card.trim(), gifUrl: null };
      } else if (card && typeof card === 'object') {
        // Если это объект, убеждаемся что есть поле text и gifUrl
        normalized = {
          text: card?.text || '',
          isEmpty: !card?.text || !card.text.trim(),
          gifUrl: card?.gifUrl || null
        };
      } else {
        normalized = { text: '', isEmpty: true, gifUrl: null };
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
      card1 = { text: '', isEmpty: true, gifUrl: null };
      console.log('  Card1: empty (not found)');
    } else if (typeof card1 === 'string') {
      card1 = { text: card1, isEmpty: !card1.trim(), gifUrl: null };
      console.log('  Card1: string ->', card1);
    } else if (card1 && typeof card1 === 'object') {
      // Убеждаемся, что есть поле text и сохраняем gifUrl
      const text = card1.text || '';
      card1 = { 
        text: text, 
        isEmpty: !text.trim() && !card1.gifUrl, 
        gifUrl: card1.gifUrl || null 
      };
      console.log('  Card1: object ->', card1);
    } else {
      card1 = { text: '', isEmpty: true, gifUrl: null };
      console.log('  Card1: empty (unknown type)');
    }
    
    // Нормализуем карточку игрока 2
    if (!card2) {
      card2 = { text: '', isEmpty: true, gifUrl: null };
      console.log('  Card2: empty (not found)');
    } else if (typeof card2 === 'string') {
      card2 = { text: card2, isEmpty: !card2.trim(), gifUrl: null };
      console.log('  Card2: string ->', card2);
    } else if (card2 && typeof card2 === 'object') {
      // Убеждаемся, что есть поле text и сохраняем gifUrl
      const text = card2.text || '';
      card2 = { 
        text: text, 
        isEmpty: !text.trim() && !card2.gifUrl, 
        gifUrl: card2.gifUrl || null 
      };
      console.log('  Card2: object ->', card2);
    } else {
      card2 = { text: '', isEmpty: true, gifUrl: null };
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
      player1GifUrl: pair.player1Card.gifUrl,
      player2Text: pair.player2Card.text,
      player2GifUrl: pair.player2Card.gifUrl,
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

