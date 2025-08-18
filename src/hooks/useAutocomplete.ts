'use client';

import { invoke } from '@tauri-apps/api/core';
import { useEffect, useState } from 'react';

const FREQUENT_COMMANDS = ['git', 'ls', 'cd', 'clear', 'cls', 'npm', 'pnpm', 'yarn', 'bun', 'code', 'vim', 'nvim', 'nano', 'cat', 'rm', 'mkdir'];
const BUN_COMMANDS = ['run dev', 'run build', 'run start', 'install', 'add', 'remove'];

export function useAutocomplete(inputValue: string, currentDir: string, commandHistory: string[]) {
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [systemCommands, setSystemCommands] = useState<string[]>([]);

  useEffect(() => {
    const fetchSystemCommands = async () => {
      try {
        const commands = await invoke<string[]>('get_path_suggestions');
        setSystemCommands(commands);
      } catch (error) {
        console.error('Error fetching system commands:', error);
      }
    };
    void fetchSystemCommands();
  }, []);

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
          const historySet = Array.from(new Set(commandHistory.reverse()));
          const allCommands = [...new Set([...historySet, ...FREQUENT_COMMANDS, ...systemCommands])];

          const filteredCommands = allCommands.filter((cmd) =>
            cmd.toLowerCase().startsWith(command.toLowerCase())
          );
          setSuggestions(filteredCommands);
        }
      } else if (command === 'bun' && parts.length > 1) {
        const bunArg = parts.slice(1).join(' ');
        const filteredBunCommands = BUN_COMMANDS.filter((cmd) => cmd.startsWith(bunArg));
        setSuggestions(filteredBunCommands.map(cmd => `bun ${cmd}`));
      } else if (['cd', 'ls', 'cat', 'rm', 'mkdir'].includes(command) && (inputValue.endsWith(' ') || lastPart)) {
        try {
          const entries = await invoke<string[]>('list_dir_contents', { path: currentDir });
          const filteredEntries = entries.filter((entry) => entry.startsWith(lastPart));
          setSuggestions(filteredEntries.map(entry => `${command} ${entry}`));
        } catch (error) {
          console.error('Error fetching directory contents:', error);
          setSuggestions([]);
        }
      } else {
        setSuggestions([]);
      }
    };

    void fetchSuggestions();
  }, [inputValue, currentDir, systemCommands, commandHistory]);

  return { suggestions, setSuggestions };
}