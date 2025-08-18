'use client';

import { useState, useEffect, useCallback } from 'react';

const MAX_HISTORY_SIZE = 100;
const HISTORY_STORAGE_KEY = 'terminal-command-history';

export function useCommandHistory() {
  const [history, setHistory] = useState<string[]>([]);
  const [historyIndex, setHistoryIndex] = useState(-1);

  useEffect(() => {
    try {
      const savedHistory = localStorage.getItem(HISTORY_STORAGE_KEY);
      if (savedHistory) {
        setHistory(JSON.parse(savedHistory));
      }
    } catch (error) {
      console.error('Failed to load command history from localStorage:', error);
    }
  }, []);

  const addCommandToHistory = useCallback((command: string) => {
    if (command.trim() === '') return;
    try {
      const newHistory = [command, ...history.filter((c) => c !== command)].slice(0, MAX_HISTORY_SIZE);
      setHistory(newHistory);
      localStorage.setItem(HISTORY_STORAGE_KEY, JSON.stringify(newHistory));
      setHistoryIndex(-1);
    } catch (error) {
      console.error('Failed to save command history to localStorage:', error);
    }
  }, [history]);

  return { history, addCommandToHistory, historyIndex, setHistoryIndex };
}