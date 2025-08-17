'use client';

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

const FREQUENT_COMMANDS = ['git', 'ls', 'cd', 'clear', 'cls', 'npm', 'pnpm', 'yarn', 'bun', 'code', 'vim', 'nvim', 'nano', 'cat', 'rm', 'mkdir'];

export function useAutocomplete(inputValue: string, currentDir: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    const fetchSuggestions = async () => {
      if (!inputValue) {
        setSuggestions([]);
        return;
      }

      const parts = inputValue.split(' ').filter(Boolean);
      const command = parts[0];
      const lastPart = parts[parts.length - 1] || '';

      if (parts.length === 1) {
        if (inputValue.endsWith(' ')) {
          setSuggestions([]);
        } else {
          const filteredCommands = FREQUENT_COMMANDS.filter((cmd) => cmd.startsWith(command));
          setSuggestions(filteredCommands);
        }
      } else if (['cd', 'ls', 'cat', 'rm', 'mkdir'].includes(command) && (inputValue.endsWith(' ') || lastPart)) {
        try {
          const entries = await invoke<string[]>('list_dir_contents', { path: currentDir });
          const filteredEntries = entries.filter((entry) => entry.startsWith(lastPart));
          setSuggestions(filteredEntries);
        } catch (error) {
          console.error('Error fetching directory contents:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };

    fetchSuggestions();
  }, [inputValue, currentDir]);

  return { suggestions, setSuggestions };
}