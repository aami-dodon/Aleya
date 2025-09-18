import { Component } from "react";
import {
  bodySmallMutedTextClasses,
  bodyTextClasses,
  largeHeadingClasses,
  primaryButtonClasses,
  secondaryButtonClasses,
} from "../styles/ui";

function buildWindowContext(event) {
  if (!event) {
    return null;
  }

  const details = [];
  if (event.filename) {
    const position = [event.lineno, event.colno]
      .filter((value) => Number.isFinite(value))
      .join(":");
    details.push(`Source: ${event.filename}${position ? `:${position}` : ""}`);
  }

  if (event.reason && typeof event.reason === "string") {
    details.push(`Reason: ${event.reason}`);
  }

  if (event.message) {
    details.push(`Message: ${event.message}`);
  }

  return details.length ? details.join("\n") : null;
}

class GlobalErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    };
  }

  static getDerivedStateFromError(error) {
    return {
      hasError: true,
      error,
      errorInfo: null,
      showDetails: false,
    };
  }

  componentDidCatch(error, info) {
    this.setState({
      errorInfo: info?.componentStack || null,
    });
    this.reportError(error, {
      source: "react",
      componentStack: info?.componentStack,
    });
  }

  componentDidMount() {
    window.addEventListener("error", this.handleWindowError);
    window.addEventListener("unhandledrejection", this.handleUnhandledRejection);
  }

  componentWillUnmount() {
    window.removeEventListener("error", this.handleWindowError);
    window.removeEventListener(
      "unhandledrejection",
      this.handleUnhandledRejection
    );
  }

  handleWindowError = (event) => {
    const error = event?.error || new Error(event?.message || "Unexpected error");
    const errorInfo = buildWindowContext(event);

    this.setState({
      hasError: true,
      error,
      errorInfo,
      showDetails: false,
    });

    this.reportError(error, {
      source: "window.error",
      context: errorInfo,
    });
  };

  handleUnhandledRejection = (event) => {
    const reason = event?.reason;
    const error =
      reason instanceof Error
        ? reason
        : new Error(
            typeof reason === "string"
              ? reason
              : "Unhandled promise rejection"
          );

    const errorInfo = buildWindowContext(event);

    this.setState({
      hasError: true,
      error,
      errorInfo,
      showDetails: false,
    });

    this.reportError(error, {
      source: "window.unhandledrejection",
      context: errorInfo,
    });
  };

  reportError(error, metadata) {
    if (process.env.NODE_ENV !== "test") {
      // eslint-disable-next-line no-console
      console.error("Global error captured", error, metadata);
    }

    if (typeof this.props.onError === "function") {
      this.props.onError(error, metadata);
    }
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      showDetails: false,
    });

    if (typeof this.props.onReset === "function") {
      this.props.onReset();
    }
  };

  handleReload = () => {
    if (typeof window !== "undefined") {
      window.location.assign(window.location.origin);
    }
  };

  toggleDetails = () => {
    this.setState((previous) => ({
      showDetails: !previous.showDetails,
    }));
  };

  render() {
    if (!this.state.hasError) {
      return this.props.children;
    }

    const { error, errorInfo, showDetails } = this.state;
    const detailContent = error?.stack || errorInfo || "";

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-emerald-100 px-6 py-16">
        <div className="w-full max-w-xl rounded-3xl border border-emerald-200/70 bg-white/80 p-10 text-center shadow-lg shadow-emerald-200/50 backdrop-blur">
          <h1 className={`${largeHeadingClasses} text-emerald-900`}>We wandered into a thicket.</h1>
          <p className={`${bodyTextClasses} mt-4 text-emerald-900/80`}>
            Something unexpected rustled the canopy. We have safely paused the experience
            so you can choose how to continue.
          </p>
          <div className="mt-8 flex flex-wrap justify-center gap-3">
            <button
              type="button"
              className={`${primaryButtonClasses} px-6 py-2.5`}
              onClick={this.handleReset}
            >
              Try again
            </button>
            <button
              type="button"
              className={`${secondaryButtonClasses} px-6 py-2.5`}
              onClick={this.handleReload}
            >
              Return to the clearing
            </button>
          </div>
          {detailContent ? (
            <div className="mt-8 text-left">
              <button
                type="button"
                className={`${bodyTextClasses} underline-offset-4 transition hover:underline`}
                onClick={this.toggleDetails}
              >
                {showDetails ? "Hide technical whispers" : "Show technical whispers"}
              </button>
              {showDetails ? (
                <pre
                  className={`${bodySmallMutedTextClasses} mt-4 max-h-48 overflow-auto rounded-2xl bg-emerald-50/80 p-4 text-sm leading-relaxed`}
                >
                  {detailContent}
                </pre>
              ) : null}
            </div>
          ) : null}
          <p className={`${bodySmallMutedTextClasses} mt-8`}>
            If the path keeps closing, please share these details with the Aleya team so we can guide the light back home.
          </p>
        </div>
      </div>
    );
  }
}

export default GlobalErrorBoundary;
