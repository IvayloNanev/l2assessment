import test from 'node:test'
import assert from 'node:assert/strict'
import { assessUrgency, calculateUrgency } from '../src/utils/urgencyScorer.js'
import { getRecommendedAction, shouldEscalate } from '../src/utils/templates.js'

const cases = [
  ['Our production server is down', 'High'],
  ['Please help, all customers cannot log in and our business is blocked.', 'High'],
  ['The checkout is unavailable. Could you help us please?', 'High'],
  ["We can't accept payments", 'High'],
  ['We are losing customer data', 'High'],
  ['My account has been hacked', 'High'],
  ['We detected a data breach', 'High'],
  ['Every user is happy!', 'Medium'],
  ['All users cannot access their accounts', 'High'],
  ['Thanks! Our service is offline.', 'High'],
  ['Thank you for the wonderful service!!!!!', 'Low'],
  ['Could you please add dark mode?', 'Low'],
  ['How do I update my profile?', 'Low'],
  ['I was charged twice for my subscription.', 'Medium'],
  ['The dashboard is loading slowly', 'Medium'],
  ['Thank you, but the dashboard is loading slowly', 'Medium'],
  ['Please help, the dashboard keeps timing out. Thanks!', 'Medium'],
  ['Thanks, but I cannot access my account', 'Medium'],
  ['Great product, but checkout is down', 'High'],
  ['No data breach has occurred', 'Medium'],
  ['There is no evidence of a security breach', 'Medium'],
  ['What if the production server is down?', 'Medium'],
  ['The production server was down yesterday', 'Medium'],
  ['Production server is down was the old alert; it was resolved yesterday.', 'Medium'],
  ['There was a data breach last week', 'Medium'],
  ['The service is not down', 'Medium'],
  ['The outage is resolved, but checkout is down', 'High'],
  ['Download the invoice', 'Medium'],
  ['The dropdown looks wrong', 'Medium'],
  ['URGENT!!!!!', 'Medium'],
  ['Help', 'Medium'],
  ['', 'Medium'],
  [null, 'Medium']
]
for (const [message, expected] of cases) {
  test(`${JSON.stringify(message)} receives ${expected} urgency`, () => {
    assert.equal(calculateUrgency(message), expected)
    assert.ok(assessUrgency(message).reason.length > 0)
  })
}

test('Tone, length and punctuation do not downgrade the same outage', () => {
  for (const message of ['Server down', 'SERVER DOWN', 'Server down!!!!!', 'Please, server down?', 'We love your service, but the server is down. Thank you for helping us.']) {
    assert.equal(calculateUrgency(message), 'High', message)
  }
})

test('Priority is identical on weekdays, weekends and outside business hours', (t) => {
  for (const now of [new Date('2026-09-29T14:00:00Z'), new Date('2026-09-27T03:00:00Z')]) {
    t.mock.timers.enable({ apis: ['Date'], now })
    assert.equal(calculateUrgency('Our production server is down'), 'High')
    assert.equal(calculateUrgency('Thank you!!!!!'), 'Low')
    t.mock.timers.reset()
  }
})

test('Critical incidents escalate even when categorization is wrong or unavailable', () => {
  for (const category of ['Technical Problem', 'Billing Issue', 'General Inquiry', 'Feature Request', 'Unknown', undefined]) {
    assert.match(getRecommendedAction(category, 'High'), /Escalate immediately/)
    assert.equal(shouldEscalate(category, 'High'), true)
  }
})

test('Routine feature requests go to product, never billing', () => {
  assert.match(getRecommendedAction('Feature Request', 'Low'), /product feedback/)
  assert.doesNotMatch(getRecommendedAction('Feature Request', 'Low'), /billing/)
  assert.equal(shouldEscalate('Feature Request', 'Low'), false)
})

test('Unknown categories require human triage and long routine requests do not escalate', () => {
  assert.match(getRecommendedAction('unexpected category', 'Medium'), /human triage/)
  assert.equal(shouldEscalate('Unknown', 'Medium'), true)
  assert.equal(shouldEscalate('unexpected category', 'Low'), true)
  assert.equal(shouldEscalate('General Inquiry', 'Low', 'Thanks! '.repeat(50)), false)
})
