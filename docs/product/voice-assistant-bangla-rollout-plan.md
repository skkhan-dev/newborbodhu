# Borbodhu Voice Assistant Rollout Plan

## Goal

Ship a real Borbodhu voice assistant that works inside the dashboard, supports English and Bangla, answers live data questions, and performs safe role-aware actions with explicit confirmation.

## Scope Of This Release

This release is the first assistant beta milestone for Borbodhu. It is designed to be useful now, while keeping the action layer safe and auditable.

### Included In This Milestone

- dashboard assistant panel with text input and microphone input
- optional spoken replies with text-to-speech
- driving mode for shorter spoken responses
- role-aware answers for:
  - member
  - admin
  - super admin
  - ghotok
  - vendor
- confirmation-gated actions for:
  - resend verification
  - create direct conversation
  - send direct message
  - shortlist vendor
  - create saved search
  - create wedding project
  - add wedding guest
  - submit profile for review
  - send interest
  - add favorite
  - block member
  - unlock contact
  - request photo access
  - approve or reject profile
  - approve or reject manual payment
  - approve or reject pending photo
  - update vendor lead status
- assistant audit logging for confirmed actions
- choice-based disambiguation for:
  - members
  - vendors
  - wedding projects
  - profiles
  - pending photos
  - vendor leads
- conversational follow-ups:
  - yes
  - confirm
  - do it
  - first / second / third
  - repeat
  - show me more
  - cancel
- pronoun-based follow-up messaging:
  - `message them that ...`
  - `tell her ...`

## Bangla Support In This Release

This milestone adds the first Bangla-aware assistant layer.

### Included

- Bangla dashboard assistant UI labels
- Bangla placeholder, buttons, driving-mode hints, and session labels
- Bangla locale passed from dashboard to assistant API
- Bangla speech recognition mode on the assistant mic
- Bangla intent normalization for common assistant requests
- Bangla-friendly action triggers for common commands like:
  - message
  - unread inbox
  - membership
  - wedding
  - vendor
  - review
  - approve
  - reject
  - photo
  - guest
  - saved search
  - contact unlock
- Bangla localization for common assistant suggestions and confirmation labels

### Not Fully Complete Yet

- full Bangla translation coverage for every assistant response sentence
- full Bangla semantic understanding for every edge-case phrasing
- Bangla voice output tuning for longer answers

## What Is Already Proven Before Deploy

- API typecheck passes
- web production build passes
- assistant action flow is wired to real services, not placeholders
- confirmation gates are in place for mutating actions
- audit log entries are created for confirmed assistant actions

## Recommended Live Validation After Deploy

### Member

- ask in English:
  - `What needs my attention today?`
  - `How many unread messages do I have?`
  - `Message Rahim that I will reply tonight`
- ask in Bangla:
  - `আজ আমার কী বিষয়ে মনোযোগ দেওয়া দরকার?`
  - `আমার কতটি অপঠিত মেসেজ আছে?`
  - `রাহিমকে মেসেজ দিন যে আমি রাতে উত্তর দেব`

### Admin

- `How many profiles are pending review?`
- `Approve photo for [display name]`
- `How many manual payments need review?`

### Vendor

- `How many leads do I have?`
- `Mark the lead from [requester] as responded`

### Ghotok

- `How many members am I managing?`
- `What is my wallet balance?`

## Future Improvements

### Phase 2

- broader Bangla response localization across all assistant answers
- richer long-session memory beyond only the last response
- better entity disambiguation by city, display ID, and project title
- more natural follow-ups like:
  - `the Baywood one`
  - `the Dhaka profile`
  - `the second vendor`

### Phase 3

- mailbox thread reply summarization before send
- richer saved-search extraction
- richer wedding project updates:
  - date
  - city
  - budget
  - guest targets
- vendor lead note updates
- more admin workflows:
  - user status actions
  - queue search
  - audit search

### Phase 4

- full cross-module semantic search
- hands-free driving-first flow with stronger voice confirmations
- proactive assistant briefings
- mobile app assistant parity

## Deployment Recommendation

Ship this as:

- `Voice Assistant Beta`

Reason:

- it is already useful
- it already takes real safe actions
- the confirmation and audit model is in place
- Bangla support has started in a real way
- future improvements are clear and additive, not blockers
