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
      <div className="max-w-6xl mx-auto">
        {/* Заголовок */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-8"
        >
          <div className="inline-flex items-center gap-3 mb-4">
            <span className="text-4xl">🎭</span>
            <h1 className="text-3xl md:text-5xl font-bold text-white">
              Рассказчик
            </h1>
          </div>
          <p className="text-white/70">
            Сессия: <span className="font-mono text-primary-400">{sessionId}</span>
          </p>
        </motion.div>

        {/* Статус игроков */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Статус игроков</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${gameState?.ready?.player1 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-white font-medium">Игрок 1</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${gameState?.ready?.player1 ? 'text-green-400' : 'text-gray-400'}`}>
                  {gameState?.ready?.player1 ? '✓ Готов' : 'Заполняет карточки...'}
                </span>
                <span className="text-white/60 text-sm">
                  ({gameState?.cards?.player1?.length || 0} карточек)
                </span>
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className={`w-4 h-4 rounded-full ${gameState?.ready?.player2 ? 'bg-green-500' : 'bg-gray-500'}`}></div>
                <span className="text-white font-medium">Игрок 2</span>
              </div>
              <div className="flex items-center gap-2">
                <span className={`text-sm ${gameState?.ready?.player2 ? 'text-green-400' : 'text-gray-400'}`}>
                  {gameState?.ready?.player2 ? '✓ Готов' : 'Заполняет карточки...'}
                </span>
                <span className="text-white/60 text-sm">
                  ({gameState?.cards?.player2?.length || 0} карточек)
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
          className="bg-white/10 backdrop-blur-lg rounded-xl p-6 mb-6 border border-white/20"
        >
          <h2 className="text-xl font-semibold text-white mb-4">Прогресс игры</h2>
          <div className="space-y-3">
            <div>
              <div className="flex justify-between text-sm text-white/70 mb-1">
                <span>Максимум карточек</span>
                <span>{gameState?.maxCards || 0}</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-primary-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${gameState?.maxCards > 0 ? 100 : 0}%` }}
                ></div>
              </div>
            </div>
            <div className="mt-4">
              <div className="flex justify-between text-sm text-white/70 mb-1">
                <span>Готовность игроков</span>
                <span>
                  {[gameState?.ready?.player1, gameState?.ready?.player2].filter(Boolean).length} / 2
                </span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div
                  className="bg-green-600 h-2 rounded-full transition-all duration-300"
                  style={{
                    width: `${([gameState?.ready?.player1, gameState?.ready?.player2].filter(Boolean).length / 2) * 100}%`
                  }}
                ></div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Информация */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="bg-blue-500/20 rounded-xl p-6 border border-blue-400/30"
        >
          <p className="text-white/90 text-center">
            {gameState?.ready?.player1 && gameState?.ready?.player2 ? (
              <span className="text-green-400 font-semibold">
                🎉 Оба игрока готовы! Карточки скоро откроются...
              </span>
            ) : (
              <span>
                💡 Ожидайте, пока оба игрока заполнят карточки и нажмут "Готов".
                Результаты появятся здесь автоматически.
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
            className="mt-6"
          >
            <h3 className="text-white/70 text-lg font-semibold mb-4 text-center">Карточки игроков</h3>
            <div className="space-y-4">
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
                    className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20"
                  >
                    <div className="text-center mb-3">
                      <span className="text-white/70 text-sm font-semibold">Пара #{index + 1}</span>
                    </div>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Карточка игрока 1 */}
                      <div className="relative h-32 rounded-lg overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border-2 border-white/20">
                        <div className="text-center">
                          <div className="text-white/50 text-xs mb-1">Игрок 1</div>
                          <div className="text-white/50 text-4xl">?</div>
                          {hasCard1 && (
                            <div className="text-white/30 text-xs mt-2">
                              {card1.text.length} символов
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Карточка игрока 2 */}
                      <div className="relative h-32 rounded-lg overflow-hidden bg-gradient-to-br from-slate-700 to-slate-900 flex items-center justify-center border-2 border-white/20">
                        <div className="text-center">
                          <div className="text-white/50 text-xs mb-1">Игрок 2</div>
                          <div className="text-white/50 text-4xl">?</div>
                          {hasCard2 && (
                            <div className="text-white/30 text-xs mt-2">
                              {card2.text.length} символов
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

