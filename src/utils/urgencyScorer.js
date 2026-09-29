/**
 * Conservative, English-language impact rules. Urgency is independent of tone,
 * message length and the operator's clock. Unrecognized messages need review.
 */
const criticalSignals = [
  {
    pattern: /\b(?:production(?: server| system)?|server|service|site|website|checkout|payment system)\s+(?:(?:is|are)\s+)?(?:down|unavailable|offline)\b/,
    reason: 'A service outage may be blocking customers or revenue.'
  },
  {
    pattern: /\b(?:all|every|multiple)\s+(?:of our\s+)?(?:customers?|users?|teams?)\s+(?:cannot|can't|are unable to)\s+(?:log\s?in|sign\s?in|access|pay|check\s?out)\b/,
    reason: 'Multiple customers are blocked from a core workflow.'
  },
  {
    pattern: /\b(?:security breach|data breach|data leak|account (?:was |is |has been )?(?:hacked|compromised)|(?:losing|lost|deleted) customer data)\b/,
    reason: 'A security or customer-data incident needs immediate human review.'
  },
  {
    pattern: /\b(?:cannot|can't|unable to)\s+(?:accept|process|receive)\s+(?:any\s+)?(?:payments|orders)\b/,
    reason: 'The business cannot process payments or orders.'
  }
]

// Avoid treating common negated, historical or hypothetical incidents as live.
// This is deliberately bounded; complex language still requires human judgment.
function isCurrentSignal(clause, match) {
  const before = clause.slice(0, match.index)
  const after = clause.slice(match.index + match[0].length)
  return !/\b(?:no|not|without|never)\s+(?:(?:a|an|any|evidence|of|signs|actual)\s+){0,4}$/.test(before)
    && !/\b(?:if|what if|in case|yesterday|last week|previously)\b/.test(before)
    && !/\b(?:resolved|fixed|restored|recovered|no longer|back online|old alert|yesterday|last week)\b/.test(after)
}

export function assessUrgency(message) {
  const text = String(message ?? '').toLowerCase().replace(/[’‘]/g, "'").replace(/\s+/g, ' ').trim()
  const clauses = text.split(/[.!?;]|\bbut\b|\bhowever\b/)
  for (const signal of criticalSignals) {
    for (const clause of clauses) {
      const match = clause.match(signal.pattern)
      if (match && isCurrentSignal(clause, match)) {
        return { urgency: 'High', reason: signal.reason }
      }
    }
  }

  // Problem language takes precedence over a greeting, praise or a feature ask.
  const problem = /\b(?:error|bug|broken|crash(?:es|ing)?|down|outage|unavailable|offline|cannot|can't|unable|won't|doesn't|not working|slow(?:ly)?|tim(?:e|ing)[ -]?out|blocked|failed|failing|charged|refund|breach|hacked|lost|issue|problem)\b/
  const routine = /\b(?:thank(?:s| you)|love|great|excellent|wonderful|feature request|dark mode|suggestion)\b|\b(?:could|can) you (?:please )?add\b|\b(?:how (?:do|can) i|where (?:is|can i)|can i upgrade)\b/
  if (!problem.test(text) && routine.test(text)) {
    return { urgency: 'Low', reason: 'Routine feedback, a feature suggestion or an informational request.' }
  }
  return {
    urgency: 'Medium',
    reason: 'Needs normal support review; no confirmed critical-impact signal was recognized.'
  }
}

// Preserve the original public API for existing consumers.
export function calculateUrgency(message) {
  return assessUrgency(message).urgency
}
