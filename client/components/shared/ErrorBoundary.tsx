"use client";

import React from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

export class ErrorBoundary extends React.Component<
  ErrorBoundaryProps,
  ErrorBoundaryState
> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo) {
    // In production you'd send this to an error reporting service
    console.error("[ErrorBoundary]", error, info.componentStack);
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      if (this.props.fallback) return this.props.fallback;

      return (
        <div className="flex flex-col items-center justify-center h-full w-full p-8 text-center">
          <div className="w-16 h-16 rounded-2xl bg-destructive/10 flex items-center justify-center mb-5">
            <AlertTriangle className="w-7 h-7 text-destructive" />
          </div>
          <h2 className="font-heading text-lg font-bold text-foreground mb-2">
            Something went wrong
          </h2>
          <p className="text-sm text-muted-foreground max-w-xs leading-relaxed mb-6">
            An unexpected error occurred. You can try refreshing this section or
            reload the page.
          </p>
          <div className="flex gap-2">
            <Button
              onClick={this.handleReset}
              className="
                h-9 px-5 rounded-full
                bg-brand-primary hover:bg-brand-secondary-container
                text-on-primary text-sm font-medium
                transition-smooth
              "
            >
              <RefreshCw className="w-3.5 h-3.5 mr-1.5" />
              Try again
            </Button>
            <Button
              variant="ghost"
              onClick={() => window.location.reload()}
              className="
                h-9 px-5 rounded-full
                text-sm text-muted-foreground
                hover:bg-surface-container-low
                transition-smooth
              "
            >
              Reload page
            </Button>
          </div>
          {/* Dev-only error details */}
          {process.env.NODE_ENV === "development" && this.state.error && (
            <pre className="mt-6 text-left text-[10px] text-destructive bg-destructive/5 rounded-xl p-4 max-w-sm overflow-auto w-full">
              {this.state.error.message}
            </pre>
          )}
        </div>
      );
    }

    return this.props.children;
  }
}
