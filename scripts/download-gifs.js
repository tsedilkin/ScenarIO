import https from 'https';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Путь для сохранения GIF
const gifsDir = join(__dirname, '..', 'public', 'gifs');
const totalGifs = 65; // Количество GIF (от 1 до 65)

// Создаем папку, если её нет
if (!fs.existsSync(gifsDir)) {
  fs.mkdirSync(gifsDir, { recursive: true });
  console.log(`✓ Создана папка: ${gifsDir}`);
}

// Функция для скачивания одного GIF
function downloadGif(number) {
  return new Promise((resolve, reject) => {
    const url = `https://fanty-online.com/data/uploads/poza-${number}.gif`;
    const filePath = join(gifsDir, `poza-${number}.gif`);
    
    // Проверяем, существует ли уже файл
    if (fs.existsSync(filePath)) {
      console.log(`⏭  Пропущен poza-${number}.gif (уже существует)`);
      resolve({ number, success: true, skipped: true });
      return;
    }
    
    const file = fs.createWriteStream(filePath);
    
    https.get(url, (response) => {
      // Проверяем статус ответа
      if (response.statusCode === 200) {
        response.pipe(file);
        
        file.on('finish', () => {
          file.close();
          console.log(`✓ Скачан poza-${number}.gif`);
          resolve({ number, success: true, skipped: false });
        });
      } else if (response.statusCode === 404) {
        // Если файл не найден, удаляем пустой файл
        fs.unlinkSync(filePath);
        console.log(`✗ poza-${number}.gif не найден (404)`);
        resolve({ number, success: false, skipped: false, error: '404' });
      } else {
        fs.unlinkSync(filePath);
        console.log(`✗ Ошибка при скачивании poza-${number}.gif (${response.statusCode})`);
        resolve({ number, success: false, skipped: false, error: response.statusCode });
      }
    }).on('error', (err) => {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      console.error(`✗ Ошибка при скачивании poza-${number}.gif:`, err.message);
      resolve({ number, success: false, skipped: false, error: err.message });
    });
  });
}

// Функция для скачивания всех GIF с задержкой между запросами
async function downloadAllGifs() {
  console.log(`🚀 Начинаем скачивание ${totalGifs} GIF файлов...\n`);
  
  const results = {
    success: 0,
    skipped: 0,
    failed: 0,
    failedNumbers: []
  };
  
  // Скачиваем по одному файлу с небольшой задержкой, чтобы не перегружать сервер
  for (let i = 1; i <= totalGifs; i++) {
    const result = await downloadGif(i);
    
    if (result.success) {
      if (result.skipped) {
        results.skipped++;
      } else {
        results.success++;
      }
    } else {
      results.failed++;
      results.failedNumbers.push(i);
    }
    
    // Небольшая задержка между запросами (100ms)
    if (i < totalGifs) {
      await new Promise(resolve => setTimeout(resolve, 100));
    }
  }
  
  console.log(`\n📊 Результаты:`);
  console.log(`   ✓ Успешно скачано: ${results.success}`);
  console.log(`   ⏭  Пропущено (уже есть): ${results.skipped}`);
  console.log(`   ✗ Ошибок: ${results.failed}`);
  
  if (results.failedNumbers.length > 0) {
    console.log(`   Номера с ошибками: ${results.failedNumbers.join(', ')}`);
  }
  
  console.log(`\n✅ Готово! GIF файлы сохранены в: ${gifsDir}`);
}

// Запускаем скачивание
downloadAllGifs().catch(console.error);

