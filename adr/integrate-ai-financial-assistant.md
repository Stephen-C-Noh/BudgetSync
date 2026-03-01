# ADR-007: AI Assistant

## Title
Use a Large Language Model API for an In-App AI Financial Assistant

## Status
Accepted

## Context
BudgetSync users need more than just charts and numbers. They need help interpreting their financial data and making better decisions. A dedicated AI assistant screen would allow users to ask natural language questions about their finances — for example, *"Am I spending too much on food?"*

Building this kind of AI from scratch is far beyond the scope of this course and project. The assistant must be an external service capable of receiving context about the user's expenses and budgets, and responding in plain, understandable language.

## Options Considered

### No AI Assistant
Removing the feature entirely would keep the project simpler. However, the AI assistant is a key differentiator that makes BudgetSync more useful than a basic spreadsheet. It was decided to keep it.

### On-Device (Local) LLM
LLMs compatible with mobile devices are far too underpowered for meaningful financial reasoning tasks.

### OpenAI API (GPT)
A mature API with strong reasoning capabilities. However, it has no free tier and costs can grow unpredictably depending on usage volume.

### Google Gemini API ✅
A capable LLM with a generous free tier sufficient for this level of project. It supports sending structured context — such as an expense summary — alongside user messages, making it a strong fit for BudgetSync.

## Decision
We will integrate the **Google Gemini API** to power the AI assistant screen in BudgetSync.

When a user sends a message, the app will:
1. Pull a structured summary of the user's current financial data from **Context** (which is hydrated from SQLite).
2. Attach that summary alongside the user's message in the API request.
3. Display Gemini's plain-language response in the chat interface.

This gives the model the context it needs for personalized, relevant responses without sending raw database records. The AI assistant will be accessible via a **dedicated tab** in the bottom navigation bar.

## Consequences

### Easier
- **Personalized Financial Advice** — The assistant can answer questions specific to the user's actual spending data, making it far more useful than a generic financial chatbot.
- **Free Tier Is Sufficient** — Google Gemini's free tier covers the expected request volume for a personal expense tracker, keeping the project cost-free during development and typical use.
- **No Custom Model to Train** — We send a structured prompt and receive a response. There is no infrastructure to manage, no model to train, and no backend server required beyond the API calls themselves.
- **Natural Language Interface** — Even users unfamiliar with the app's features can ask questions in plain language and receive understandable responses.

### More Difficult
- **Requires Internet Connection** — The AI assistant will not work offline. This is acceptable since it is an advisory feature; core expense tracking remains fully functional offline via SQLite.
- **Prompt Engineering Required** — To get accurate, relevant responses, the context sent with each message must be carefully structured. Poorly structured prompts will produce generic or unhelpful answers.
- **API Key Security** — The Gemini API key must **never** be hardcoded into the app or committed to the repository. It must be managed through environment variables and kept out of version control.
- **Data Privacy Consideration** — User financial data is sent to an external API. Users should be made aware of this. Where possible, only aggregated summaries should be sent rather than raw transaction records.

## Resolution
We chose solutions appropriate for a course-level project and avoided backend or enterprise-level complexity.
