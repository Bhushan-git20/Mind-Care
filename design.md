# MindCare Technical Design

## Architecture Overview
MindCare (mindful-pathways) is built as a highly responsive, modern mental wellness application. It uses a Vite/React frontend and Supabase backend. All sensitive AI processing happens securely on Supabase Edge Functions.

## 🔐 Auth & Security Flow
1. User registration/login is handled by Supabase Auth.
2. The user's journaling entries and self-assessment scores (PHQ-9/GAD-7) are stored securely via **Row-Level Security (RLS)** in PostgreSQL.
3. The platform strictly prohibits unauthenticated queries. Even edge functions utilize the user's JWT to ensure operations are performed within the user's secure context.

## 💾 Database Entities (High-Level)

### Assessments
- Tracks user submissions for standardized tests (PHQ-9, GAD-7).
- Stores the final mapped score and severity grade to track longitudinal wellness progress.

### Journals
- Mood-coded journaling system.
- Analyzed for emotional sentiment (Positive, Neutral, Negative) upon submission by the edge function.

### Habits
- Interactive daily tracker for customizable habits.
- Stores consistency streaks and a 7-day visual progress grid data.

### Community (Anonymous Feed)
- A peer support safe space. 
- Moderated in real-time by edge functions to block toxic or triggering content before persistence.

## 🚀 Scaling & Edge Functions
- **Real-Time AI Chatbot**: The conversational AI interface relies on Google Gemini 1.5 Flash wrapped within the `chatbot` Supabase edge function. This provides an empathetic response pipeline without loading API credentials onto the client.
- **Sentiment & Moderation**: The `analyze-journal` and `moderate-post` edge functions handle asynchronous text processing. This architecture scales automatically via Deno deploy, meaning heavy NLP workloads will not block the main database threads.
- **Fast UI**: Client-side state is managed by TanStack Query and standard React context, maintaining a smooth 60fps experience for all glassmorphism animations.
