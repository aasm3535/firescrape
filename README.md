# FireScrape 🔥

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Faasm3535%2Ffirescrape)
![Bun](https://img.shields.io/badge/Bun-v1.x-black?logo=bun)
![License](https://img.shields.io/github/license/aasm3535/firescrape)

**FireScrape** is a powerful, lightweight web scraper and search API built on Bun and Express. It is designed to be deployed instantly on Vercel.

**FireScrape** — это мощный и легкий API для скрапинга и поиска, построенный на Bun и Express. Создан для мгновенного развертывания на Vercel.

---

## 🚀 Features / Возможности

- **🔥 Smart Scraper**: Bypasses basic bot protections by rotating User-Agents and mimicking browser headers.
- **🔍 Search API**: Get web search results (DuckDuckGo style) in clean JSON.
- **⚡ Bun Powered**: Extremely fast execution.
- **🌑 Dark/Light Mode**: Beautiful landing page that adapts to your system theme.

- **🔥 Умный Скрапер**: Обходит базовые защиты, имитируя заголовки реального браузера.
- **🔍 API Поиска**: Получайте результаты поиска в чистом JSON.
- **⚡ На базе Bun**: Экстремально быстрая работа.
- **🌑 Темная/Светлая тема**: Красивый лендинг, адаптирующийся под вашу систему.

---

## 🛠 API Usage / Использование API

### 1. Scrape a Website / Парсинг сайта

Extract title, description, image, and text content from any URL.
Извлекает заголовок, описание, картинку и текст с любого URL.

**Endpoint:** `GET /api/scrape`

**Parameters:**
- `url` (required): The target URL.

**Example / Пример:**
```bash
curl "https://your-project.vercel.app/api/scrape?url=https://example.com"
```

**Response:**
```json
{
  "success": true,
  "data": {
    "url": "https://example.com",
    "title": "Example Domain",
    "description": "...",
    "image": "",
    "content": "Example Domain This domain is for..."
  }
}
```

### 2. Web Search / Поиск в сети

Search the web and get a list of results.
Поиск в интернете и получение списка результатов.

**Endpoint:** `GET /api/search`

**Parameters:**
- `q` (required): Search query.

**Example / Пример:**
```bash
curl "https://your-project.vercel.app/api/search?q=bun+js"
```

**Response:**
```json
{
  "success": true,
  "query": "bun js",
  "results": [
    {
      "title": "Bun — A fast all-in-one JavaScript runtime",
      "link": "https://bun.sh/",
      "snippet": "Bun is a fast all-in-one JavaScript runtime..."
    }
  ]
}
```

---

## 💻 Local Development / Локальная разработка

1. Clone the repo:
   ```bash
   git clone https://github.com/aasm3535/firescrape.git
   cd firescrape
   ```

2. Install dependencies:
   ```bash
   bun install
   ```

3. Run the server:
   ```bash
   bun dev
   ```

4. Open `http://localhost:3000`

---

## ☁️ Deploy / Деплой

Click the button below to deploy your own instance to Vercel for free.
Нажмите кнопку ниже, чтобы бесплатно развернуть свой экземпляр на Vercel.

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Faasm3535%2Ffirescrape)
