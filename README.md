# FireScrape 🔥

[![Bun](https://img.shields.io/badge/Bun-v1.x-000000?style=flat&logo=bun)](https://bun.sh)
[![License](https://img.shields.io/github/license/aasm3535/firescrape?style=flat&color=blue)](https://github.com/aasm3535/firescrape)
[![Vercel](https://img.shields.io/badge/Deploy-Vercel-000000?style=flat&logo=vercel)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Faasm3535%2Ffirescrape)

**FireScrape** is a lightweight, high-performance web scraper and search API built on **Bun** and **Express**. It simplifies data extraction and web search into a clean, JSON-based API.

---

## 🚀 Features

- **Smart Scraper:** Automatically rotates User-Agents and headers to mimic real browsers.
- **Search API:** Direct access to search engine results (DuckDuckGo style) in JSON.
- **MCP Server:** Integrate directly with Claude Desktop, Cursor, and other AI agents.
- **Dark Mode:** Beautiful, minimalist landing page included.

---

## 📦 MCP Installation (AI Agents)

Connect FireScrape to your AI tools to give them real-time web access.

### ⚡ Recommended (NPM/Bun)

No cloning required. Just run:

```bash
bunx @yutugyutugyutug/firescrape-mcp
# or
npx @yutugyutugyutug/firescrape-mcp
```

### ⚡ One-Line Install (Script)

**PowerShell (Windows):**
```powershell
irm https://raw.githubusercontent.com/aasm3535/firescrape-mcp/refs/heads/main/install.ps1 | iex
```

**Bash (Mac/Linux):**
```bash
curl -fsSL https://raw.githubusercontent.com/aasm3535/firescrape-mcp/refs/heads/main/install.sh | bash
```

### 🛠️ Manual Configuration

#### 1. Claude Desktop
Add the following to your `claude_desktop_config.json`:
```json
{
  "mcpServers": {
    "firescrape": {
      "command": "bunx",
      "args": ["@yutugyutugyutug/firescrape-mcp"]
    }
  }
}
```

#### 2. Cursor Editor
1. Go to **Settings** > **General** > **MCP**.
2. Click **Add New Server**.
3. Select **Stdio**.
4. **Command:** `bunx`
5. **Args:** `@yutugyutugyutug/firescrape-mcp`

#### 3. Gemini CLI
If you are using the `skillz` extension, ensure your `SKILLS_PATH` is configured and wrap the MCP server as a Skill, or check the extension documentation for generic MCP support.

---

## 🛠 Usage

### Scrape a Page
`GET /api/scrape?url=https://example.com`

```json
{
  "success": true,
  "data": {
    "title": "Example Domain",
    "description": "...",
    "content": "..."
  }
}
```

### Search the Web
`GET /api/search?q=bun+js`

```json
{
  "success": true,
  "results": [
    { "title": "Bun - A fast all-in-one JavaScript runtime", "link": "https://bun.sh" }
  ]
}
```

---

## 💻 Local Development

```bash
git clone https://github.com/aasm3535/firescrape.git
cd firescrape
bun install
bun dev
```

Open [http://localhost:3000](http://localhost:3000) to see the landing page.

---

## ☁️ Deploy

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Faasm3535%2Ffirescrape)