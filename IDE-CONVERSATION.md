# IDE conversation — Week 8 assessment

Exported November 16, 2026 during submission preparation. User and assistant messages are copied verbatim; tool calls and hidden reasoning are omitted. The final delivery message occurs after this export.

## User

**Week 8 Assessment — Technical**

You've been tasked to work on an existing AI-powered customer support triage tool. Your job: identify areas for improvement, propose solutions, and implement at least one.

**The company**: Relay AI is a subscription-based customer operations platform that uses AI to categorize, prioritize, and route incoming customer messages for small businesses. Its SaaS model is built around boosting team efficiency and enabling companies to handle more customer volume without hiring additional support staff.

**The product:** Customer Inbox Triage ([https://github.com/jimenezatmit/l2assessment](https://github.com/jimenezatmit/l2assessment)). A small web app that uses an LLM to categorize and route customer support messages.

**Your task:**

1. Fork, clone, and run the project in your IDE of choice
2. Test the app with multiple customer messages
3. Identify the top 3 areas for improvement
4. Think through the most important improvements that would address these issues
5. Implement at least one improvement that you think will make the biggest difference for Relay AI
6. Test your changes with new examples
7. Push your changes back to Github

**Deliverables:** Updated GitHub repo link + full IDE conversation copy-pasted


## Assistant

I’ll inspect the project, test its triage behavior, and implement the highest-impact improvement. I’ll also capture the findings and test results for your assessment submission.


## Assistant

The code points to three major issues: urgency depends on message length and punctuation, classification uses unreliable keyword matching and hides API failures, and the API key is exposed in the browser.

I’m focusing on urgency and escalation: a short production outage should take priority, while enthusiastic feedback should stay low priority. The recommendation also needs to direct urgent incidents to a person who can act.


## Assistant

Your GitHub account already has a fork with merged assessment improvements for urgency, escalation, classification, and human review. I’ll verify that work and check the deliverables before making further changes.


## Assistant

The existing suite passes all 62 tests. I found one remaining gap: “Database connection lost” still receives Medium priority. I added database outage detection and eight regression cases covering live incidents, historical reports, hypotheticals, and routine setup questions. All 70 tests pass, and the app builds successfully.


## Assistant

I’m using the verification skill to check the browser flow: submit a message, inspect priority and escalation, then confirm it appears in History. This checkout has no Groq key, so I can verify the explicit “AI unavailable / human review” path; live classification remains unverified in this run.


## Assistant

Browser testing confirms the change: the database outage receives High priority and immediate escalation, yesterday’s failure receives Medium, and enthusiastic feedback receives Low. All three results persist after reloading History. I’ll add these results to the assessment report, export the conversation, and push the submission branch.

