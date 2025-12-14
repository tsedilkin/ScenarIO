import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import QRCodeDisplay from './QRCodeDisplay';

function RevealedCards({ gameState, playerId, isMobile }) {
  const [flipped, setFlipped] = useState(false);
  const [showResults, setShowResults] = useState(false);

  useEffect(() => {
    // Анимация переворота карточек
    const timer = setTimeout(() => {
      console.log('Setting flipped to true');
      setFlipped(true);
    }, 500);

    // Показываем результаты после переворота
    const resultsTimer = setTimeout(() => {
      console.log('Setting showResults to true');
      setShowResults(true);
    }, 2000);

    return () => {
      clearTimeout(timer);
      clearTimeout(resultsTimer);
    };
  }, []);

  if (!gameState?.pairs) {
    return null;
  }

  const pairs = gameState.pairs;
  
  // Отладка: выводим данные в консоль
  console.log('\n🎴 RevealedCards - gameState:', gameState);
  console.log('🎴 RevealedCards - pairs:', pairs);
  pairs.forEach((pair, index) => {
    console.log(`Pair ${index}:`, {
      player1Card: pair.player1Card,
      player1Text: pair.player1Card?.text,
      player2Card: pair.player2Card,
      player2Text: pair.player2Card?.text,
      winner: pair.winner
    });
  });

  return (
    <div className="min-h-screen p-4">
      <QRCodeDisplay sessionId={gameState.id} />
      <div className="max-w-7xl 2xl:max-w-[90rem] 4xl:max-w-[120rem] mx-auto">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-6 4xl:mb-8"
        >
          <h1 className="text-3xl md:text-5xl 4xl:text-6xl font-bold text-white mb-2">
            Результаты
          </h1>
          <p className="text-white/70 text-sm md:text-base 4xl:text-lg">
            Сессия: <span className="font-mono text-primary-400">{gameState.id}</span>
          </p>
        </motion.div>

        {/* Таблица карточек - строго вертикальный список */}
        <div className="space-y-4 md:space-y-6 4xl:space-y-8">
          <AnimatePresence>
            {pairs.map((pair, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white/10 backdrop-blur-lg rounded-xl p-4 md:p-6 4xl:p-8 border border-white/20 shadow-xl"
              >
                <div className="text-center mb-3 4xl:mb-4">
                  <span className="text-white/70 text-sm md:text-base 4xl:text-lg font-semibold">
                    Пара #{index + 1}
                  </span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 md:gap-4 4xl:gap-6">
                  {/* Карточка игрока 1 */}
                  <motion.div
                    className={`relative h-40 md:h-48 4xl:h-64 rounded-lg overflow-hidden ${
                      showResults && pair.winner === 'player1'
                        ? 'ring-4 ring-green-500 pulse-glow'
                        : 'ring-2 ring-white/20'
                    }`}
                    style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                  >
                    <motion.div
                      className="absolute inset-0 w-full h-full"
                      initial={{ rotateY: 0 }}
                      animate={{ rotateY: flipped ? 180 : 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Обратная сторона с текстом */}
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-blue-600 to-blue-800 flex items-center justify-center p-4 overflow-auto"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        <motion.div 
                          className="text-center w-full" 
                          style={{ transform: 'rotateY(180deg)' }}
                          initial={{ rotateY: 180 }}
                          animate={{ rotateY: flipped ? 1080 : 180 }}
                          transition={{ duration: 0.6, delay: index * 0.1 }}
                        >
                          <div className="text-white/70 text-xs md:text-sm 4xl:text-base mb-2">Игрок 1</div>
                          <div className="text-white text-base md:text-lg 4xl:text-2xl font-semibold break-words px-2">
                            {(() => {
                              const card = pair.player1Card;
                              let cardText = '';
                              
                              if (card) {
                                if (typeof card === 'string') {
                                  cardText = card;
                                } else if (card.text !== undefined) {
                                  cardText = String(card.text || '');
                                }
                              }
                              
                              const result = cardText.trim() || '(пусто)';
                              console.log('Player1 card text:', result, 'from card:', card);
                              return result;
                            })()}
                          </div>
                        </motion.div>
                      </div>
                      {/* Лицевая сторона с вопросом */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden'
                        }}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: flipped ? 0 : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="text-white/50 text-4xl">?</div>
                      </motion.div>
                    </motion.div>
                  </motion.div>

                  {/* Карточка игрока 2 */}
                  <motion.div
                    className={`relative h-40 md:h-48 4xl:h-64 rounded-lg overflow-hidden ${
                      showResults && pair.winner === 'player2'
                        ? 'ring-4 ring-green-500 pulse-glow'
                        : 'ring-2 ring-white/20'
                    }`}
                    style={{ transformStyle: 'preserve-3d', perspective: '1000px' }}
                  >
                    <motion.div
                      className="absolute inset-0 w-full h-full"
                      initial={{ rotateY: 0 }}
                      animate={{ rotateY: flipped ? 180 : 0 }}
                      transition={{ duration: 0.6, delay: index * 0.1 + 0.1 }}
                      style={{ transformStyle: 'preserve-3d' }}
                    >
                      {/* Обратная сторона с текстом */}
                      <div
                        className="absolute inset-0 bg-gradient-to-br from-purple-600 to-purple-800 flex items-center justify-center p-4 overflow-auto"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden',
                          transform: 'rotateY(180deg)'
                        }}
                      >
                        <motion.div 
                          className="text-center w-full" 
                          style={{ transform: 'rotateY(180deg)' }}
                          initial={{ rotateY: 180 }}
                          animate={{ rotateY: flipped ? 1080 : 180 }}
                          transition={{ duration: 0.6, delay: index * 0.1 + 0.1 }}
                        >
                          <div className="text-white/70 text-xs md:text-sm 4xl:text-base mb-2">Игрок 2</div>
                          <div className="text-white text-base md:text-lg 4xl:text-2xl font-semibold break-words px-2">
                            {(() => {
                              const card = pair.player2Card;
                              let cardText = '';
                              
                              if (card) {
                                if (typeof card === 'string') {
                                  cardText = card;
                                } else if (card.text !== undefined) {
                                  cardText = String(card.text || '');
                                }
                              }
                              
                              const result = cardText.trim() || '(пусто)';
                              console.log('Player2 card text:', result, 'from card:', card);
                              return result;
                            })()}
                          </div>
                        </motion.div>
                      </div>
                      {/* Лицевая сторона с вопросом */}
                      <motion.div
                        className="absolute inset-0 bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center"
                        style={{ 
                          backfaceVisibility: 'hidden',
                          WebkitBackfaceVisibility: 'hidden'
                        }}
                        initial={{ opacity: 1 }}
                        animate={{ opacity: flipped ? 0 : 1 }}
                        transition={{ duration: 0.3 }}
                      >
                        <div className="text-white/50 text-4xl">?</div>
                      </motion.div>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Индикатор победителя */}
                {showResults && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="mt-3 md:mt-4 4xl:mt-6 text-center"
                  >
                    <div className="inline-flex items-center gap-2 bg-green-500/20 text-green-400 px-3 md:px-4 4xl:px-6 py-1.5 md:py-2 4xl:py-3 rounded-full border border-green-500/30">
                      <span className="text-xl md:text-2xl 4xl:text-3xl">🎉</span>
                      <span className="font-semibold text-sm md:text-base 4xl:text-xl">
                        Победитель: {pair.winner === 'player1' ? 'Игрок 1' : 'Игрок 2'}
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {/* Кнопка новой игры */}
        {showResults && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: pairs.length * 0.1 + 0.5 }}
            className="mt-8 text-center"
          >
            <button
              onClick={() => window.location.reload()}
              className="bg-primary-600 hover:bg-primary-700 text-white font-semibold py-4 px-8 rounded-lg transition-colors duration-200 shadow-lg"
            >
              Новая игра
            </button>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default RevealedCards;

