'use client';

import { useState, useEffect, useRef } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { useAutocomplete } from './useAutocomplete';
import { useCommandHistory } from './useCommandHistory';

export function useTerminal() {
  const [input, setInput] = useState('');
  const [outputHistory, setOutputHistory] = useState<string[]>([]);
  const [apiKey, setApiKey] = useState('');
  const [currentDir, setCurrentDir] = useState('');
  const [isProcessRunning, setIsProcessRunning] = useState(false);
  const endOfHistoryRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const prevIsProcessRunningRef = useRef(false);
  const { history: commandHistory, addCommandToHistory, historyIndex, setHistoryIndex } = useCommandHistory();
  const { suggestions, setSuggestions } = useAutocomplete(input, currentDir, commandHistory);
  const [activeSuggestion, setActiveSuggestion] = useState(0);

  const focusInput = () => {
    inputRef.current?.focus();
  };

  useEffect(() => {
    const storedKey = localStorage.getItem('gemini-api-key') ?? '';
    setApiKey(storedKey);

    setOutputHistory([
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
  }, [outputHistory]);

  useEffect(() => {
    if (prevIsProcessRunningRef.current && !isProcessRunning) {
      focusInput();
    }
    prevIsProcessRunningRef.current = isProcessRunning;
  }, [isProcessRunning]);

  useEffect(() => {
    const unlistenPromises = [
      listen<string>('terminal-output', (event) => {
        setOutputHistory((prev) => [...prev, event.payload]);
      }),
      listen<string>('terminal-terminated', (event) => {
        if (event.payload) {
          setOutputHistory((prev) => [...prev, event.payload]);
        }
        setIsProcessRunning(false);
      }),
      listen<string>('directory-changed', (event) => {
        setCurrentDir(event.payload);
        focusInput();
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
      setOutputHistory([]);
    } else if (currentInput === 'help') {
      setOutputHistory((prev) => [
        ...prev,
        '$ help',
        'Available commands:',
        '  ai: <prompt> - Ask Gemini a question',
        '  clear, cls   - Clear the terminal',
        '  exit         - Close the application',
        '  help         - Show this help message',
      ]);
    } else {
      addCommandToHistory(currentInput);

      if (currentInput.startsWith('ai:')) {
        const prompt = currentInput.substring(3).trim();
        setOutputHistory((prev) => [...prev, `$ ${currentInput}`]);
        invoke('ask_gemini', { apiKey, prompt })
          .then((response: unknown) => {
            setOutputHistory((prev) => [...prev, String(response)]);
          })
          .catch((error: unknown) => {
            const errorMessage = error instanceof Error ? error.message : String(error);
            setOutputHistory((prev) => [...prev, `[ERROR] ${errorMessage}`]);
          });
      } else {
        void executeCommand(currentInput);
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
      } else if (historyIndex < commandHistory.length - 1) {
        const newIndex = historyIndex + 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      }
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      if (suggestions.length > 0) {
        setActiveSuggestion((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
      } else if (historyIndex > 0) {
        const newIndex = historyIndex - 1;
        setHistoryIndex(newIndex);
        setInput(commandHistory[newIndex]);
      } else {
        setHistoryIndex(-1);
        setInput('');
      }
    } else if (e.key === 'Tab' && suggestions.length > 0) {
      e.preventDefault();
      setActiveSuggestion((prev) => (prev < suggestions.length - 1 ? prev + 1 : 0));
    } else if (e.key === 'ArrowRight' && suggestions.length > 0 && input) {
      e.preventDefault();
      const selectedSuggestion = suggestions[activeSuggestion];
      if (selectedSuggestion) {
        setInput(selectedSuggestion);
        setSuggestions([]);
      }
    }
  };

  const analyzeLastError = () => {
    const lastError = outputHistory.slice().reverse().find(line => line.includes('[ERROR]'));
    if (lastError) {
      const prompt = `Analyze this terminal error and suggest a solution: ${lastError}`;
      setOutputHistory(prev => [...prev, `$ ai: analyze error`]);
      invoke('ask_gemini', { apiKey, prompt })
        .then((response: unknown) => {
          setOutputHistory((prev) => [...prev, String(response)]);
        })
        .catch((error: unknown) => {
          const errorMessage = error instanceof Error ? error.message : String(error);
          setOutputHistory((prev) => [...prev, `[ERROR] ${errorMessage}`]);
        });
    }
  };

  const handleSuggestionClick = (suggestion: string) => {
    const parts = input.split(' ');
    parts[parts.length - 1] = suggestion;
    setInput(parts.join(' ') + ' ');
    setSuggestions([]);
  };

  const killProcess = () => {
    invoke('kill_process')
      .then(() => {
        setOutputHistory((prev) => [...prev, 'Process terminated.']);
        setIsProcessRunning(false);
      })
      .catch((error: unknown) => {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setOutputHistory((prev) => [...prev, `[ERROR] ${errorMessage}`]);
        setIsProcessRunning(false);
      });
  };

  const executeCommand = async (commandStr: string) => {
    try {
      await invoke('kill_process');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      if (errorMessage !== 'No process to kill') {
        setOutputHistory((prev) => [...prev, `[ERROR] ${errorMessage}`]);
      }
    }
    setOutputHistory((prev) => [...prev, `$ ${commandStr}`]);
    addCommandToHistory(commandStr);
    setIsProcessRunning(true);
    invoke('execute_command', { command: commandStr }).catch((error: unknown) => {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setOutputHistory((prev) => [...prev, `[ERROR] ${errorMessage}`]);
      setIsProcessRunning(false);
    });
  };

  return {
    input,
    commandHistory: outputHistory,
    currentDir,
    suggestions,
    activeSuggestion,
    endOfHistoryRef,
    inputRef,
    handleInputChange,
    handleFormSubmit,
    handleKeyDown,
    analyzeLastError,
    handleSuggestionClick,
    killProcess,
    executeCommand,
    isProcessRunning,
    focusInput,
  };
}
