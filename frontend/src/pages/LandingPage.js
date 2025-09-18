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
            🌿 Luminous practice
          </div>
          <h1 className={`${displayTextClasses} text-emerald-950`}>
            Let your inner canopy breathe in one rhythm.
          </h1>
          <p className={`${leadTextClasses} text-emerald-900/80`}>
            Aleya braids reflection, companionship, and gentle accountability so each
            note of care, habit, and rest can bloom together beneath a steady light.
          </p>
          <div className="flex flex-wrap gap-4">
            <Link
              className={`${primaryButtonClasses} px-6 py-3 text-base`}
              to="/register"
            >
              Begin your Aleya journal
            </Link>
            <Link
              className={`${secondaryButtonClasses} px-6 py-3 text-base`}
              to="/login"
            >
              Return to my Aleya grove
            </Link>
          </div>
        </div>
        <div className="space-y-4">
          <div className="overflow-hidden rounded-3xl border border-emerald-200 text-white shadow-lg shadow-emerald-900/10">
            <div className="grid text-left">
              <TreeLayer
                title="Roots · Self-tending"
                description="Nourish your soil with rest, movement, and sustenance."
                className="bg-emerald-900"
              />
              <TreeLayer
                title="Trunk · Steady purpose"
                description="Anchor into clarity, simplicity, and the strength to stay."
                className="bg-emerald-700"
              />
              <TreeLayer
                title="Branches · Learning & kinship"
                description="Reach outward to learn, listen, and weave resilient bonds."
                className="bg-teal-600"
              />
              <TreeLayer
                title="Fruit · Creative offering"
                description="Share the stories and legacies that ripen from your tending."
                className="bg-amber-600"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="grid gap-6 md:grid-cols-3">
        <FeatureCard
          title="Journalers"
          description="Craft a ritual of arrival, trace your moods like constellations, and celebrate the rings of practice you grow."
        />
        <FeatureCard
          title="Mentors"
          description="Receive gentle digests when mentees share, offer bespoke prompts, and notice when their light softens."
        />
        <FeatureCard
          title="Administrators"
          description="Shape guided journeys, tend the form library, and protect the sanctuary where every reflection is held."
        />
      </section>

      <section className="rounded-3xl bg-emerald-600 px-8 py-10 text-white shadow-xl shadow-emerald-900/20">
        <h2 className={`${largeHeadingClasses} tracking-tight`}>
          Each day is a breathing grove.
        </h2>
        <p className={`mt-4 ${leadTextClasses} text-white/80`}>
          Aleya keeps every rootline connected—so when you tend sleep, learning,
          kinship, and creative sparks, you witness the whole canopy awaken.
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
