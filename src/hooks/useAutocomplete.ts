'use client';

import { useState, useEffect } from 'react';
import { invoke } from '@tauri-apps/api/core';

const FREQUENT_COMMANDS = ['git', 'ls', 'cd', 'clear', 'cls', 'npm', 'pnpm', 'yarn', 'bun', 'code', 'vim', 'nvim', 'nano'];

export function useAutocomplete(inputValue: string, currentDir: string) {
  const [suggestions, setSuggestions] = useState<string[]>([]);

  useEffect(() => {
    if (!inputValue) {
      setSuggestions([]);
      return;
    }

    const parts = inputValue.split(' ');
    const lastPart = parts[parts.length - 1];

    if (parts.length === 1) {
      const filteredCommands = FREQUENT_COMMANDS.filter((cmd) => cmd.startsWith(lastPart));
      setSuggestions(filteredCommands);
    } else if (parts[0] === 'cd' && parts.length > 1) {
      invoke<string[]>('list_dir_contents', { path: currentDir })
        .then((entries) => {
          const filteredEntries = entries.filter((entry) => entry.startsWith(lastPart));
          setSuggestions(filteredEntries);
        })
        .catch(console.error);
    } else {
      setSuggestions([]);
    }
  }, [inputValue, currentDir]);

  return { suggestions };
}