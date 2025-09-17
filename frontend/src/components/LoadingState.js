function LoadingState({ label = "Loading" }) {
  return (
    <div className="flex min-h-[40vh] items-center justify-center text-sm font-medium text-emerald-900/70">
      {label}…
    </div>
  );
}

export default LoadingState;
