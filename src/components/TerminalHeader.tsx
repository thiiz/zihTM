'use client';

import Link from 'next/link';

interface TerminalHeaderProps {
  history: string[];
  onAnalyzeLastError: () => void;
}

export function TerminalHeader({ history, onAnalyzeLastError }: TerminalHeaderProps) {
  const hasError = history.some(h => h.includes('[ERROR]'));

  return (
    <header className="flex justify-between gap-x-4 items-center p-3 border-b border-gray-700">
      <Link href="/settings" className="text-blue-400 hover:underline">
        Settings
      </Link>
      <button
        onClick={onAnalyzeLastError}
        className="mr-4 text-yellow-400 hover:underline disabled:text-gray-500"
        disabled={!hasError}
      >
        Analyze Error
      </button>
    </header>
  );
}
