import Link from "next/link";

import { parityModules, parityScenarios } from "@/lib/site-data";

export default function ParityPlanPage() {
  return (
    <main className="page-shell">
      <header className="persona-hero">
        <div>
          <p className="section-kicker">Functional parity QA</p>
          <h1>How the new Borbodhu build will be validated against the live platform.</h1>
          <p className="hero-copy">
            The redesign cannot drift away from the business-critical behavior already running on Borbodhu.com. This route summarizes the parity testing plan that will guide implementation and QA.
          </p>
        </div>
        <div className="top-actions">
          <Link href="/" className="button button-soft">
            Back to overview
          </Link>
          <Link href="/persona-flows" className="button button-primary">
            Review persona flows
          </Link>
        </div>
      </header>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Parity modules</p>
            <h2>Feature families that must stay aligned with the live site.</h2>
          </div>
          <p>
            These areas define whether the new system is ready to replace the legacy Borbodhu stack without losing core member, admin, Ghotok, vendor, or wedding functionality.
          </p>
        </div>
        <div className="question-grid">
          {parityModules.map((module) => (
            <article key={module} className="question-card">
              <p>{module}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="section-block">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Test cycles</p>
            <h2>Each delivery slice will be measured through these scenario families.</h2>
          </div>
          <p>
            We will use the live site as the baseline and mark every difference as either a bug, a parity gap, or an intentional product improvement.
          </p>
        </div>
        <div className="actor-grid">
          {parityScenarios.map((scenario) => (
            <article key={scenario.title} className="actor-card">
              <span className="actor-badge">{scenario.title}</span>
              <h3>{scenario.title}</h3>
              <ul className="feature-list">
                {scenario.items.map((item) => (
                  <li key={item}>{item}</li>
                ))}
              </ul>
            </article>
          ))}
        </div>
      </section>

      <section className="cta-banner">
        <div>
          <p className="section-kicker">Next backend slice</p>
          <h2>Auth, roles, and schema will be built with parity gates from day one.</h2>
          <p>
            The next implementation step is to create the backend foundation and tie each module to the parity matrix so replacements can be verified continuously instead of at the end.
          </p>
        </div>
        <Link href="/" className="button button-primary">
          Return to foundation
        </Link>
      </section>
    </main>
  );
}
