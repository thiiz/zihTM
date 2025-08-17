'use client';

import { RefObject } from 'react';

interface TerminalHistoryProps {
  history: string[];
  endOfHistoryRef: RefObject<HTMLDivElement | null>;
}

export function TerminalHistory({ history, endOfHistoryRef }: TerminalHistoryProps) {
  const renderLine = (line: string, index: number) => {
    if (line.includes('Process exited with code: 0')) {
      return (
        <div key={index} className="flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
          <span>Process exited successfully</span>
        </div>
      );
    }

    if (line.includes('Process exited with code: 1')) {
      return (
        <div key={index} className="flex items-center">
          <span className="w-3 h-3 bg-blue-500 rounded-full mr-2"></span>
          <span>Process started</span>
        </div>
      );
    }

    return (
      <div
        key={index}
        className={
          line.startsWith('$')
            ? 'text-green-400'
            : line.includes('[ERROR]')
              ? 'text-red-400'
              : ''
        }
      >
        <pre className="whitespace-pre-wrap">{line}</pre>
      </div>
    );
  };

  return (
    <main className="flex-1 p-4 overflow-y-auto">
      <div className="h-full">
        {history.map(renderLine)}
        <div ref={endOfHistoryRef} />
      </div>
    </main>
  );
}
