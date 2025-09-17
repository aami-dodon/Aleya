import { Link } from "react-router-dom";
import {
  bodySmallMutedTextClasses,
  bodySmallStrongTextClasses,
  bodySmallTextClasses,
  captionTextClasses,
  displayTextClasses,
  largeHeadingClasses,
  leadTextClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
  smallHeadingClasses,
} from "../styles/ui";

function LandingPage() {
  return (
    <div className="flex w-full flex-1 flex-col gap-12 text-emerald-900">
      <section className="grid gap-10 rounded-3xl border border-emerald-100 bg-white/80 p-10 shadow-xl shadow-emerald-900/10 backdrop-blur md:grid-cols-[1.1fr_1fr]">
        <div className="space-y-6">
          <div
            className={`inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-white/80 px-4 py-2 shadow-sm shadow-emerald-900/5 ${bodySmallStrongTextClasses} text-emerald-700`}
          >
            🌿 Grow whole
          </div>
          <h1 className={`${displayTextClasses} text-emerald-950`}>
            Grow whole, not in fragments.
          </h1>
          <p className={`${leadTextClasses} text-emerald-900/80`}>
            Aleya weaves journaling, mentorship, and gentle accountability so you can
            notice your emotions, nurture your habits, and share progress with the
            guides who support you.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              className={`${primaryButtonClasses} px-6 py-3 text-base`}
              to="/register"
            >
              Start journaling
            </Link>
            <Link
              className={`${secondaryButtonClasses} px-6 py-3 text-base`}
              to="/login"
            >
              I already have an account
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-emerald-200 text-white shadow-lg shadow-emerald-900/10">
            <div className="grid text-left">
              <TreeLayer
                title="Roots · Self-care"
                description="Food, movement, and rest sustain growth."
                className="bg-emerald-900"
              />
              <TreeLayer
                title="Trunk · Purpose"
                description="Strength comes from purpose, simplicity, and stability."
                className="bg-emerald-700"
              />
              <TreeLayer
                title="Branches · Learning & Relationships"
                description="Growth means reaching, learning, and connecting."
                className="bg-teal-600"
              />
              <TreeLayer
                title="Fruit · Creative Expression"
                description="Creativity and legacy are the gifts we leave behind."
                className="bg-amber-600"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <FeatureCard
          title="Journalers"
          description="Build a meaningful check-in ritual, track your mood, and celebrate streaks with visual dashboards."
        />
        <FeatureCard
          title="Mentors"
          description="Receive summaries when mentees share entries, assign tailored prompts, and spot low-mood patterns quickly."
        />
        <FeatureCard
          title="Administrators"
          description="Configure journeys, manage forms, and steward a secure space where wellbeing data stays protected."
        />
      </section>

      <section className="rounded-3xl bg-emerald-600 px-8 py-10 text-white shadow-xl shadow-emerald-900/20">
        <h2 className={`${largeHeadingClasses} tracking-tight`}>
          Your day is a living ecosystem.
        </h2>
        <p className={`mt-4 ${leadTextClasses} text-white/80`}>
          Aleya keeps the ecosystem connected—so when you tend to sleep, learning,
          relationships, and creative sparks, you can see the whole tree flourish.
        </p>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <article className="rounded-3xl border border-emerald-100 bg-white/70 p-6 shadow-inner shadow-emerald-900/5">
      <h2 className={`${smallHeadingClasses} text-emerald-900`}>{title}</h2>
      <p className={`mt-3 ${bodySmallMutedTextClasses} text-emerald-900/70`}>{description}</p>
    </article>
  );
}

function TreeLayer({ title, description, className }) {
  return (
    <div className={`space-y-2 px-6 py-5 ${className}`}>
      <span className={`${captionTextClasses} text-white/80`}>
        {title}
      </span>
      <p className={`${bodySmallTextClasses} leading-relaxed text-white/80`}>{description}</p>
    </div>
  );
}

export default LandingPage;
