'use client';

import { Settings2 } from 'lucide-react';
import Link from 'next/link';
import ProjectScripts from './ProjectScripts';

interface TerminalHeaderProps {
  history: string[];
  onAnalyzeLastError: () => void;
  currentDir: string;
  executeCommand: (command: string) => void;
}

export function TerminalHeader({ history, onAnalyzeLastError, currentDir, executeCommand }: TerminalHeaderProps) {
  const hasError = history.some(h => h.includes('[ERROR]'));

  return (
    <header className="flex justify-between gap-x-4 items-center border-b border-gray-700 mt-10 ">
      <ProjectScripts executeCommand={executeCommand} currentDir={currentDir} />
      <div className="ml-auto flex">
        <button
          onClick={onAnalyzeLastError}
          className="mr-4 text-yellow-400 hover:underline disabled:text-gray-500"
          disabled={!hasError}
        >
          Analyze Error
        </button>
        <Link href="/settings" className="text-blue-400 hover:underline p-2">
          <Settings2 />
        </Link>
      </div>
    </header>
  );
}
