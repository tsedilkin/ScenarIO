import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import RevealedCards from './RevealedCards';
import QRCodeDisplay from './QRCodeDisplay';

function StorytellerView({ gameState, sessionId }) {
  const [isRevealed, setIsRevealed] = useState(false);

  useEffect(() => {
    if (gameState?.revealed && gameState?.pairs) {
      setIsRevealed(true);
    }
  }, [gameState]);

  // Если карточки открыты, показываем результаты
  if (isRevealed && gameState?.pairs) {
    return (
      <>
        <RevealedCards
          gameState={gameState}
          playerId="storyteller"
          isMobile={false}
        />
        <QRCodeDisplay sessionId={sessionId} />
      </>
    );
  }

  // Показываем статус игры для рассказчика
  return (
    <div className="min-h-screen p-4">
      <QRCodeDisplay sessionId={sessionId} />
      
      {/* ID сессии в правом верхнем углу */}
      <motion.div
        initial={{ opacity: 0, x: 20 }}
        animate={{ opacity: 1, x: 0 }}
        className="fixed top-4 right-4 z-50"
      >
        <div className="bg-white/10 backdrop-blur-lg rounded-lg px-4 py-2 border border-white/20 shadow-lg">
          <p className="text-white/70 text-sm">
            Сессия: <span className="font-mono text-primary-400 font-semibold">{sessionId}</span>
          </p>
        </div>
      </motion.div>
      
      <div className="max-w-4xl mx-auto">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-4"
        >
          <div className="inline-flex items-center gap-2 mb-2">
            <span className="text-2xl">🔞</span>
            <h1 className="text-2xl md:text-3xl font-bold text-white">
              Рассказчик
            </h1>
          </div>
        </motion.div>

        {/* Компактная информационная панель */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
          {/* Статус игроков */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20"
          >
            <h2 className="text-sm font-semibold text-white mb-2">Статус игроков</h2>
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${gameState?.ready?.player1 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span className="text-white text-xs font-medium">Игрок 1</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs ${gameState?.ready?.player1 ? 'text-green-400' : 'text-gray-400'}`}>
                    {gameState?.ready?.player1 ? '✓' : '...'}
                  </span>
                  <span className="text-white/60 text-xs">
                    ({gameState?.cards?.player1?.length || 0})
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full ${gameState?.ready?.player2 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                  <span className="text-white text-xs font-medium">Игрок 2</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <span className={`text-xs ${gameState?.ready?.player2 ? 'text-green-400' : 'text-gray-400'}`}>
                    {gameState?.ready?.player2 ? '✓' : '...'}
                  </span>
                  <span className="text-white/60 text-xs">
                    ({gameState?.cards?.player2?.length || 0})
                  </span>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Прогресс */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20"
          >
            <h2 className="text-sm font-semibold text-white mb-2">Прогресс</h2>
            <div className="space-y-2">
              <div>
                <div className="flex justify-between text-xs text-white/70 mb-1">
                  <span>Карточки</span>
                  <span>{gameState?.maxCards || 0}</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-primary-600 h-1.5 rounded-full transition-all duration-300"
                    style={{ width: `${gameState?.maxCards > 0 ? 100 : 0}%` }}
                  ></div>
                </div>
              </div>
              <div>
                <div className="flex justify-between text-xs text-white/70 mb-1">
                  <span>Готовность</span>
                  <span>
                    {[gameState?.ready?.player1, gameState?.ready?.player2].filter(Boolean).length} / 2
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-1.5">
                  <div
                    className="bg-green-600 h-1.5 rounded-full transition-all duration-300"
                    style={{
                      width: `${([gameState?.ready?.player1, gameState?.ready?.player2].filter(Boolean).length / 2) * 100}%`
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Информация */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-500/20 rounded-lg p-3 border border-blue-400/30"
        >
          <p className="text-white/90 text-center text-xs">
            {gameState?.ready?.player1 && gameState?.ready?.player2 ? (
              <span className="text-green-400 font-semibold">
                🎉 Оба игрока готовы! Карточки скоро откроются...
              </span>
            ) : (
              <span>
                💡 Ожидайте, пока оба игрока заполнят карточки и нажмут "Готов".
              </span>
            )}
          </p>
        </motion.div>

        {/* Закрытые карточки игроков */}
        {gameState?.cards && gameState.maxCards > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mt-4"
          >
            <h3 className="text-white/70 text-sm font-semibold mb-3 text-center">Карточки игроков</h3>
            <div className="space-y-3">
              {Array.from({ length: gameState.maxCards }).map((_, index) => {
                const card1 = gameState.cards.player1?.[index];
                const card2 = gameState.cards.player2?.[index];
                const hasCard1 = card1?.text && card1.text.trim();
                const hasCard2 = card2?.text && card2.text.trim();
                
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.1 }}
                    className="bg-white/10 backdrop-blur-lg rounded-lg p-3 border border-white/20"
                  >
                    <div className="text-center mb-2">
                      <span className="text-white/70 text-xs font-semibold">Действие #{index + 1}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {/* Карточка игрока 1 */}
                      <div className="relative h-24 rounded-lg overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border border-white/20">
                        <div className="text-center">
                          <div className="text-white/50 text-xs mb-1">Игрок 1</div>
                          <div className="text-white/50 text-2xl">?</div>
                          {hasCard1 && (
                            <div className="text-white/30 text-xs mt-1">
                              {card1.text.length} симв.
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Карточка игрока 2 */}
                      <div className="relative h-24 rounded-lg overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border border-white/20">
                        <div className="text-center">
                          <div className="text-white/50 text-xs mb-1">Игрок 2</div>
                          <div className="text-white/50 text-2xl">?</div>
                          {hasCard2 && (
                            <div className="text-white/30 text-xs mt-1">
                              {card2.text.length} симв.
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>
        )}
      </div>
    </div>
  );
}

export default StorytellerView;

