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
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
    'Accept-Language': 'en-US,en;q=0.9,ru;q=0.8',
    'Accept-Encoding': 'gzip, deflate, br',
    'Referer': 'https://www.google.com/',
    'Origin': 'https://www.google.com',
    'Host': host,
    'Connection': 'keep-alive',
    'Upgrade-Insecure-Requests': '1',
    'Sec-Fetch-Dest': 'document',
    'Sec-Fetch-Mode': 'navigate',
    'Sec-Fetch-Site': 'cross-site',
    'Sec-Fetch-User': '?1',
    'Cache-Control': 'max-age=0',
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
  if (html.length < 500 && triggers.some(t => lowerHtml.includes(t))) return true; // Short blocked pages
  
  return false;
};

// --- Routes ---

app.get('/playground', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'playground.html'));
});

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// API: Scrape
app.get('/api/scrape', async (req: any, res: any) => {
  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'Missing "url" query parameter' });
  }

  try {
    const targetUrl = url as string;
    const response = await axios.get(targetUrl, {
      headers: getHeaders(targetUrl),
      timeout: 15000,
      validateStatus: (status) => status < 500, // Handle 404/403 manually
    });

    if (response.status === 403 || response.status === 429) {
      return res.status(response.status).json({
        success: false,
        error: 'Target blocked the request (Bot Protection)',
        status_code: response.status
      });
    }

    const html = response.data;
    const $ = cheerio.load(html);

    // 1. Basic Metadata
    const title = $('title').text().trim() || $('meta[property="og:title"]').attr('content') || '';
    const description = $('meta[name="description"]').attr('content') || $('meta[property="og:description"]').attr('content') || '';
    const image = $('meta[property="og:image"]').attr('content') || '';
    const favicon = $('link[rel="icon"]').attr('href') || $('link[rel="shortcut icon"]').attr('href') || '';

    // 2. Bot Detection Check
    if (isCaptcha(html, title)) {
      return res.status(429).json({
        success: false,
        error: 'Bot protection detected (CAPTCHA/Challenge)',
        details: 'The site presented a challenge page instead of content.',
        title_detected: title
      });
    }

    // 3. JSON-LD Extraction (Structured Data)
    const jsonLd: any[] = [];
    $('script[type="application/ld+json"]').each((i, el) => {
      try {
        const data = JSON.parse($(el).html() || '{}');
        jsonLd.push(data);
      } catch (e) {
        // Ignore parse errors
      }
    });

    // 4. Main Content Extraction
    $('script, style, nav, footer, iframe, noscript, svg').remove();
    const textContent = $('body').text().replace(/\s+/g, ' ').trim().substring(0, 5000);

    // 5. Links Extraction (Top 20)
    const links: any[] = [];
    $('a[href]').each((i, el) => {
      if (i > 20) return;
      const href = $(el).attr('href');
      const text = $(el).text().trim();
      if (href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        links.push({ text, href });
      }
    });

    res.json({
      success: true,
      data: {
        url: targetUrl,
        title,
        description,
        image,
        favicon,
        json_ld: jsonLd.length > 0 ? jsonLd : null,
        links,
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

  if (!q) {
    return res.status(400).json({ error: 'Missing "q" (query) parameter' });
  }

  try {
    const searchUrl = `https://html.duckduckgo.com/html/?q=${encodeURIComponent(q as string)}`;
    const headers = getHeaders(searchUrl);
    
    const response = await axios.get(searchUrl, { headers });
    const $ = cheerio.load(response.data);

    const results: any[] = [];

    $('.result').each((i, element) => {
      const title = $(element).find('.result__a').text().trim();
      const link = $(element).find('.result__a').attr('href');
      const snippet = $(element).find('.result__snippet').text().trim();
      const icon = $(element).find('.result__icon__img').attr('src');

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
      results: results.slice(0, 10)
    });

  } catch (error: any) {
    res.status(500).json({ success: false, error: error.message });
  }
});

app.get('/healthz', (req, res) => res.json({ status: 'ok' }));

export default app;
