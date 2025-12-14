import { useState } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import { motion, AnimatePresence } from 'framer-motion';

function QRCodeDisplay({ sessionId }) {
  const [isExpanded, setIsExpanded] = useState(false);
  
  if (!sessionId) return null;
  
  // Формируем URL для подключения
  // В dev режиме используем порт 5173, в prod - 3000
  const port = window.location.port || '5173';
  const baseUrl = `http://${window.location.hostname}:${port}`;
  const joinUrl = `${baseUrl}?session=${sessionId}`;

  return (
    <div className="fixed top-4 left-4 z-50">
      <AnimatePresence>
        {isExpanded ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className="bg-white/95 backdrop-blur-lg rounded-xl p-4 shadow-2xl border-2 border-primary-500"
          >
            <div className="flex items-start gap-3 mb-3">
              <h3 className="text-sm font-semibold text-gray-800 flex-1">
                Подключиться к игре
              </h3>
              <button
                onClick={() => setIsExpanded(false)}
                className="text-gray-500 hover:text-gray-700 text-xl leading-none"
              >
                ×
              </button>
            </div>
            
            <div className="flex flex-col items-center gap-3">
              <div className="bg-white p-3 rounded-lg">
                <QRCodeSVG
                  value={joinUrl}
                  size={200}
                  level="H"
                  includeMargin={true}
                />
              </div>
              
              <div className="text-center">
                <p className="text-xs text-gray-600 mb-2">
                  Отсканируйте QR-код камерой телефона
                </p>
                <div className="bg-gray-100 rounded p-2">
                  <p className="text-xs font-mono text-gray-800 break-all">
                    {joinUrl}
                  </p>
                </div>
                <p className="text-xs text-gray-500 mt-2">
                  Или введите ID сессии вручную: <strong>{sessionId}</strong>
                </p>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.button
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.8 }}
            onClick={() => setIsExpanded(true)}
            className="bg-primary-600 hover:bg-primary-700 text-white rounded-full p-4 shadow-lg transition-all duration-200 flex items-center justify-center group"
            title="Показать QR-код для подключения"
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              className="h-6 w-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v1m6 11h2m-6 0h-2v4m0-11v3m0 0h.01M12 12h4.01M16 20h4M4 12h4m12 0h.01M5 8h2a1 1 0 001-1V5a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1zm12 0h2a1 1 0 001-1V5a1 1 0 00-1-1h-2a1 1 0 00-1 1v2a1 1 0 001 1zM5 20h2a1 1 0 001-1v-2a1 1 0 00-1-1H5a1 1 0 00-1 1v2a1 1 0 001 1z"
              />
            </svg>
          </motion.button>
        )}
      </AnimatePresence>
    </div>
  );
}

export default QRCodeDisplay;

