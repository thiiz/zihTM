'use client';

import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';

export function useTerminal() {
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
    const unlistenPromises = [
      listen<string>('terminal-output', (event) => {
        setHistory((prev) => [...prev, event.payload]);
      }),
      listen<string>('terminal-terminated', (event) => {
        setHistory((prev) => [...prev, event.payload]);
      }),
    ];

    return () => {
      unlistenPromises.forEach((p) => {
        void p.then((unlisten) => {
          unlisten();
        });
      });
    };
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentInput = input.trim();
    if (!currentInput) return;

    if (currentInput === 'cls' || currentInput === 'clear') {
      setHistory([]);
    } else {
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

  return {
    input,
    history,
    endOfHistoryRef,
    handleInputChange,
    handleFormSubmit,
    analyzeLastError,
  };
}
