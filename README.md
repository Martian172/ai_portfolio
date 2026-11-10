# HireMe AI — portfolio + streaming recruiter chat

This starter contains a FastAPI backend and a React/Vite frontend. The UI loads the parsed resume profile and public GitHub repository metadata, then streams AI answers from Groq into the chat panel.

## Folder layout

```text
hireme_ai/
├── .env
├── backend/
│   └── main.py
└── frontend-ui/
    ├── .env
    ├── package.json
    └── src/
        ├── App.jsx
        ├── index.css
        └── main.jsx
```

Copy `backend/main.py` into your existing `hireme_ai/backend/main.py`. Copy the `frontend-ui` folder into `hireme_ai`. Copy `.env.example` to `hireme_ai/.env` and fill in your own values. Do not overwrite your existing `.env` blindly; add or update the variables instead.

## 1. Backend setup (PowerShell)

Open a terminal in the `hireme_ai` project root (the folder that contains `backend`). Run:

```powershell
uv add fastapi uvicorn groq python-dotenv pydantic pypdf httpx
```

Create/update `.env` in the `hireme_ai` root:

```env
GROQ_API_KEY=your_real_groq_key
GROQ_MODEL=openai/gpt-oss-120b
GITHUB_USERNAME=your_github_username
GITHUB_TOKEN=
RESUME_PATH=../day4/resumes/ansh.pdf
```

`GITHUB_TOKEN` is optional. `GITHUB_USERNAME` must be the GitHub handle only, not the whole profile URL. Set `RESUME_PATH` to the actual PDF location, relative to `hireme_ai`, or use an absolute Windows path.

Start the backend from the `hireme_ai` root:

```powershell
uv run uvicorn backend.main:app --reload --host 127.0.0.1 --port 8000
```

Check these endpoints:

- http://127.0.0.1:8000/api/health
- http://127.0.0.1:8000/api/profile
- http://127.0.0.1:8000/api/projects
- http://127.0.0.1:8000/docs (only when `ENABLE_DOCS=true` in `.env`; off by default)

The PDF is extracted and parsed once at backend startup, not on every chat message. Restart the backend after changing the resume or `.env` values.

## 2. Frontend setup

The existing `frontend` folder in the screenshot appears to contain Python-related files. To avoid overwriting them, this starter uses a separate folder named `frontend-ui`.

Open a second VS Code terminal:

```powershell
cd frontend-ui
```

Create `frontend-ui/.env` with:

```env
VITE_API_URL=http://127.0.0.1:8000
```

Then install and run:

```powershell
npm install
npm run dev
```

Open the local URL printed by Vite, usually http://localhost:5173.

If you are copying this starter rather than using the supplied folder, the files in `frontend-ui` are a Vite React app. Install a current Node.js version supported by Vite before running npm commands.

## 3. How streaming works

1. FastAPI reads the PDF and asks Groq to structure it once during startup.
2. FastAPI fetches the user's public GitHub repositories once during startup.
3. The React UI loads `/api/profile` and `/api/projects`.
4. The chat sends the new question plus a short history window to `/api/chat`.
5. Groq returns streamed chunks; FastAPI forwards them as plain text; React reads `response.body` and appends each chunk immediately.

## 4. Accuracy notes

The GitHub cards show real public repository metadata (description, language, topics, stars and link). Repository metadata alone does not prove the exact implementation or your personal contribution. Keep repository descriptions and README files detailed, and make sure your resume accurately describes your role, tools and outcomes. The assistant is instructed not to invent implementation details that are absent from its context.

## 5. Security

**Secrets stay on the server.** `GROQ_API_KEY` and `GITHUB_TOKEN` are read only by the FastAPI backend from `.env` (locally) or the hosting platform's environment variables (in production). The browser never sees them: it only talks to `/api/chat`, and the backend calls Groq.

- Never put a key or token in a `VITE_` variable, `frontend-ui/.env` or React source. Vite bakes every `VITE_` value into public JavaScript.
- `.env` and `.env.*` are git-ignored; only the placeholder `.env.example` files are committed.
- On a host such as Vercel or Render, add the keys in the dashboard's *Environment Variables* settings, never in code.
- If a key is ever exposed (committed, pasted, screenshotted), revoke it at https://console.groq.com/keys and create a new one.

**Built-in protections**

| Protection | Where | Setting |
| --- | --- | --- |
| Per-IP chat rate limit (default 6/min, 60/day) and global daily cap (1500) | backend | `CHAT_LIMIT_PER_MINUTE`, `CHAT_LIMIT_PER_DAY`, `CHAT_GLOBAL_LIMIT_PER_DAY` |
| CORS: only your site may call the API from a browser | backend | `ALLOWED_ORIGINS` (set to your deployed frontend URL) |
| Real client IP behind a proxy, ignored otherwise so it can't be spoofed | backend | `TRUST_PROXY=true` on Vercel/Render |
| Request size cap (64 KB), strict input validation, unknown fields rejected | backend | — |
| `/docs` and `/openapi.json` hidden | backend | `ENABLE_DOCS=true` to show locally |
| Security headers (`nosniff`, `DENY` framing, `no-referrer`) | backend | — |
| Phone number never returned by `/api/profile`; minimal `/api/health` | backend | — |
| Prompt-injection guard in the system prompt | backend | — |
| Content Security Policy (own scripts only; connects only to GitHub API + your backend) | frontend build | derived from `VITE_API_URL` |
| AI replies rendered with `react-markdown` (no raw HTML, unsafe links stripped) | frontend | — |

The rate limiter is in memory, so each server instance counts separately. For a hard ceiling on cost, also set a spending limit in the Groq console.
