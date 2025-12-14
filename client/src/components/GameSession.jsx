import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CardInput from './CardInput';
import RevealedCards from './RevealedCards';
import StorytellerView from './StorytellerView';

function GameSession({ socket, sessionId, playerId, gameState, onUpdateCards, onPlayerReady }) {
  const [localCards, setLocalCards] = useState([]);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (gameState && playerId && (playerId === 'player1' || playerId === 'player2')) {
      const currentCards = gameState.cards[playerId] || [];
      const maxCards = gameState.maxCards || 0;
      
      // Нормализуем карточки - убеждаемся, что все карточки имеют правильный формат
      const normalizedCards = currentCards.map(card => {
        if (typeof card === 'string') {
          return { text: card, isEmpty: !card.trim(), gifUrl: null };
        }
        return card || { text: '', isEmpty: true, gifUrl: null };
      });
      
      // Синхронизируем количество карточек с максимальным
      if (normalizedCards.length < maxCards) {
        const newCards = [...normalizedCards];
        while (newCards.length < maxCards) {
          newCards.push({ text: '', isEmpty: true, gifUrl: null });
        }
        setLocalCards(newCards);
        // Отправляем обновление только если карточки изменились
        if (JSON.stringify(newCards) !== JSON.stringify(currentCards)) {
          onUpdateCards(newCards);
        }
      } else if (normalizedCards.length > maxCards) {
        // Если у нас больше карточек, чем максимум, обрезаем
        const trimmedCards = normalizedCards.slice(0, maxCards);
        setLocalCards(trimmedCards);
        onUpdateCards(trimmedCards);
      } else {
        setLocalCards(normalizedCards);
      }
    }
  }, [gameState, playerId, onUpdateCards]);

  const handleCardChange = (index, text) => {
    const newCards = [...localCards];
    // Нормализуем текст - убираем undefined/null, но сохраняем пустую строку как есть
    const normalizedText = text !== undefined && text !== null ? text : '';
    
    // isEmpty = true только если нет текста И нет GIF
    const currentCard = newCards[index] || {};
    const isEmpty = !normalizedText.trim() && !currentCard.gifUrl;
    newCards[index] = { ...currentCard, text: normalizedText, isEmpty };
    setLocalCards(newCards);
    onUpdateCards(newCards);
  };

  const handleGifChange = (index, gifUrl) => {
    const newCards = [...localCards];
    const currentCard = newCards[index] || {};
    // Обновляем gifUrl (может быть null для очистки)
    const updatedCard = { ...currentCard, gifUrl: gifUrl || null };
    // Обновляем isEmpty - карточка пустая только если нет текста И нет GIF
    updatedCard.isEmpty = !updatedCard.text?.trim() && !updatedCard.gifUrl;
    newCards[index] = updatedCard;
    setLocalCards(newCards);
    onUpdateCards(newCards);
  };

  const handleAddCard = () => {
    const newCards = [...localCards, { text: '', isEmpty: true, gifUrl: null }];
    setLocalCards(newCards);
    onUpdateCards(newCards);
  };

  const handleRemoveCard = (index) => {
    const newCards = localCards.filter((_, i) => i !== index);
    setLocalCards(newCards);
    onUpdateCards(newCards);
  };

  const isReady = gameState?.ready[playerId] || false;
  const bothReady = gameState?.ready?.player1 && gameState?.ready?.player2;
  const isRevealed = gameState?.revealed || false;
  const isObserver = playerId === 'observer';
  const isStoryteller = playerId === 'storyteller';

  // Если это рассказчик, показываем специальный вид
  if (isStoryteller) {
    return <StorytellerView gameState={gameState} sessionId={sessionId} />;
  }

  // Если карточки открыты, показываем финальный экран
  if (isRevealed && gameState?.pairs) {
    return (
      <RevealedCards
        gameState={gameState}
        playerId={playerId}
        isMobile={isMobile}
      />
    );
  }

  // Если это наблюдатель или оба игрока готовы, показываем ожидание
  if (isObserver || (bothReady && !isRevealed)) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-center"
        >
          <div className="text-white text-2xl mb-4">
            {bothReady ? 'Открываем карточки...' : 'Ожидание игроков...'}
          </div>
          <div className="flex justify-center gap-2">
            <div className={`w-3 h-3 rounded-full ${gameState?.ready?.player1 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
            <div className={`w-3 h-3 rounded-full ${gameState?.ready?.player2 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
          </div>
        </motion.div>
      </div>
    );
  }

  // Основной интерфейс для заполнения карточек
  return (
    <div className="min-h-screen p-4 pb-20">
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6"
        >
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-2">
            ScenarIO
          </h1>
          <p className="text-white/70">
            Сессия: <span className="font-mono text-primary-400">{sessionId}</span>
          </p>
          <p className="text-white/70 text-sm mt-1">
            Вы: <span className="font-semibold text-primary-300">
              {playerId === 'player1' ? 'Игрок 1' : 'Игрок 2'}
            </span>
          </p>
        </motion.div>

        {/* Статус игроков */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-4 mb-6 border border-white/20"
        >
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${gameState?.ready?.player1 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-white">Игрок 1 {gameState?.ready?.player1 ? '✓' : ''}</span>
            </div>
            <div className="flex items-center gap-3">
              <div className={`w-3 h-3 rounded-full ${gameState?.ready?.player2 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
              <span className="text-white">Игрок 2 {gameState?.ready?.player2 ? '✓' : ''}</span>
            </div>
          </div>
        </motion.div>

        {/* Карточки */}
        <div className="space-y-4 mb-6">
          <AnimatePresence>
            {localCards.map((card, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9 }}
                transition={{ delay: index * 0.1 }}
              >
                <CardInput
                  index={index}
                  value={card.text}
                  onChange={(text) => handleCardChange(index, text)}
                  onRemove={localCards.length > 1 ? () => handleRemoveCard(index) : null}
                  gifUrl={card.gifUrl}
                  onGifChange={(gifUrl) => handleGifChange(index, gifUrl)}
                />
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Кнопки действий */}
        <div className="flex flex-col sm:flex-row gap-4">
          <button
            onClick={handleAddCard}
            className="flex-1 bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 shadow-lg"
          >
            + Добавить карточку
          </button>
          <button
            onClick={onPlayerReady}
            disabled={isReady || localCards.some(c => !c.text.trim() && !c.gifUrl)}
            className={`flex-1 font-semibold py-4 px-6 rounded-lg transition-all duration-200 shadow-lg ${
              isReady
                ? 'bg-green-600 text-white cursor-not-allowed'
                : localCards.some(c => !c.text.trim() && !c.gifUrl)
                ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                : 'bg-green-600 hover:bg-green-700 text-white'
            }`}
          >
            {isReady ? '✓ Готово!' : 'Готов'}
          </button>
        </div>

        {/* Подсказка */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="mt-6 p-4 bg-blue-500/20 rounded-lg border border-blue-400/30"
        >
          <p className="text-white/90 text-sm text-center">
            💡 Заполните все карточки и нажмите "Готов". Когда оба игрока будут готовы, карточки откроются!
          </p>
        </motion.div>
      </div>
    </div>
  );
}

export default GameSession;

