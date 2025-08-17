'use client';

import { RefObject } from 'react';

interface TerminalHistoryProps {
  history: string[];
  endOfHistoryRef: RefObject<HTMLDivElement | null>;
}

export function TerminalHistory({ history, endOfHistoryRef }: TerminalHistoryProps) {
  return (
    <main className="flex-1 p-4 overflow-y-auto">
      <div className="h-full">
        {history.map((line, index) => (
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
        ))}
        <div ref={endOfHistoryRef} />
      </div>
    </main>
  );
}
