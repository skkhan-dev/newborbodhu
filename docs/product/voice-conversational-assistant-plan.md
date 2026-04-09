# Voice Conversational Assistant Plan

## Goal

Build a voice-first assistant that works from the signed-in Borbodhu dashboard and can:

- answer account and workflow questions
- search across key modules
- guide the user through next steps
- grow into an action-taking assistant with confirmation gates

The user experience should feel like a single "Ask AI" command bar with voice input, not a buried help page.

## Product direction

The assistant should be available in the main dashboard shell and support both:

- text input
- speech-to-text input

Responses should be concise first, then expandable with bullets and follow-up suggestions. For hands-free use, the assistant should optionally read answers aloud.

## Phase 1: Reliable retrieval

Ship a tool-backed assistant that answers high-value questions safely and consistently.

### Member questions

- What needs my attention today?
- How complete is my profile?
- How many unread messages do I have?
- What is my membership status?
- How many saved searches do I have?
- What is the status of my wedding plan?

### Admin questions

- How many profiles are pending review?
- How many manual payments need review?
- What needs attention today?

### Ghotok questions

- How many members am I managing?
- What is my wallet balance?
- What needs attention today?

### Super Admin / Admin follow-up

- show summary counts for platform moderation and payment review

## Phase 2: Search and explanation

Expand the assistant to search:

- mailbox conversations
- saved searches
- profile review queues
- wedding vendors and guest lists

The assistant should explain why it answered something, not just output a number.

## Phase 3: Safe actions

Add confirmation-gated actions such as:

- resend verification email
- open a direct conversation
- save or update a search
- review a manual payment
- approve or reject a profile
- create a wedding project or shortlist a vendor

## Phase 4: True voice copilot

Add richer voice workflows:

- hands-free mode
- spoken clarifications
- voice confirmations for sensitive actions
- session memory for follow-up questions

## Architecture

### 1. Dashboard assistant panel

- visible near the top of the signed-in dashboard
- one input
- one mic button
- one "speak replies" toggle
- reusable follow-up suggestion buttons

### 2. Assistant API

A dedicated authenticated endpoint should:

- inspect the user's role
- classify the request into a supported tool/query
- return a structured answer

Initial endpoint:

- `POST /assistant/query`

### 3. Tool-backed service layer

Do not start with a free-form LLM-only assistant.

Phase 1 should use reliable Prisma-backed tools for:

- member dashboard overview
- mailbox unread summary
- membership summary
- saved-search summary
- wedding summary
- admin moderation summary
- ghotok workload summary

### 4. Safety model

- retrieval is safe by default
- actions later require confirmation
- every assistant action should be logged once mutations are added

## UX rules

- short answer first
- bullets for details
- suggestions for next questions
- voice input should degrade gracefully if browser speech APIs are unavailable
- spoken replies should be optional

## Differentiation

This assistant stands out if it becomes an actual workflow operator rather than a static FAQ:

- role-aware
- module-aware
- voice-enabled
- capable of growing into action-taking flows with confirmations

## Phase 1 implementation scope

- add roadmap doc
- add assistant API module
- add dashboard assistant panel
- support voice input
- support spoken replies
- ship role-aware summaries and attention queries
