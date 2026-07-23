import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen, waitFor, fireEvent, cleanup } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { lazy, Suspense } from 'react';
import { DataProvider } from '../data/DataContext';
import { ThemeProvider } from '../lib/theme';
import { ProgressProvider } from '../lib/progress';
import { ToastProvider } from '../lib/toast';

const file = (p: string) => readFileSync(resolve(process.cwd(), 'public/content', p), 'utf-8');

const Flashcards = lazy(() => import('../pages/Flashcards'));

function renderFlashcards() {
  return render(
    <ThemeProvider>
      <ProgressProvider>
        <DataProvider>
          <ToastProvider>
            <MemoryRouter initialEntries={['/flashcards']}>
              <Suspense fallback={<div>loading</div>}>
                <Flashcards />
              </Suspense>
            </MemoryRouter>
          </ToastProvider>
        </DataProvider>
      </ProgressProvider>
    </ThemeProvider>,
  );
}

describe('flashcard flip', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.stubGlobal(
      'fetch',
      vi.fn((url: string) => {
        const name = url.split('/').pop()!;
        return Promise.resolve({
          ok: true,
          status: 200,
          json: () => Promise.resolve(JSON.parse(file(name))),
        } as Response);
      }),
    );
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    cleanup();
  });

  it('builds a deck and flips a card from question to answer', async () => {
    renderFlashcards();

    // Deck builder appears once data is loaded.
    const day1 = await screen.findByRole('button', { name: /Day 1\b/ }, { timeout: 3000 });
    fireEvent.click(day1);

    // Start the deck.
    const start = screen.getByRole('button', { name: /Start deck/ });
    fireEvent.click(start);

    // Front shows the prompt to flip.
    await waitFor(() => expect(screen.getByText(/press Space to show answer/i)).toBeInTheDocument());

    // Flip via the Show answer button.
    fireEvent.click(screen.getByRole('button', { name: /Show answer/ }));

    // Grade buttons only appear once flipped to the answer side.
    await waitFor(() => {
      expect(screen.getByRole('button', { name: /Got it/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Review again/ })).toBeInTheDocument();
    });
  });
});
