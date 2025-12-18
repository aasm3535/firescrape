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

const getHeaders = (url: string) => {
  const userAgent = new UserAgent({ deviceCategory: 'desktop' });
  const { host } = new URL(url);
  
  return {
    'User-Agent': userAgent.toString(),
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8',
    'Accept-Language': 'ru-RU,ru;q=0.9,en-US;q=0.8,en;q=0.7',
    'Referer': 'https://www.google.com/',
    'Origin': `https://${host}`,
    'Host': host,
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Ch-Ua': '"Google Chrome";v="119", "Chromium";v="119", "Not?A_Brand";v="24"',
    'Sec-Ch-Ua-Mobile': '?0',
    'Sec-Ch-Ua-Platform': '"Windows"',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'no-cache',
    'Pragma': 'no-cache'
  };
};

const isCaptcha = (html: string, title: string) => {
  const lowerHtml = html.toLowerCase();
  const lowerTitle = title.toLowerCase();
  
  const triggers = [
    'security challenge', 
    'attention required', 
    'just a moment', 
    'почти готово', 
    'проверка браузера', 
    'cloudflare', 
    'human verification'
  ];

  if (triggers.some(t => lowerTitle.includes(t))) return true;
  if (html.length < 800 && triggers.some(t => lowerHtml.includes(t))) return true; 
  
  return false;
};

// Функция для поиска скрытых JSON-данных (WB, Next.js, Nuxt)
const extractHiddenJson = ($: any) => {
  const candidates: any[] = [];

  // 1. JSON-LD (Standard)
  $('script[type="application/ld+json"]').each((i: any, el: any) => {
    try { candidates.push({ type: 'json-ld', data: JSON.parse($(el).html() || '{}') }); } catch(e){}
  });

  // 2. Next.js Data
  const nextData = $('#__NEXT_DATA__').html();
  if (nextData) {
    try { candidates.push({ type: 'next-data', data: JSON.parse(nextData) }); } catch(e){}
  }

  // 3. Nuxt Data
  const nuxtData = $('#__NUXT__').html(); // Usually JS object, simpler parser needed, skipping complex eval
  
  // 4. Wildberries Specific (ssrModel / state)
  $('script').each((i: any, el: any) => {
    const html = $(el).html() || '';
    if (html.includes('ssrModel') || html.includes('window.state =')) {
      try {
        // Try to regex extract the JSON object
        const match = html.match(/window\.ssrModel\s*=\s*({.*?});/s) || html.match(/window\.state\s*=\s*({.*?});/s);
        if (match && match[1]) {
           candidates.push({ type: 'app-state', data: JSON.parse(match[1]) });
        }
      } catch(e) {}
    }
  });

  return candidates;
};

// --- Routes ---

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

app.get('/playground', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'playground.html'));
});

// API: Scrape
app.get('/api/scrape', async (req: any, res: any) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing "url" query parameter' });
  }

  try {
    const targetUrl = url as string;
    
    // Cookie Jar Simulation (Simple)
    // For a real robust solution, we'd need a persistent jar, but for Vercel/Serverless
    // we generate a fresh session each time or accept a 'cookies' param.
    // Here we focus on headers.

    const response = await axios.get(targetUrl, {
      headers: getHeaders(targetUrl),
      timeout: 20000,
      validateStatus: (status) => status < 500,
      maxRedirects: 5
    });

    if (response.status === 403 || response.status === 429) {
      // Even if 403, sometimes body contains info
      // but usually it's a block.
      return res.status(response.status).json({
        success: false,
        error: 'Target blocked the request (Bot Protection)',
        status_code: response.status,
        headers: response.headers
      });
    }

    const html = response.data;
    const $ = cheerio.load(html);

    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    
    // Bot Check
    if (isCaptcha(html, title)) {
      return res.status(429).json({
        success: false,
        error: 'Bot protection detected (CAPTCHA)',
        details: 'The site presented a challenge page.'
      });
    }

    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content') || '';
    const favicon = $('link[rel="icon"]').attr('href') || '';

    // Extract Hidden Data (The Magic)
    const hiddenData = extractHiddenJson($);

    // Clean Text
    $('script, style, nav, footer, iframe, noscript, svg, header').remove();
    const textContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);

    res.json({
      success: true,
      data: {
        url: targetUrl,
        meta: { title, description, image, favicon },
        structured_data: hiddenData, // WB data will appear here
        content_preview: textContent,
      }
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// API: Search
app.get('/api/search', async (req: any, res: any) => {
  const { q } = req.query;
  if (!q) return res.status(400).json({ error: 'Missing "q" parameter' });

  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q as string)}`;
    const response = await axios.get(searchUrl, { headers: getHeaders(searchUrl) });
    const $ = cheerio.load(response.data);

    const results: any[] = [];
    $('.result').each((i, element) => {
      const title = $(element).find('.result__a').text().trim();
      const link = $(element).find('.result__a').attr('href');
      const snippet = $(element).find('.result__snippet').text().trim();
      if (title && link) results.push({ title, link, snippet });
    });

    res.json({ success: true, results: results.slice(0, 10) });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

export default app;