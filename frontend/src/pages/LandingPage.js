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
    <div className="flex w-full flex-1 flex-col gap-14 text-emerald-900">
      <section className="grid gap-10 rounded-[2rem] bg-white/90 p-6 shadow-lg shadow-emerald-900/10 backdrop-blur sm:p-8 md:grid-cols-[1.05fr_1fr] md:gap-12 md:border md:border-emerald-100 md:bg-white/80 md:p-12 md:shadow-xl">
        <div className="space-y-6 sm:space-y-8">
          <div
            className={`inline-flex items-center gap-2 rounded-full border border-emerald-200/70 bg-white/80 px-4 py-2 shadow-sm shadow-emerald-900/5 ${bodySmallStrongTextClasses} text-emerald-700`}
          >
            🌿 Grow whole
          </div>
          <h1 className={`${displayTextClasses} text-emerald-950`}>
            Grow whole, not in fragments.
          </h1>
          <p className={`${leadTextClasses} text-emerald-900/80`}>
            Aleya weaves journaling, mentorship, and gentle accountability so you can
            notice your emotions, nurture your habits, and share progress with the guides
            who support you.
          </p>
          <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:gap-4">
            <Link
              className={`${primaryButtonClasses} w-full justify-center px-6 py-3 text-base sm:w-auto`}
              to="/register"
            >
              Start journaling
            </Link>
            <Link
              className={`${secondaryButtonClasses} w-full justify-center px-6 py-3 text-base sm:w-auto`}
              to="/login"
            >
              I already have an account
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          <div className="overflow-hidden rounded-[1.75rem] shadow-lg shadow-emerald-900/10 md:border md:border-emerald-200">
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

      <section className="grid gap-5 sm:grid-cols-2 md:grid-cols-3">
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

      <section className="rounded-[2rem] bg-emerald-600 p-6 text-white shadow-xl shadow-emerald-900/20 sm:p-8 md:p-12">
        <h2 className={`${largeHeadingClasses} tracking-tight`}>
          Your day is a living ecosystem.
        </h2>
        <p className={`mt-4 ${leadTextClasses} text-white/90`}>
          Aleya keeps the ecosystem connected—so when you tend to sleep, learning,
          relationships, and creative sparks, you can see the whole tree flourish.
        </p>
      </section>
    </div>
  );
}

function FeatureCard({ title, description }) {
  return (
    <article className="flex flex-col gap-3 rounded-2xl bg-white/80 p-5 shadow-sm shadow-emerald-900/10 backdrop-blur sm:gap-4 sm:rounded-3xl sm:p-6 md:border md:border-emerald-100 md:shadow-inner">
      <h2 className={`${smallHeadingClasses} text-emerald-900`}>{title}</h2>
      <p className={`${bodySmallMutedTextClasses} text-emerald-900/70`}>{description}</p>
    </article>
  );
}

function TreeLayer({ title, description, className }) {
  return (
    <div className={`space-y-2 px-5 py-5 sm:px-6 sm:py-6 ${className}`}>
      <span className={`${captionTextClasses} text-white/80`}>{title}</span>
      <p className={`${bodySmallTextClasses} text-white/90`}>{description}</p>
    </div>
  );
}

export default LandingPage;
