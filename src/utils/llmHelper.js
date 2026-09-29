import Groq from 'groq-sdk'
import { classifyWithProvider } from './classification.js'

/** Local-development client. Production requires a server-side credential. */
export async function categorizeMessage(message) {
  const model = import.meta.env.VITE_GROQ_MODEL || 'openai/gpt-oss-20b'
  return classifyWithProvider(message, model, async (request) => {
    const groq = new Groq({
      apiKey: import.meta.env.VITE_GROQ_API_KEY,
      dangerouslyAllowBrowser: true,
      timeout: 20000,
      maxRetries: 0
    })
    return groq.chat.completions.create(request)
  })
}
