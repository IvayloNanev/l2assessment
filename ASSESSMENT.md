# Week 2 Technical Assessment — Relay AI

## Setup and scope

- Original: https://github.com/jimenezatmit/l2assessment
- Fork: https://github.com/IvayloNanev/l2assessment
- Baseline commit: `011d920`.
- Implementation branch: `codex/impact-based-triage`.
- Tested locally on September 29, 2026 with the dependencies from `package-lock.json`.
- Initial baseline tests ran without a valid key: HTTP 401 triggered the existing mock categorizer. After the user configured the key, Groq returned `model_not_found` for the original Llama model. The authenticated model list confirmed `openai/gpt-oss-20b` was available. The app now defaults to that model and supports `VITE_GROQ_MODEL` overrides. Eleven subsequent browser submissions received live model responses without new fallback warnings. Initial fallback results and live results are separated below.

## Top three areas for improvement

### 1. Prioritization and routing do not reflect customer impact — implemented

The baseline subtracts urgency for short messages, capitalization, polite words, questions, weekends and non-business hours, while adding 30 points per exclamation mark. It marks a short production outage Low and enthusiastic praise High. The UI also fails to pass urgency into the recommendation helper, which ignores it anyway. Feature requests are sent to a billing portal, technical failures receive a browser-restart suggestion, and the unused escalation helper relies on message length.

**Business impact:** serious incidents can wait behind routine messages, increasing customer downtime and manual triage work. Irrelevant recommendations create extra support exchanges.

**Solution:** prioritize concrete outage, blocked-workflow and security/data-impact signals; use Medium for unrecognized cases; reserve Low for recognized routine requests without problem language. Explain each priority and recommend immediate human incident review for High urgency, even when the category is wrong. Recommend the product queue for feature requests. These are recommendations only: the app has no actual ticket-assignment integration.

**Why first:** this directly addresses the product's triage promise, works independently of provider availability, adds no inference cost, and can be tested deterministically. It is a focused assessment improvement, not a claim of production readiness.

### 2. Classification and fallback behavior undermine trust — proposed

The app searches the entire model response for category keywords. A response discussing why something is *not* billing can still select Billing Issue. The prompt defines neither an allowed category list nor an output schema. On API errors, the app silently substitutes keyword matching with randomized explanations under an “AI Reasoning” label. In the browser, “all customers cannot log in” was categorized as General Inquiry; CSV export was also missed by the fallback.

**Business impact:** a confident-looking answer can hide an unavailable provider or a wrong queue, undermining both automation quality and reporting.

**Solution:** define categories in a system instruction, request structured JSON, validate against an allowlist, and separate customer text from instructions. Mark results as AI, fallback or manual review, preserve that status in History, and provide a visible retry state. Evaluate on a labeled, held-out set of realistic messages, including ambiguous and adversarial examples. Do not present synthetic fallback output as AI output.

### 3. API-key handling is unsafe for a hosted SaaS — proposed

`src/utils/llmHelper.js` creates a browser-side Groq client using `VITE_GROQ_API_KEY` and `dangerouslyAllowBrowser: true`. Vite embeds exposed variables in client assets. The upstream README explicitly restricts this design to local development.

**Business impact:** a deployed app can expose the shared provider credential, enabling unauthorized use and exhausting limits or budget.

**Solution:** put the provider call behind an authenticated backend, store the key only on the server, validate and limit requests, and avoid recording customer messages or credentials in logs. Keep the assessment app local until this is addressed. This submission does not claim to fix the key exposure.

## Implementation

- `src/utils/urgencyScorer.js`: deterministic impact rules, bounded handling of common negated/historical/hypothetical reports, conservative Medium fallback, and readable priority explanations. Preserves `calculateUrgency(message)` for existing consumers.
- `src/utils/templates.js`: relevant queue recommendations and High-priority escalation. Unknown categories require human triage; message length no longer drives escalation.
- `src/pages/AnalyzePage.jsx`: passes urgency to the recommendation helper, displays the priority explanation, includes it in copied results, and saves it with the analysis. Existing stored results are preserved. Labels the message input accessibly.
- `tests/triage.test.js`: 38 tests, including tone invariance, weekday/weekend invariance, incident signals, benign lookalike words, negation, normal support cases, and incorrect/missing categories.
- `src/utils/llmHelper.js` and `.env.example`: configurable model with an account-accessible default, plus removal of two unused variables. The original classification parser and mock fallback remain unchanged.
- `package.json`: adds `npm test` using Node's built-in test runner; no new dependencies.

## Observed before/after browser results

Categorization used the existing fallback in every row. Expected priorities reflect the stated policy, not independently labeled production data.

| Customer message | Before urgency | After urgency | Recommendation after change |
| --- | --- | --- | --- |
| Our production server is down | Low | High | Immediate incident review |
| Thank you for the wonderful service!!!!! | High | Low | Customer support |
| Could you please add dark mode? | Low | Low | Product feedback; previously billing portal |
| Please help, all customers cannot log in and our business is blocked. | Medium | High | Immediate incident review despite wrong fallback category |
| I was charged twice for my subscription. | Low | Medium | Billing support review |

## Fresh browser examples after implementation

These six messages were exercised through the running UI after the regression suite passed.

| Message | Observed urgency | Observed recommendation |
| --- | --- | --- |
| Please investigate: our website is unavailable. | High | Immediate incident review |
| Can you add CSV export? Thank you!!! | Low | Customer support; fallback still missed the feature category |
| Our payment system is offline. | High | Immediate incident review despite Billing Issue category |
| I need help understanding this invoice. | Medium | Billing support |
| Your team has been excellent!!!!!! | Low | Customer support |
| I cannot change my email address. | Medium | Customer support |

## Validation

- `npm test`: **38 passed, 0 failed**.
- `npm run build`: **passed**.
- ESLint on all changed JavaScript/JSX files and tests: **passed**.
- Full-project lint: baseline had six errors. One was fixed by using the recommendation helper's urgency parameter; the three remaining errors are pre-existing in HomePage, HistoryPage and DashboardPage. The two unused-variable errors in llmHelper were also removed while configuring the model. They are not hidden by disabling rules.
- Browser: home and analysis pages render; submitting five baseline examples reproduced the problems. Replayed all five after implementation and exercised the six fresh examples above.
- History persisted all 16 baseline/updated records after a reload; original records retain their original results.
- Live Groq boundary: **verified after configuration/model correction** through 11 browser submissions with model-specific responses and no new provider/fallback warnings. The initial Llama request failed with HTTP 404; the account model-list request returned HTTP 200. The mock fallback still lacks a visible source label when a provider call fails.
- Dependency installation reported 18 vulnerabilities in the existing dependency set. This change does not upgrade dependencies; dependency review remains follow-up work.

## Limits and next evaluation

These are bounded English-language rules, not semantic understanding. They can miss paraphrases, indirect or multilingual incident descriptions, and can misread complex negation or historical context across sentences. Medium is the review default, not a claim that the message is safe. No actual ticket is routed and no notification is sent. A production rollout needs a labeled customer-message corpus, human override, incident-recall and false-escalation measurements, and the backend/security work described above. No business outcome improvement has been measured on real users.

Live tests are recorded below. Expand this evaluation with independently labeled, held-out messages. Record category, urgency, recommendation and provider status separately; verify that successful model calls are not silently replaced by the mock. Compare incident recall, category accuracy and agent correction rate before considering automatic routing.

## Live AI follow-up (Groq, openai/gpt-oss-20b)

Groq's [supported-model documentation](https://console.groq.com/docs/models) lists this model, and the account's authenticated `/openai/v1/models` response confirmed availability. This is a provider-compatibility fix; it does not establish equivalence to the original Llama model. No valid live baseline using the original model was possible on this account.

| Message | App category from live response | Urgency | Recommendation |
| --- | --- | --- | --- |
| Our production server is down | Unknown | High | Immediate incident review |
| Thank you for the wonderful service!!!!! | Unknown | Low | Human triage |
| Could you please add dark mode? | Feature Request | Low | Product feedback |
| Please help, all customers cannot log in and our business is blocked. | Unknown | High | Immediate incident review |
| I was charged twice for my subscription. | Billing Issue | Medium | Billing support |
| Please investigate: our website is unavailable. | Unknown | High | Immediate incident review |
| Can you add CSV export? Thank you!!! | Feature Request | Low | Product feedback |
| Our payment system is offline. | Unknown | High | Immediate incident review |
| I need help understanding this invoice. | Billing Issue | Medium | Billing support |
| Your team has been excellent!!!!!! | Unknown | Low | Human triage |
| I cannot change my email address. | Unknown | Medium | Human triage |

The live model recognized outages but used free-text labels such as “Production Issue (Server outage)” and “Website Down / Service Outage,” which the original parser did not recognize. This directly supports improvement #2. The implemented High-urgency rule still recommended immediate escalation despite those Unknown categories. All eleven priority results matched the chosen policy; this small, selected test set is not a general accuracy estimate.

## Reproduce locally

Use Node.js 22.12+ (or a newer supported Node release).

```sh
npm ci
cp .env.example .env.local
# Set VITE_GROQ_API_KEY locally; never commit the key.
npm run dev
npm test
npm run build
npx eslint src/utils/urgencyScorer.js src/utils/templates.js src/pages/AnalyzePage.jsx tests/triage.test.js
```

Without a valid key, the current baseline architecture uses the mock fallback. The deterministic test suite does not need a key or make network requests. The API-key file and generated output are ignored by Git.
