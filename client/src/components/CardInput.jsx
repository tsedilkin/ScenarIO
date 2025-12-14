import { motion } from 'framer-motion';

function CardInput({ index, value, onChange, onRemove }) {
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

