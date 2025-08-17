'use client';

import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useAutocomplete } from './useAutocomplete';
import { useHistory } from './useHistory';

export function useTerminal() {
  const [input, setInput] = useState('');
  const [commandHistory, setCommandHistory] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [currentDir, setCurrentDir] = useState('');
  const endOfHistoryRef = useRef<HTMLDivElement>(null);
  const { suggestions, setSuggestions } = useAutocomplete(input, currentDir);
  const [activeSuggestion, setActiveSuggestion] = useState(0);
  const {
    addHistory,
    getPreviousCommand,
    getNextCommand,
  } = useHistory();

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini-api-key') ?? '';
    setApiKey(storedKey);

    setCommandHistory([
      'Welcome to the Tauri + Next.js Terminal!',
      "Type 'help' for a list of commands.",
    ]);

    invoke<string>('get_current_dir')
      .then(setCurrentDir)
      .catch(console.error);
  }, []);

  const scrollToBottom = () => {
    endOfHistoryRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [commandHistory]);

  useEffect(() => {
    const unlistenPromises = [
      listen<string>('terminal-output', (event) => {
        setCommandHistory((prev) => [...prev, event.payload]);
      }),
      listen<string>('terminal-terminated', (event) => {
        setCommandHistory((prev) => [...prev, event.payload]);
      }),
      listen<string>('directory-changed', (event) => {
        setCurrentDir(event.payload);
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
    setActiveSuggestion(0);
  };

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const currentInput = input.trim();
    if (!currentInput) return;

    if (currentInput === 'cls' || currentInput === 'clear') {
      setCommandHistory([]);
    } else if (currentInput === 'help') {
      setCommandHistory((prev) => [
        ...prev,
        '$ help',
        'Available commands:',
        '  ai: <prompt> - Ask Gemini a question',
        '  clear, cls   - Clear the terminal',
        '  exit         - Close the application',
        '  help         - Show this help message',
      ]);
    } else {
      setCommandHistory((prev) => [...prev, `$ ${currentInput}`]);
      addHistory(currentInput);

      if (currentInput.startsWith('ai:')) {
        const prompt = currentInput.substring(3).trim();
        invoke('ask_gemini', { apiKey, prompt })
          .then((response: unknown) => {
            setCommandHistory((prev) => [...prev, String(response)]);
          })
          .catch((error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setCommandHistory((prev) => [...prev, `[ERROR] ${errorMessage}`]);
          });
      } else {
        const [command, ...args] = currentInput.split(/\s+/);
        invoke('execute_command', { command, args }).catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          setCommandHistory((prev) => [...prev, `[ERROR] ${errorMessage}`]);
        });
      }
    }

    setInput('');
    setSuggestions([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'ArrowUp') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setActiveSuggestion((prev) => (prev > 0 ? prev - 1 : suggestions.length - 1));
      } else {
        const previousCommand = getPreviousCommand();
        if (previousCommand) setInput(previousCommand);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setActiveSuggestion((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else {
        const nextCommand = getNextCommand();
        setInput(nextCommand);
      }
    } else if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      const selectedSuggestion = suggestions[activeSuggestion];
      if (selectedSuggestion) {
        const parts = input.split(' ');
        parts[parts.length - 1] = selectedSuggestion;
        setInput(parts.join(' ') + ' ');
        setSuggestions([]);
      }
    }
  };

  const analyzeLastError = () => {
    const lastError = commandHistory.slice().reverse().find(line => line.includes('[ERROR]'));
    if (lastError) {
      const prompt = `Analyze this terminal error and suggest a solution: ${lastError}`;
      setCommandHistory(prev => [...prev, `$ ai: analyze error`]);
      invoke('ask_gemini', { apiKey, prompt })
        .then((response: unknown) => {
          setCommandHistory((prev) => [...prev, String(response)]);
        })
        .catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          setCommandHistory((prev) => [...prev, `[ERROR] ${errorMessage}`]);
        });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const parts = input.split(' ');
    parts[parts.length - 1] = suggestion;
    setInput(parts.join(' ') + ' ');
    setSuggestions([]);
  };


  return {
    input,
    commandHistory,
    currentDir,
    suggestions,
    activeSuggestion,
    endOfHistoryRef,
    handleInputChange,
    handleFormSubmit,
    handleKeyDown,
    analyzeLastError,
    handleSuggestionClick,
  };
}
