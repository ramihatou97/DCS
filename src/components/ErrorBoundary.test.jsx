import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import ErrorBoundary from './ErrorBoundary';

describe('ErrorBoundary', () => {
  test('renders fallback UI when an error is thrown', () => {
    // Suppress console.error for this test since we're intentionally throwing an error
    const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});

    const FailingComponent = () => {
      throw new Error('Test error');
    };

    render(
      <ErrorBoundary>
        <FailingComponent />
      </ErrorBoundary>
    );

    expect(screen.getByText(/something went wrong/i)).toBeInTheDocument();

    // Restore console.error
    consoleErrorSpy.mockRestore();
  });

  test('renders children when no error is thrown', () => {
    render(
      <ErrorBoundary>
        <div>Child Component</div>
      </ErrorBoundary>
    );

    expect(screen.getByText(/child component/i)).toBeInTheDocument();
  });
});