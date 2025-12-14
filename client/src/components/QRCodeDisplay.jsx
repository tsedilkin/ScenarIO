import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'framer-motion';

function QRCodeDisplay({ sessionId }) {
  if (!sessionId) return null;
  
  // Формируем URL для подключения
  // В dev режиме используем порт 5173, в prod - 3000
  const port = window.location.port || '5173';
  const baseUrl = `http://${window.location.hostname}:${port}`;
  const joinUrl = `${baseUrl}?session=${sessionId}`;

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.8 }}
      animate={{ opacity: 1, scale: 1 }}
      className="fixed top-4 left-4 z-50"
    >
      <div className="bg-white p-2 rounded-lg shadow-lg">
        <QRCodeSVG
          value={joinUrl}
          size={85}
          level="H"
          includeMargin={false}
        />
      </div>
    </motion.div>
  );
}

export default QRCodeDisplay;

