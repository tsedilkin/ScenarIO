import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';

function SessionJoin({ onJoin, onJoinAsStoryteller }) {
  const [sessionId, setSessionId] = useState('');
  const [error, setError] = useState('');

  // Проверяем URL параметры при загрузке
  useEffect(() => {
    const urlParams = new URLSearchParams(window.location.search);
    const sessionFromUrl = urlParams.get('session');
    if (sessionFromUrl) {
      setSessionId(sessionFromUrl);
    }
  }, []);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!sessionId.trim()) {
      setError('Введите ID сессии');
      return;
    }
    setError('');
    onJoin(sessionId.trim());
  };

  const handleCreateAsStoryteller = () => {
    console.log('Create as storyteller clicked');
    setError('');
    if (onJoinAsStoryteller) {
      console.log('Calling onJoinAsStoryteller');
      onJoinAsStoryteller('');
    } else {
      console.error('onJoinAsStoryteller is not provided');
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.5 }}
        className="bg-white/10 backdrop-blur-lg rounded-2xl shadow-2xl p-8 w-full max-w-md border border-white/20"
      >
        <h1 className="text-4xl font-bold text-white mb-2 text-center">
          ScenarIO
        </h1>
        <p className="text-white/70 text-center mb-8">
          Игра челленджей для 2 игроков
        </p>

        <div className="space-y-4">
          {/* Кнопка для Рассказчика */}
          <button
            type="button"
            onClick={handleCreateAsStoryteller}
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-semibold py-4 px-6 rounded-lg transition-colors duration-200 flex items-center justify-center gap-2 text-lg"
          >
            <span>🎭</span>
            <span>Создать сессию как Рассказчик</span>
          </button>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t border-white/20"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-transparent text-white/60">или</span>
            </div>
          </div>

          {/* Форма для игроков */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-white/90 text-sm font-medium mb-2">
                ID сессии от Рассказчика
              </label>
              <input
                type="text"
                value={sessionId}
                onChange={(e) => setSessionId(e.target.value)}
                className="w-full px-4 py-3 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                placeholder="Введите ID сессии"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-primary-600 hover:bg-primary-700 text-white font-semibold py-3 px-6 rounded-lg transition-colors duration-200"
            >
              Присоединиться как Игрок
            </button>
            {error && (
              <div className="text-red-400 text-sm text-center mt-2">
                {error}
              </div>
            )}
          </form>
        </div>

        <div className="mt-6 space-y-3">
          <div className="p-4 bg-purple-500/20 rounded-lg border border-purple-400/30">
            <p className="text-white/90 text-sm">
              <strong>🎭 Для Рассказчика:</strong> Создайте сессию, чтобы видеть результаты на большом экране. 
              Поделитесь ID сессии с игроками.
            </p>
          </div>
          <div className="p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
            <p className="text-white/90 text-sm">
              <strong>📱 Для Игроков:</strong> Получите ID сессии от Рассказчика и введите его выше, 
              чтобы присоединиться к игре.
            </p>
          </div>
        </div>
      </motion.div>
    </div>
  );
}

export default SessionJoin;

