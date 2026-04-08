import Link from "next/link";

import { personaFlows, reviewQuestions } from "@/lib/site-data";

export default function PersonaFlowsPage() {
  return (
    <main className="page-shell">
      <header className="persona-hero">
        <div>
          <p className="section-kicker">Mobile-first screen review</p>
          <h1>Persona flow board for the new Borbodhu experience.</h1>
          <p className="hero-copy">
            These are the implementation-ready UI flows that sit in front of backend work. Each section focuses on one persona and the minimum screens we need to validate before API contracts are fixed.
          </p>
        </div>
        <div className="top-actions">
          <Link href="/" className="button button-soft">
            Back to overview
          </Link>
          <a href="/prototype/mobile-persona-flows.html" className="button button-primary">
            Open detailed prototype
          </a>
        </div>
      </header>

      {personaFlows.map((flow) => (
        <section id={flow.id} key={flow.id} className={`persona-section accent-${flow.accent}`}>
          <div className="section-heading">
            <div>
              <p className="section-kicker">{flow.name}</p>
              <h2>{flow.name} mobile flow</h2>
            </div>
            <p>{flow.summary}</p>
          </div>
          <div className="screen-grid">
            {flow.screens.map((screen) => (
              <article key={screen.id} className="screen-card">
                <div className="screen-card-head">
                  <span className="screen-id">{screen.id}</span>
                  <span className="screen-pill">Mobile</span>
                </div>
                <h3>{screen.title}</h3>
                <ul className="screen-points">
                  {screen.details.map((detail) => (
                    <li key={detail}>{detail}</li>
                  ))}
                </ul>
              </article>
            ))}
          </div>
        </section>
      ))}

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Review prompts</p>
            <h2>Questions to resolve before backend contracts are frozen.</h2>
          </div>
          <p>
            This is the checkpoint between UX and backend implementation. Once these feel right, we can confidently map screens to models, permissions, APIs, and parity validation.
          </p>
        </div>
        <div className="question-grid">
          {reviewQuestions.map((question) => (
            <article key={question} className="question-card">
              <p>{question}</p>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
