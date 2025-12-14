import https from 'https';
import http from 'http';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// URL страницы для парсинга
const pageUrl = 'https://sexolog.jofo.me/1100175-kamasutra-animashki.html';
// Путь для сохранения GIF
const gifsDir = join(__dirname, '..', 'public', 'gifs-sexolog');

// Создаем папку, если её нет
if (!fs.existsSync(gifsDir)) {
  fs.mkdirSync(gifsDir, { recursive: true });
  console.log(`✓ Создана папка: ${gifsDir}`);
}

// Функция для загрузки HTML страницы
function fetchPage(url) {
  return new Promise(async (resolve, reject) => {
    const urlObj = new URL(url);
    const client = urlObj.protocol === 'https:' ? https : http;
    
    const options = {
      hostname: urlObj.hostname,
      port: urlObj.port || (urlObj.protocol === 'https:' ? 443 : 80),
      path: urlObj.pathname + urlObj.search,
      method: 'GET',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
        'Accept-Encoding': 'gzip, deflate, br',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1',
        'Referer': 'https://sexolog.jofo.me/'
      }
    };
    
    const req = client.request(options, async (response) => {
      // Обрабатываем редиректы
      if (response.statusCode === 301 || response.statusCode === 302) {
        const redirectUrl = response.headers.location;
        if (redirectUrl) {
          console.log(`   Редирект на: ${redirectUrl}`);
          return fetchPage(redirectUrl).then(resolve).catch(reject);
        }
      }
      
      if (response.statusCode !== 200) {
        reject(new Error(`Failed to fetch page: ${response.statusCode} ${response.statusMessage}`));
        return;
      }
      
      let html = '';
      
      // Импортируем zlib для обработки сжатия
      const zlib = await import('zlib');
      
      // Обрабатываем сжатие
      let stream = response;
      const encoding = response.headers['content-encoding'];
      
      if (encoding === 'gzip') {
        stream = response.pipe(zlib.createGunzip());
      } else if (encoding === 'deflate') {
        stream = response.pipe(zlib.createInflate());
      } else if (encoding === 'br') {
        stream = response.pipe(zlib.createBrotliDecompress());
      }
      
      stream.on('data', (chunk) => {
        html += chunk.toString();
      });
      
      stream.on('end', () => {
        console.log(`   ✓ HTML получен (${html.length} символов, статус: ${response.statusCode})`);
        resolve(html);
      });
      
      stream.on('error', (err) => {
        reject(err);
      });
    });
    
    req.on('error', (err) => {
      reject(err);
    });
    
    req.end();
  });
}

// Функция для парсинга HTML и извлечения ссылок на GIF
function extractGifUrls(html) {
  const gifUrls = new Set(); // Используем Set для автоматического удаления дубликатов
  
  // Сначала находим div с классом post_wrapper_single
  const postWrapperPattern = /<div[^>]*class\s*=\s*["'][^"']*post_wrapper_single[^"']*["'][^>]*>([\s\S]*?)<\/div>/i;
  const postWrapperMatch = html.match(postWrapperPattern);
  
  if (!postWrapperMatch || !postWrapperMatch[1]) {
    console.log('   ⚠️  Не найден div.post_wrapper_single, ищем по всей странице...');
    // Если не нашли, ищем по всей странице
    return extractGifUrlsFromContent(html);
  }
  
  const content = postWrapperMatch[1];
  console.log(`   ✓ Найден div.post_wrapper_single (${content.length} символов)`);
  
  return extractGifUrlsFromContent(content);
}

// Функция для извлечения GIF из контента
function extractGifUrlsFromContent(content) {
  const gifUrls = new Set();
  
  // 1. Ищем все <img> теги с src, содержащим .gif
  // Более гибкий паттерн: атрибуты могут быть в любом порядке, с пробелами или без
  const imgPattern = /<img[^>]+src\s*=\s*["']([^"']*\.gif[^"']*)["'][^>]*>/gi;
  let imgMatch;
  
  while ((imgMatch = imgPattern.exec(content)) !== null) {
    let gifUrl = imgMatch[1].trim();
    
    // Пропускаем пустые URL
    if (!gifUrl) continue;
    
    // Если относительный путь, делаем абсолютным
    if (gifUrl.startsWith('/')) {
      gifUrl = `https://sexolog.jofo.me${gifUrl}`;
    } else if (!gifUrl.startsWith('http')) {
      gifUrl = `https://sexolog.jofo.me/${gifUrl}`;
    }
    
    // Проверяем, что это действительно GIF
    if (gifUrl.toLowerCase().endsWith('.gif')) {
      gifUrls.add(gifUrl);
      console.log(`   Найден GIF в <img>: ${gifUrl}`);
    }
  }
  
  // 2. Ищем все <a href> теги, которые ведут на .gif файлы
  const linkPattern = /<a[^>]+href\s*=\s*["']([^"']*\.gif[^"']*)["'][^>]*>/gi;
  let linkMatch;
  
  while ((linkMatch = linkPattern.exec(content)) !== null) {
    let gifUrl = linkMatch[1].trim();
    
    // Пропускаем пустые URL
    if (!gifUrl) continue;
    
    // Если относительный путь, делаем абсолютным
    if (gifUrl.startsWith('/')) {
      gifUrl = `https://sexolog.jofo.me${gifUrl}`;
    } else if (!gifUrl.startsWith('http')) {
      gifUrl = `https://sexolog.jofo.me/${gifUrl}`;
    }
    
    // Проверяем, что это действительно GIF
    if (gifUrl.toLowerCase().endsWith('.gif')) {
      gifUrls.add(gifUrl);
      console.log(`   Найден GIF в <a href>: ${gifUrl}`);
    }
  }
  
  // 3. Дополнительный поиск: ищем все упоминания .gif в любых атрибутах
  // Это поможет найти GIF, которые могут быть в data-src, data-url и т.д.
  const generalGifPattern = /(?:src|href|data-src|data-url|data-original)\s*=\s*["']([^"']*\.gif[^"']*)["']/gi;
  let generalMatch;
  
  while ((generalMatch = generalGifPattern.exec(content)) !== null) {
    let gifUrl = generalMatch[1].trim();
    
    // Пропускаем пустые URL
    if (!gifUrl) continue;
    
    // Если относительный путь, делаем абсолютным
    if (gifUrl.startsWith('/')) {
      gifUrl = `https://sexolog.jofo.me${gifUrl}`;
    } else if (!gifUrl.startsWith('http')) {
      gifUrl = `https://sexolog.jofo.me/${gifUrl}`;
    }
    
    // Проверяем, что это действительно GIF
    if (gifUrl.toLowerCase().endsWith('.gif') && !gifUrls.has(gifUrl)) {
      gifUrls.add(gifUrl);
      console.log(`   Найден GIF в атрибуте: ${gifUrl}`);
    }
  }
  
  // Конвертируем Set в массив и возвращаем
  return Array.from(gifUrls);
}

// Функция для скачивания одного GIF
function downloadGif(url, index, total) {
  return new Promise((resolve, reject) => {
    try {
      const urlObj = new URL(url);
      const filename = urlObj.pathname.split('/').pop() || `gif-${index}.gif`;
      const filePath = join(gifsDir, filename);
      
      // Проверяем, существует ли уже файл
      if (fs.existsSync(filePath)) {
        console.log(`⏭  [${index}/${total}] Пропущен ${filename} (уже существует)`);
        resolve({ url, filename, success: true, skipped: true });
        return;
      }
      
      const client = urlObj.protocol === 'https:' ? https : http;
      const file = fs.createWriteStream(filePath);
      
      client.get(url, (response) => {
        if (response.statusCode === 200) {
          response.pipe(file);
          
          file.on('finish', () => {
            file.close();
            console.log(`✓ [${index}/${total}] Скачан ${filename}`);
            resolve({ url, filename, success: true, skipped: false });
          });
        } else if (response.statusCode === 404) {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          console.log(`✗ [${index}/${total}] ${filename} не найден (404)`);
          resolve({ url, filename, success: false, skipped: false, error: '404' });
        } else {
          if (fs.existsSync(filePath)) {
            fs.unlinkSync(filePath);
          }
          console.log(`✗ [${index}/${total}] Ошибка при скачивании ${filename} (${response.statusCode})`);
          resolve({ url, filename, success: false, skipped: false, error: response.statusCode });
        }
      }).on('error', (err) => {
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        console.error(`✗ [${index}/${total}] Ошибка при скачивании ${filename}:`, err.message);
        resolve({ url, filename, success: false, skipped: false, error: err.message });
      });
    } catch (error) {
      console.error(`✗ [${index}/${total}] Ошибка обработки URL ${url}:`, error.message);
      resolve({ url, filename: 'unknown', success: false, skipped: false, error: error.message });
    }
  });
}

// Основная функция
async function main() {
  console.log('🚀 Начинаем парсинг страницы и скачивание GIF...\n');
  console.log(`📄 URL: ${pageUrl}\n`);
  
  try {
    // Загружаем HTML страницы
    console.log('📥 Загружаем HTML страницы...');
    const html = await fetchPage(pageUrl);
    console.log(`✓ HTML загружен (${html.length} символов)\n`);
    
    // Извлекаем ссылки на GIF
    console.log('🔍 Ищем ссылки на GIF...\n');
    const gifUrls = extractGifUrls(html);
    console.log(`\n✓ Найдено ${gifUrls.length} уникальных ссылок на GIF\n`);
    
    if (gifUrls.length === 0) {
      console.log('⚠️  GIF не найдены на странице. Проверьте URL и структуру страницы.');
      return;
    }
    
    // Выводим список найденных URL (первые 5 для примера)
    console.log('📋 Найденные GIF (первые 5):');
    gifUrls.slice(0, 5).forEach((url, i) => {
      console.log(`   ${i + 1}. ${url}`);
    });
    if (gifUrls.length > 5) {
      console.log(`   ... и еще ${gifUrls.length - 5} файлов\n`);
    } else {
      console.log('');
    }
    
    // Скачиваем все GIF
    console.log('📦 Начинаем скачивание...\n');
    
    const results = {
      success: 0,
      skipped: 0,
      failed: 0,
      failedUrls: []
    };
    
    // Скачиваем по одному файлу с небольшой задержкой
    for (let i = 0; i < gifUrls.length; i++) {
      const result = await downloadGif(gifUrls[i], i + 1, gifUrls.length);
      
      if (result.success) {
        if (result.skipped) {
          results.skipped++;
        } else {
          results.success++;
        }
      } else {
        results.failed++;
        results.failedUrls.push(result.url);
      }
      
      // Небольшая задержка между запросами (200ms)
      if (i < gifUrls.length - 1) {
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
    
    console.log(`\n📊 Результаты:`);
    console.log(`   ✓ Успешно скачано: ${results.success}`);
    console.log(`   ⏭  Пропущено (уже есть): ${results.skipped}`);
    console.log(`   ✗ Ошибок: ${results.failed}`);
    
    if (results.failedUrls.length > 0 && results.failedUrls.length <= 10) {
      console.log(`   URL с ошибками:`);
      results.failedUrls.forEach(url => {
        console.log(`      - ${url}`);
      });
    } else if (results.failedUrls.length > 10) {
      console.log(`   Первые 10 URL с ошибками:`);
      results.failedUrls.slice(0, 10).forEach(url => {
        console.log(`      - ${url}`);
      });
    }
    
    console.log(`\n✅ Готово! GIF файлы сохранены в: ${gifsDir}`);
  } catch (error) {
    console.error('\n❌ Ошибка:', error.message);
    process.exit(1);
  }
}

// Запускаем парсинг
main().catch(console.error);

