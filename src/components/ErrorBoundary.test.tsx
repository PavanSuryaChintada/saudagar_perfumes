import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import ErrorBoundary, { isStaleBundleError } from './ErrorBoundary';

function Boom({ message }: { message: string }): never {
  throw new Error(message);
}

describe('ErrorBoundary', () => {
  afterEach(() => {
    vi.restoreAllMocks();
    sessionStorage.clear();
  });

  it('shows a calm message with a way out instead of a blank page', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom message="cannot read properties of undefined" />
      </ErrorBoundary>,
    );
    expect(screen.getByRole('heading', { name: /something went wrong/i })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /reload/i })).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /home/i })).toHaveAttribute('href', '/');
  });

  it('shows the page normally when nothing breaks', () => {
    render(
      <ErrorBoundary>
        <p>All good</p>
      </ErrorBoundary>,
    );
    expect(screen.getByText('All good')).toBeInTheDocument();
  });

  it('spots the error a browser gives when an old tab asks for files replaced by a new release', () => {
    expect(isStaleBundleError(new Error('Failed to fetch dynamically imported module: https://x/assets/AdminApp-abc.js'))).toBe(true);
    expect(isStaleBundleError(new Error('Importing a module script failed.'))).toBe(true);
    expect(isStaleBundleError(new Error('Cannot read properties of undefined'))).toBe(false);
  });
});
