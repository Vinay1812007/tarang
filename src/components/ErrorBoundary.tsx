import { Component, type ReactNode } from 'react';
import { Link, useRouteError } from 'react-router-dom';

interface Props {
  children: ReactNode;
}

interface State {
  error: Error | null;
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { error: null };

  static getDerivedStateFromError(error: Error): State {
    return { error };
  }

  componentDidCatch(error: Error): void {
    if (import.meta.env.DEV) console.error('[vinax:boundary]', error);
  }

  render() {
    if (this.state.error) {
      return (
        <div className="flex flex-col items-center justify-center py-24 text-center gap-4">
          <p className="text-2xl font-semibold">Something hit a wrong note</p>
          <p className="text-ink-300 max-w-md">
            A part of this page failed to render. Your music and data are safe.
          </p>
          <button
            onClick={() => this.setState({ error: null })}
            className="px-5 py-2.5 rounded-full bg-ember-500 text-ink-950 font-semibold hover:bg-ember-400"
          >
            Try again
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

/** Router-level error element. */
export function RouteError() {
  const error = useRouteError();
  if (import.meta.env.DEV) console.error('[vinax:route]', error);
  return (
    <div className="h-dvh flex flex-col items-center justify-center gap-4 bg-ink-900 text-ink-100">
      <p className="text-3xl font-bold">Off the beat</p>
      <p className="text-ink-300">This page failed to load.</p>
      <Link to="/" className="px-5 py-2.5 rounded-full bg-ember-500 text-ink-950 font-semibold">
        Back to Home
      </Link>
    </div>
  );
}
