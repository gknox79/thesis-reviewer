# Thesis Draft Reviewer

A web app that gives masters thesis students structured, formative feedback on their chapter drafts. Built for Prof. Knox's research group at TiSEM, Tilburg University.

Students upload a `.docx` or `.pdf` chapter and receive rubric-anchored feedback — strengths, areas for improvement, cross-checks, priority actions, and questions to bring to their next supervision meeting.

**This is a drafting aid, not a grade.** It never produces scores, ratings, or replacement text.

## How It Works

1. Student enters their access code
2. Uploads a thesis chapter (.docx or .pdf)
3. Selects the submission stage (Proposal / Draft / Final)
4. Receives streaming feedback based on the TiSEM thesis rubric
5. Downloads the review and an AI logbook entry (for TiSEM compliance)

## Cost

Each review costs approximately **$0.10** in API usage (Claude Sonnet). A full cohort of 10 students × 5 chapters = ~$5 total. You can set a monthly spending cap in the Anthropic dashboard.

## Setup Guide (from scratch)

### Prerequisites

- A GitHub account (free): https://github.com/signup
- A Vercel account (free): https://vercel.com/signup (sign in with GitHub)
- An Anthropic API account: https://console.anthropic.com/

### Step 1: Get an Anthropic API Key

1. Go to https://console.anthropic.com/
2. Sign up or log in
3. Navigate to **API Keys** in the sidebar
4. Click **Create Key** and copy the key (starts with `sk-ant-...`)
5. Go to **Plans & Billing** → set a **Monthly Spending Limit** (recommended: $20)

### Step 2: Deploy to Vercel

1. Click the button below to deploy directly from GitHub:

   [![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https://github.com/YOUR-USERNAME/thesis-reviewer)

   Or manually:
   - Go to https://vercel.com/new
   - Click **Import Git Repository**
   - Select this repository
   - Vercel auto-detects Next.js — click **Deploy**

2. When prompted for environment variables, add:

   | Variable | Value |
   |----------|-------|
   | `ANTHROPIC_API_KEY` | Your API key from Step 1 |
   | `ACCESS_CODES` | Comma-separated codes, e.g. `THESIS-ANNA-2026,THESIS-BOB-2026` |

3. Click **Deploy**. You'll get a URL like `thesis-reviewer.vercel.app`.

### Step 3: Set Up Rate Limiting (Optional)

For persistent rate limiting across server restarts:

1. In the Vercel dashboard, go to your project → **Storage**
2. Click **Create Database** → select **KV** (Redis)
3. Follow the setup — it auto-adds `KV_REST_API_URL` and `KV_REST_API_TOKEN` to your env vars
4. Redeploy

Without Vercel KV, rate limiting works in-memory (resets on each deploy, which is fine for small groups).

### Step 4: Generate Access Codes for Students

Access codes are stored in the `ACCESS_CODES` environment variable. To add or remove students:

1. Go to your Vercel project → **Settings** → **Environment Variables**
2. Edit `ACCESS_CODES`
3. Add or remove codes (comma-separated): `THESIS-ANNA-2026,THESIS-BOB-2026,THESIS-CAROL-2026`
4. Click **Save** → Vercel will redeploy automatically

**Naming convention suggestion:** `THESIS-FIRSTNAME-YEAR` (e.g., `THESIS-ANNA-2026`)

Each code gets **10 reviews per month**. This resets on the 1st of each month.

## Local Development

```bash
# Clone the repo
git clone https://github.com/YOUR-USERNAME/thesis-reviewer.git
cd thesis-reviewer

# Install dependencies
npm install

# Copy environment template and fill in your values
cp .env.example .env.local
# Edit .env.local with your API key and test access codes

# Run the dev server
npm run dev
```

Open http://localhost:3000.

## Customizing the Review Prompt

The review rubric lives in `lib/review-prompt.ts`. Edit it to:

- Add or remove rubric criteria
- Change the weighting
- Adjust chapter-specific expectations
- Add discipline-specific terminology
- Modify the output format

Changes take effect on the next deploy (or immediately in local dev).

## Architecture

```
thesis-reviewer/
├── app/
│   ├── page.tsx                 # Main single-page app
│   ├── api/review/route.ts      # File upload → streaming Claude review
│   ├── api/validate/route.ts    # Access code validation
│   └── components/              # React components
├── lib/
│   ├── review-prompt.ts         # The review rubric (system prompt)
│   ├── file-parser.ts           # .docx and .pdf text extraction
│   ├── rate-limiter.ts          # Access code + usage tracking
│   └── logbook.ts               # AI logbook entry generator
└── .env.local                   # API key and access codes (gitignored)
```

## Policy Compliance

- **No automated grading**: The tool never produces scores (TiSEM policy + EU AI Act)
- **No replacement text**: Identifies weaknesses without writing for the student
- **AI logbook**: Auto-generates a downloadable logbook entry per TiSEM 2025-26 requirements
- **Data transparency**: Privacy section explains text is sent to Anthropic's API
- **Supervision bridge**: Every review ends with questions for the supervisor

## License

MIT
