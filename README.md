<<<<<<< HEAD
# SkillLens AI
# SkillLens AI

SkillLens AI is an intelligent web application for CV analysis, skill extraction, and job matching. Powered by AI, it helps users identify missing skills, generate personalized learning roadmaps, and discover tailored job recommendations.

## Features
- AI-powered CV parsing and skill extraction
- Smart job matching based on skills and roles
- Personalized upskilling roadmaps
- Dashboard for CVs, job descriptions, and interview prep
- Modern UI with React and Next.js

## Getting Started
1. Clone the repository:
   ```
   git clone https://github.com/yourusername/skilllens-ai.git
   cd skilllens-ai
   ```
2. Install dependencies:
   ```
   npm install
   ```
3. Create a `.env.local` file and add your API keys (do not commit this file).
4. Run the development server:
   ```
   npm run dev
   ```

## Folder Structure
- `app/` - Next.js app routes and API endpoints
- `components/` - React UI components
- `hooks/` - Custom React hooks
- `lib/` - Utility libraries and API clients
- `data/` - Sample job data
- `public/` - Static assets
- `types/` - TypeScript types
- `docs/` - Documentation

## .gitignore
Make sure to exclude sensitive and unnecessary files:
```
node_modules/
.env.local
.next/
dist/
*.log
```

## License
MIT

---
For questions or contributions, open an issue or pull request on GitHub.
A professional CV analysis and skills extraction application built with Next.js and OpenAI GPT.

## Features

- 📄 PDF CV text extraction
- 🧠 AI-powered skills identification using GPT-4
- 💼 Job description matching capabilities
- 🔒 Secure API key management

## Security & Environment Setup

This application follows professional security practices for API key management:

### 🔐 Environment Variables

1. **Copy the environment template:**
   ```bash
   cp .env.example .env.local
   ```

2. **Add your OpenAI API key:**
   - Get your API key from [OpenAI Platform](https://platform.openai.com/api-keys)
   - Replace `your_openai_api_key_here` in `.env.local` with your actual key
   - ⚠️ **Never commit `.env.local` to version control**

### 🛡️ Security Best Practices

- ✅ `.env.local` is protected by `.gitignore`
- ✅ API keys are never hardcoded in source code
- ✅ Environment variables are validated at runtime
- ✅ Clear error messages for configuration issues

## Getting Started

First, set up your environment variables (see above), then run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
=======
# SkillLens-AI
Analyse CV
>>>>>>> 47a904cda67b177cd19c9dd8cd909304b51c2895
