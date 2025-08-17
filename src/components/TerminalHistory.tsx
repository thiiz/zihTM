'use client';

import { RefObject, useMemo, useState } from 'react';
import { Clipboard, Check } from 'lucide-react';

interface TerminalHistoryProps {
  history: string[];
  endOfHistoryRef: RefObject<HTMLDivElement | null>;
}

function TerminalBlock({ block }: { block: string[] }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    const blockText = block.join('\n');
    navigator.clipboard.writeText(blockText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const renderLine = (line: string, index: number) => {
    if (line.includes('Process exited with code: 0')) {
      return (
        <div key={index} className="flex items-center">
          <span className="w-3 h-3 bg-green-500 rounded-full mr-2"></span>
          <span>Process exited successfully</span>
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
    <div className="relative p-4 border-b border-gray-700 flex flex-col">
      <button
        onClick={handleCopy}
        className="sticky top-2 self-end p-1.5 bg-gray-800 rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-gray-900 focus:ring-green-500"
      >
        {copied ? <Check size={16} /> : <Clipboard size={16} />}
      </button>
      <div className="-mt-10">{block.map(renderLine)}</div>
    </div>
  );
}

export function TerminalHistory({ history, endOfHistoryRef }: TerminalHistoryProps) {
  const commandBlocks = useMemo(() => {
    const blocks: string[][] = [];
    let currentBlock: string[] = [];

    history.forEach(line => {
      if (line.startsWith('$') && currentBlock.length > 0) {
        blocks.push(currentBlock);
        currentBlock = [];
      }
      currentBlock.push(line);
    });

    if (currentBlock.length > 0) {
      blocks.push(currentBlock);
    }

    return blocks;
  }, [history]);

  return (
    <main className="flex-1 overflow-y-auto">
      <div className="h-full">
        {commandBlocks.map((block, index) => (
          <TerminalBlock key={index} block={block} />
        ))}
        <div ref={endOfHistoryRef} />
      </div>
    </main>
  );
}
