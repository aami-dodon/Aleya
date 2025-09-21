import { loadingStateClasses, loadingStateFullClasses } from "../styles/ui";

function LoadingState({ label = "Gathering the morning light", compact = false }) {
  const containerClasses = compact
    ? loadingStateClasses
    : `${loadingStateClasses} ${loadingStateFullClasses}`;

  return <div className={containerClasses}>{label}…</div>;
}

export default LoadingState;
