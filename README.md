# RespoSage Prime — AI-Powered Codebase Analyzer

<p align="center">
  <img src="https://img.shields.io/badge/Next.js-15-black?style=for-the-badge&logo=next.js" alt="Next.js 15" />
  <img src="https://img.shields.io/badge/TypeScript-blue?style=for-the-badge&logo=typescript" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Clerk-Auth-purple?style=for-the-badge&logo=clerk" alt="Clerk" />
  <img src="https://img.shields.io/badge/Neon-Database-green?style=for-the-badge" alt="Neon DB" />
  <img src="https://img.shields.io/badge/Groq-AI-orange?style=for-the-badge" alt="Groq AI" />
  <img src="https://img.shields.io/badge/Vercel-Deployed-black?style=for-the-badge&logo=vercel" alt="Vercel" />
  <img src="https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge" alt="License MIT" />
</p>

<p align="center">
  <strong>An AI-powered GitHub repository analyzer built with RAG.</strong><br/>
  Index any GitHub repo and chat with it, review PRs,<br/>
  analyze code health and generate onboarding guides.
</p>

<p align="center">
  <a href="">
    <img src="https://img.shields.io/badge/Live_Demo-Visit_App-blue?style=for-the-button&logo=vercel" alt="Live Demo" />
  </a>
  <a href="https://github.com/swayampurwar/CodeSense-AI">
    <img src="https://img.shields.io/badge/GitHub-Source_Code-black?style=for-the-button&logo=github" alt="GitHub" />
  </a>
</p>

---

## ✨ Features

| Feature | Description |
|---|---|
| 🔍 RAG Indexing | Index any GitHub repo with high-performance embeddings |
| 💬 Chat with Codebase | Context-aware AI chat that understands your entire project |
| 👨‍💻 PR Code Review | Automated PR reviews powered by Llama 3.3 70B |
| 🏥 Code Health | Comprehensive scores for complexity, bugs, and documentation |
| 🚀 Onboarding Guide | Instantly generate documentation for new developers |
| 🐛 Bug Detection | Identify vulnerabilities and logical bugs before they ship |
| ⚡ SSE Streaming | Real-time Server-Sent Events for indexing progress |
| 🎨 Premium Dark UI | Sleek, modern interface inspired by Vercel and Linear |
| 🔮 3D Interactive Logo | Interactive Three.js octahedron in the navigation |
| 🔐 Secure Auth | Enterprise-grade authentication via Clerk |

## 🛠️ Tech Stack

| Category | Technology |
|---|---|
| **Framework** | Next.js 15 (App Router / Turbopack) |
| **Language** | TypeScript |
| **Auth** | Clerk |
| **Database** | Neon DB (Serverless PostgreSQL) |
| **Vector DB** | pgvector (HNSW Indexing) |
| **AI Model** | Groq (Llama 3.3 70B Versatile) |
| **Embeddings** | Nomic Embed v1.5 (768 dimensions) |
| **GitHub API** | Octokit |
| **Styling** | Tailwind CSS 4.0 |
| **3D Graphics** | Three.js |
| **Deployment** | Vercel |

## 📁 Project Structure

```text
codesenseai/
├── app/
│   ├── (auth)/              # Clerk sign-in/sign-up
│   ├── (pages)/             # Public landing and info pages
│   ├── dashboard/           # User repository dashboard
│   ├── repo/[repoId]/       # Repository-specific features
│   │   ├── chat/            # RAG-powered chatbot
│   │   ├── review/          # AI code review tool
│   │   └── health/          # Codebase health analytics
│   └── api/                 # Backend API routes
│       ├── ingest/          # SSE repository indexing logic
│       ├── chat/            # RAG retrieval and chat API
│       ├── review/          # Code review generation
│       ├── health/          # Health report generation
│       └── demo/            # Public demo endpoints
├── components/
│   ├── Navbar.tsx           # Interactive navigation component
│   ├── Footer.tsx           # Site footer
│   └── LogoCanvas.tsx       # Three.js 3D logo implementation
├── lib/
│   ├── db.ts                # Neon DB / Drizzle client
│   ├── schema.ts            # Database schema definitions
│   ├── groq.ts              # Groq AI integration logic
│   ├── github.ts            # Octokit GitHub integration
│   └── embeddings.ts        # Nomic Atlas embedding utility
└── public/                  # Static assets and icons
```

## 🚀 Getting Started

### Prerequisites
- Node.js 18+ and npm
- Accounts and API Keys for: **Clerk**, **Neon DB**, **Groq**, **Nomic**, and **GitHub**

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/SwayamPurwar/RepoSage-Prime.git
   cd CodeSense-AI
   ```

2. **Install dependencies:**
   ```bash
   npm install
   ```

3. **Setup environment variables:**
   Create a `.env.local` file in the root directory and add your keys (see table below).
   ```bash
   cp .env.example .env.local
   ```

4. **Sync database schema:**
   ```bash
   npm run db:push
   ```

5. **Run the development server:**
   ```bash
   npm run dev
   ```

## 🔑 Environment Variables

| Variable | Description | Required |
|---|---|---|
| NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY | Clerk Public Key | ✅ |
| CLERK_SECRET_KEY | Clerk Secret Key | ✅ |
| NEXT_PUBLIC_CLERK_SIGN_IN_URL | `/sign-in` | ✅ |
| NEXT_PUBLIC_CLERK_SIGN_UP_URL | `/sign-up` | ✅ |
| NEXT_PUBLIC_CLERK_AFTER_SIGN_IN_URL | `/dashboard` | ✅ |
| NEXT_PUBLIC_CLERK_AFTER_SIGN_UP_URL | `/dashboard` | ✅ |
| DATABASE_URL | Neon PostgreSQL connection string | ✅ |
| GITHUB_TOKEN | GitHub Personal Access Token (fallback for GitHub API) | ✅ |
| GROQ_API_KEY | Groq Cloud API Key | ✅ |
| NOMIC_API_KEY | Nomic Atlas API Key | ✅ |
| GITHUB_WEBHOOK_SECRET | GitHub Webhook Secret (for /api/webhooks/github) | ✅ |
| OPENAI_API_KEY | OpenAI API Key (optional, for future use) |  |
| GEMINI_API_KEY | Google Gemini API Key (for AI features) | ✅ |
| RESEND_API_KEY | Resend Email API Key (for contact form) |  |
| STRIPE_SECRET_KEY | Stripe Secret Key (for billing) |  |
| NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY | Stripe Publishable Key (frontend billing) |  |
| STRIPE_WEBHOOK_SECRET | Stripe Webhook Secret (for /api/webhooks/stripe) |  |
| STRIPE_PRO_MONTHLY_PRICE_ID | Stripe Monthly Price ID |  |
| STRIPE_PRO_ANNUAL_PRICE_ID | Stripe Annual Price ID |  |
| NEXT_PUBLIC_APP_URL | Base URL of your app (for Stripe redirects) |  |

## 🔌 API Routes

| Route | Method | Description |
|---|---|---|
| `/api/ingest` | `POST` | SSE-based repository indexing and embedding |
| `/api/chat` | `POST` | RAG-based context-aware chat response |
| `/api/chat` | `GET` | Retrieve chat history for a specific repository |
| `/api/review` | `POST` | Generate AI-powered code review |
| `/api/review` | `GET` | Fetch review history |
| `/api/health` | `POST` | Execute health analysis and scoring |
| `/api/health` | `GET` | Retrieve the latest health report |
| `/api/demo` | `POST` | Public demo access logic |
| `/api/repos` | `GET` | List all user-indexed repositories |
| `/api/repos/[id]` | `GET/DELETE` | CRUD operations for specific repositories |

## 🧠 How RAG Works

1. **URL Submission**: User provides a public GitHub repository URL.
2. **File Fetching**: Octokit extracts source code files (filtered by language).
3. **Chunking**: Code files are split into manageable chunks (approx. 500 tokens).
4. **Embedding**: Nomic's `v1.5` model generates 768-dimensional vectors for each chunk.
5. **Storage**: Vectors and content are stored in **Neon DB** using the `pgvector` extension.
6. **Querying**: When a user asks a question, the query is embedded into the same vector space.
7. **Similarity Search**: Cosine similarity is used to find the top 8 most relevant code blocks.
8. **LLM Context**: The retrieved code is passed to **Groq's Llama 3.3 70B** as grounded context.
9. **Final Answer**: AI generates a response specifically based on the provided code context.

## 🤝 Contributing

We welcome contributions! To contribute:

1. **Fork** the repository.
2. **Create** a new branch: `git checkout -b feature/your-feature-name`.
3. **Commit** your changes: `git commit -m 'Add some feature'`.
4. **Push** to the branch: `git push origin feature/your-feature-name`.
5. **Open** a Pull Request.

Please ensure your code follows the existing style and includes proper TypeScript types.

## 👨‍💻 Author

**Swayam Purwar**
- **LinkedIn**: [Swayam Purwar](https://www.linkedin.com/in/swayam-purwar)
- **GitHub**: [@Swayam Purwar](https://github.com/SwayamPurwar)
- **Email**: [swayampurwar111104@gmail.com](mailto:swayampurwar111104@gmail.com)

## 📄 License

This project is licensed under the **MIT License** - see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  Built with ❤️ by Swayam Purwar
</p>
