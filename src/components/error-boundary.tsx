'use client';

import * as React from 'react';
import { AlertTriangle, RefreshCcw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { reportError } from '@/lib/error-reporter';
import { getFirebaseClient } from '@/firebase/client';

interface State {
  hasError: boolean;
  message?: string;
}

interface Props {
  children: React.ReactNode;
}

export class ErrorBoundary extends React.Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, message: error.message };
  }

  componentDidCatch(error: Error) {
    try {
      const { db } = getFirebaseClient();
      reportError('boundary', error, { db });
    } catch {
      /* Si Firebase n'est pas dispo, on ne peut rien faire. */
    }
  }

  private handleReset = () => {
    this.setState({ hasError: false, message: undefined });
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <div role="alert" aria-live="assertive" className="flex items-center justify-center min-h-[60vh] p-4">
        <Card className="max-w-lg w-full">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="rounded-full bg-destructive/10 p-2">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
              <div>
                <CardTitle>Une erreur est survenue</CardTitle>
                <CardDescription>L'équipe a été notifiée automatiquement.</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            {this.state.message && (
              <pre className="rounded-md bg-muted p-3 text-xs whitespace-pre-wrap break-words">
                {this.state.message}
              </pre>
            )}
            <div className="flex gap-2">
              <Button onClick={this.handleReset}>
                <RefreshCcw className="h-4 w-4" />
                Réessayer
              </Button>
              <Button variant="outline" onClick={() => (window.location.href = '/')}>
                Retour à l'accueil
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
}
