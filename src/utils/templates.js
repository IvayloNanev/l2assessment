/** Recommended queues and actions; the app does not send or assign tickets. */
const actionTemplates = {
  'Billing Issue': 'Route to billing support to review the charge, invoice or subscription before advising the customer.',
  'Technical Problem': 'Route to technical support to collect reproduction steps and investigate the reported failure.',
  'General Inquiry': 'Route to customer support to answer the question or clarify the request.',
  'Feature Request': 'Route to the product feedback queue and acknowledge the feature request.',
  'Unknown': 'Route to human triage to clarify the request before assigning a team.'
}

export function getRecommendedAction(category, urgency) {
  if (urgency === 'High') {
    return 'Escalate immediately to the support lead for incident review and assignment to the appropriate response team.'
  }
  return actionTemplates[category] || actionTemplates.Unknown
}

export function getAvailableCategories() {
  return Object.keys(actionTemplates)
}

export function shouldEscalate(category, urgency) {
  return urgency === 'High' || !Object.hasOwn(actionTemplates, category) || category === 'Unknown'
}
