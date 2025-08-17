'use client';

import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export default function HomePage() {
  const [input, setInput] = useState('');
  const [history, setHistory] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');
  const endOfHistoryRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini-api-key') ?? '';
    setApiKey(storedKey);
  }, []);

  const scrollToBottom = () => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [history]);

  useEffect(() => {
    let unlistenOutput: (() => void) | undefined;
    let unlistenTermination: (() => void) | undefined;

    const setupListeners = async () => {
      unlistenOutput = await listen<string>('terminal-output', (event) => {
        setHistory((prev) => [...prev, event.payload]);
      });
      unlistenTermination = await listen<string>('terminal-terminated', (event) => {
        setHistory((prev) => [...prev, event.payload]);
      });
    };

    void setupListeners();

    return () => {
      unlistenOutput?.();
      unlistenTermination?.();
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentInput = input.trim();
    if (!currentInput) return;

    setHistory((prev) => [...prev, `$ ${currentInput}`]);

    if (currentInput.startsWith('ai:')) {
      const prompt = currentInput.substring(3).trim();
      invoke('ask_gemini', { apiKey, prompt })
        .then((response: unknown) => {
          setHistory((prev) => [...prev, String(response)]);
        })
        .catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          setHistory((prev) => [...prev, `[ERROR] ${errorMessage}`]);
        });
    } else {
      const [command, ...args] = currentInput.split(/\s+/);
      invoke('execute_command', { command, args }).catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setHistory((prev) => [...prev, `[ERROR] ${errorMessage}`]);
      });
    }

    setInput('');
  };

  const analyzeLastError = () => {
    const lastError = history.slice().reverse().find(line => line.includes('[ERROR]'));
    if (lastError) {
      const prompt = `Analyze this terminal error and suggest a solution: ${lastError}`;
      setHistory(prev => [...prev, `$ ai: analyze error`]);
      invoke('ask_gemini', { apiKey, prompt })
        .then((response: unknown) => {
          setHistory((prev) => [...prev, String(response)]);
        })
        .catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          setHistory((prev) => [...prev, `[ERROR] ${errorMessage}`]);
        });
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-mono">
      <header className="flex justify-between items-center p-3 bg-gray-800 border-b border-gray-700">
        <h1 className="text-lg font-bold">AI Terminal</h1>
        <div>
          <button onClick={analyzeLastError} className="mr-4 text-yellow-400 hover:underline disabled:text-gray-500" disabled={!history.some(h => h.includes('[ERROR]'))}>
            Analyze Error
          </button>
          <Link href="/settings" className="text-blue-400 hover:underline">
            Settings
          </Link>
        </div>
      </header>

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

      <footer className="p-3 bg-gray-800 border-t border-gray-700">
        <form onSubmit={handleFormSubmit} className="flex items-center">
          <span className="text-green-400 mr-2">$</span>
          <input
            type="text"
            value={input}
            onChange={handleInputChange}
            className="flex-1 bg-transparent focus:outline-none"
            placeholder="Enter a command or use 'ai:' for suggestions..."
            autoFocus
          />
        </form>
      </footer>
    </div>
  );
}
