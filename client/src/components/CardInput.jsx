import { useState } from 'react';
import { motion } from 'framer-motion';

function CardInput({ index, value, onChange, onRemove, gifUrl, onGifChange }) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [isLoadingGif, setIsLoadingGif] = useState(false);
  const [error, setError] = useState(null);

  const handleGenerate = async () => {
    setIsGenerating(true);
    setError(null);
    
    try {
      const serverUrl = `http://${window.location.hostname}:3000`;
      const response = await fetch(`${serverUrl}/api/generate-suggestions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          context: value || `Карточка ${index + 1}`
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при генерации вариантов');
      }

      const data = await response.json();
      // Сразу подставляем сгенерированный вариант, заменяя предыдущий
      if (data.suggestion) {
        onChange(data.suggestion);
      }
    } catch (err) {
      console.error('Error generating suggestions:', err);
      setError('Не удалось сгенерировать варианты. Убедитесь, что Ollama запущен.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleLoadGif = async () => {
    setIsLoadingGif(true);
    setError(null);
    
    try {
      const serverUrl = `http://${window.location.hostname}:3000`;
      const response = await fetch(`${serverUrl}/api/get-pose-gif`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          poz: Math.floor(Math.random() * 65) + 1, // Случайная поза от 1 до 65
          x: window.innerWidth,
          y: window.innerHeight
        }),
      });

      if (!response.ok) {
        throw new Error('Ошибка при загрузке GIF');
      }

      const data = await response.json();
      if (data.gifUrl && onGifChange) {
        onGifChange(data.gifUrl);
      }
    } catch (err) {
      console.error('Error loading GIF:', err);
      setError('Не удалось загрузить GIF');
    } finally {
      setIsLoadingGif(false);
    }
  };

  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      className="bg-white/10 backdrop-blur-lg rounded-xl p-4 border border-white/20 shadow-lg"
    >
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-primary-600 text-white flex items-center justify-center font-bold text-sm">
          {index + 1}
        </div>
        <div className="flex-1">
          <textarea
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder={`Введите действие для карточки ${index + 1}...`}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none min-h-[80px]"
            rows={3}
          />
          <div className="mt-2 flex gap-2">
            <button
              onClick={handleGenerate}
              disabled={isGenerating}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isGenerating
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-purple-600 hover:bg-purple-700 text-white'
              }`}
            >
              {isGenerating ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Генерация...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Сгенерировать
                </>
              )}
            </button>
            <button
              onClick={handleLoadGif}
              disabled={isLoadingGif}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                isLoadingGif
                  ? 'bg-gray-600 text-gray-400 cursor-not-allowed'
                  : 'bg-pink-600 hover:bg-pink-700 text-white'
              }`}
            >
              {isLoadingGif ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Загрузка...
                </>
              ) : (
                <>
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  GIF
                </>
              )}
            </button>
          </div>
          {error && (
            <div className="mt-2 text-red-400 text-xs">{error}</div>
          )}
          {gifUrl && (
            <div className="mt-3 rounded-lg overflow-hidden border border-white/20">
              <img 
                src={gifUrl} 
                alt="Pose animation" 
                className="w-full h-auto max-h-48 object-contain"
                onError={(e) => {
                  console.error('Error loading GIF:', gifUrl);
                  e.target.style.display = 'none';
                }}
              />
            </div>
          )}
        </div>
        {onRemove && (
          <button
            onClick={onRemove}
            className="flex-shrink-0 w-8 h-8 rounded-full bg-red-500/20 hover:bg-red-500/40 text-red-400 flex items-center justify-center transition-colors"
          >
            ×
          </button>
        )}
      </div>
    </motion.div>
  );
}

export default CardInput;

