import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import * as cheerio from 'cheerio';
import UserAgent from 'user-agents';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());
app.use(express.static('public'));

// --- Helpers ---

// Функция для имитации браузера
const fetchHtml = async (url: string) => {
  const userAgent = new UserAgent();
  const headers = {
    'User-Agent': userAgent.toString(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.5',
    'Referer': 'https://www.google.com/',
    'Upgrade-Insecure-Requests': '1',
    'Cache-Control': 'max-age=0',
  };

  try {
    const response = await axios.get(url, {
      headers,
      timeout: 10000, // 10 секунд тайм-аут
      validateStatus: (status) => status < 500, // Принимаем даже 404, чтобы вернуть ошибку клиенту
    });
    return response.data;
  } catch (error: any) {
    throw new Error(`Failed to fetch URL: ${error.message}`);
  }
};

// --- Routes ---

// Главная страница
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// API: Scrape (Парсинг сайта)
app.get('/api/scrape', async (req: any, res: any) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing "url" query parameter' });
  }

  try {
    const html = await fetchHtml(url as string);
    const $ = cheerio.load(html);

    // Извлекаем мета-данные
    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content') || '';
    const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '';
    
    // Пытаемся достать основной текст (очищаем от скриптов и стилей)
    $('script, style, nav, footer, iframe, noscript').remove();
    const textContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 10000); // Ограничим 10к символов

    res.json({
      success: true,
      data: {
        url,
        title,
        description,
        image,
        favicon,
        content: textContent,
      }
    });
  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Search (Поиск в интернете - используем DuckDuckGo HTML версию для простоты)
app.get('/api/search', async (req: any, res: any) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ error: 'Missing "q" (query) parameter' });
  }

  try {
    // Используем html.duckduckgo.com для простого парсинга
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q as string)}`;
    const html = await fetchHtml(searchUrl);
    const $ = cheerio.load(html);

    const results: any[] = [];

    $('.result').each((i, element) => {
      const title = $(element).find('.result__a').text().trim();
      const link = $(element).find('.result__a').attr('href');
      const snippet = $(element).find('.result__snippet').text().trim();
      const icon = $(element).find('.result__icon__img').attr('src'); // Иногда доступно

      if (title && link) {
        results.push({
          title,
          link,
          snippet,
          icon: icon ? `https:${icon}` : null
        });
      }
    });

    res.json({
      success: true,
      query: q,
      results: results.slice(0, 10) // Топ 10 результатов
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// Health check
app.get('/healthz', (req, res) => {
  res.json({ status: 'ok', version: '1.0.0' });
});

export default app;