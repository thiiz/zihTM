'use client';

import Link from 'next/link';

interface TerminalHeaderProps {
  history: string[];
  onAnalyzeLastError: () => void;
  currentDir: string;
}

export function TerminalHeader({ history, onAnalyzeLastError, currentDir }: TerminalHeaderProps) {
  const hasError = history.some(h => h.includes('[ERROR]'));

  return (
    <header className="flex justify-between gap-x-4 items-center p-3 border-b border-gray-700">
      <div className="flex items-center gap-x-2">
        <Link href="/settings" className="text-blue-400 hover:underline">
          Settings
        </Link>
      </div>
      <div className="text-sm text-gray-400">
        <span>{currentDir}</span>
      </div>
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
