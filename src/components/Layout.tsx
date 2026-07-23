import { useCallback, useEffect, useState } from 'react';
import { Outlet, ScrollRestoration } from 'react-router-dom';
import { Navbar } from './Navbar';
import { Footer } from './Footer';
import { BottomTabs } from './BottomTabs';
import { SearchOverlay } from './SearchOverlay';
import { useProgress } from '../lib/progress';

export function Layout() {
  const [searchOpen, setSearchOpen] = useState(false);
  const { storageOk } = useProgress();

  const openSearch = useCallback(() => setSearchOpen(true), []);

  // Global Ctrl/Cmd+K → search (spec §5).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setSearchOpen((o) => !o);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  return (
    <div className="flex min-h-screen flex-col">
      <a href="#main" className="skip-link">
        Skip to content
      </a>
      <Navbar onOpenSearch={openSearch} />
      {!storageOk && (
        <div role="status" className="border-b border-high-text bg-high-bg px-4 py-2 text-center text-[13px] text-high-text">
          Progress can’t be saved in this browser (private mode?). The app still works; nothing will
          persist.
        </div>
      )}
      <main id="main" className="flex-1">
        <Outlet />
      </main>
      <Footer />
      <BottomTabs />
      <SearchOverlay open={searchOpen} onClose={() => setSearchOpen(false)} />
      <ScrollRestoration />
    </div>
  );
}
