import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const gifsDir = join(__dirname, '..', 'public', 'gifs-sexolog');

console.log('🔄 Начинаем переименование GIF файлов...\n');
console.log(`📁 Папка: ${gifsDir}\n`);

try {
  if (!fs.existsSync(gifsDir)) {
    console.error(`❌ Папка ${gifsDir} не найдена!`);
    process.exit(1);
  }

  // Читаем все файлы в папке
  const files = fs.readdirSync(gifsDir);
  
  // Фильтруем только .gif файлы
  const gifFiles = files.filter(file => file.toLowerCase().endsWith('.gif'));
  
  if (gifFiles.length === 0) {
    console.log('⚠️  GIF файлы не найдены в папке');
    process.exit(0);
  }

  console.log(`✓ Найдено ${gifFiles.length} GIF файлов\n`);

  // Переименовываем файлы по порядку
  let renamed = 0;
  let skipped = 0;

  gifFiles.forEach((oldName, index) => {
    const newName = `${index + 1}.gif`;
    const oldPath = join(gifsDir, oldName);
    const newPath = join(gifsDir, newName);

    // Если файл уже имеет правильное имя, пропускаем
    if (oldName === newName) {
      console.log(`⏭  Пропущен: ${oldName} (уже правильно назван)`);
      skipped++;
      return;
    }

    // Проверяем, не существует ли уже файл с таким именем
    if (fs.existsSync(newPath) && oldPath !== newPath) {
      console.log(`⚠️  Файл ${newName} уже существует, пропускаем ${oldName}`);
      skipped++;
      return;
    }

    try {
      fs.renameSync(oldPath, newPath);
      console.log(`✓ Переименован: ${oldName} → ${newName}`);
      renamed++;
    } catch (error) {
      console.error(`✗ Ошибка при переименовании ${oldName}:`, error.message);
    }
  });

  console.log(`\n📊 Результаты:`);
  console.log(`   ✓ Переименовано: ${renamed}`);
  console.log(`   ⏭  Пропущено: ${skipped}`);
  console.log(`   📁 Всего файлов: ${gifFiles.length}`);
  console.log(`\n✅ Готово!`);

} catch (error) {
  console.error('❌ Ошибка:', error.message);
  process.exit(1);
}

