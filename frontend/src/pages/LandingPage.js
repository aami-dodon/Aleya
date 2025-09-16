import { Link } from "react-router-dom";

function LandingPage() {
  return (
    <div className="landing">
      <section className="hero">
        <div className="hero-copy">
          <h1>Grow whole, not in fragments.</h1>
          <p>
            Aleya weaves journaling, mentorship, and gentle accountability so you can
            notice your emotions, nurture your habits, and share progress with the
            guides who support you.
          </p>
          <div className="hero-actions">
            <Link className="primary-button" to="/register">
              Start journaling
            </Link>
            <Link className="ghost-button" to="/login">
              I already have an account
            </Link>
          </div>
        </div>
        <div className="hero-illustration">
          <div className="tree">
            <div className="roots">
              <span className="tree-label">Roots · Self-care</span>
              <p className="tree-description">
                Food, movement, and balance sustain growth.
              </p>
            </div>
            <div className="trunk">
              <span className="tree-label">Trunk · Purpose</span>
              <p className="tree-description">
                Strength comes from purpose, simplicity, and stability.
              </p>
            </div>
            <div className="branches">
              <span className="tree-label">Branches · Learning &amp; Relationships</span>
              <p className="tree-description">
                Growth means reaching, learning, and connecting.
              </p>
            </div>
            <div className="fruit">
              <span className="tree-label">Fruit · Creative Expression</span>
              <p className="tree-description">
                Creativity and legacy are the gifts we leave behind.
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="feature-grid">
        <article>
          <h2>Journalers</h2>
          <p>
            Build a meaningful check-in ritual, track your mood, and celebrate
            streaks with visual dashboards.
          </p>
        </article>
        <article>
          <h2>Mentors</h2>
          <p>
            Receive summaries when mentees share entries, assign tailored prompts,
            and spot low-mood patterns quickly.
          </p>
        </article>
        <article>
          <h2>Administrators</h2>
          <p>
            Configure journeys, manage forms, and steward a secure space where
            wellbeing data stays protected.
          </p>
        </article>
      </section>

      <section className="callout">
        <h2>Your day is a living ecosystem.</h2>
        <p>
          Aleya keeps the ecosystem connected—so when you tend to sleep, learning,
          relationships, and creative sparks, you can see the whole tree flourish.
        </p>
      </section>
    </div>
  );
}

export default LandingPage;
