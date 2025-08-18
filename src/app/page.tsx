'use client';

import { useEffect } from 'react';
import { TerminalHeader } from '@/components/TerminalHeader';
import { TerminalHistory } from '@/components/TerminalHistory';
import { TerminalInput } from '@/components/TerminalInput';
import { useTerminal } from '@/hooks/useTerminal';

export default function HomePage() {
  const {
    input,
    commandHistory,
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
  } = useTerminal();

  useEffect(() => {
    const handleGlobalKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey && e.key === 'c') {
        e.preventDefault();
        killProcess();
      }
    };

    window.addEventListener('keydown', handleGlobalKeyDown);

    return () => {
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, [killProcess]);

  return (
    <div className="fixed bottom-0 left-0 w-full h-[400px] flex flex-col text-white font-mono">
      <TerminalHeader
        history={commandHistory}
        onAnalyzeLastError={analyzeLastError}
        currentDir={currentDir}
        executeCommand={(command) => {
          void executeCommand(command);
        }}
      />
      <TerminalHistory
        history={commandHistory}
        endOfHistoryRef={endOfHistoryRef}
        onTerminalClick={focusInput}
      />
      <TerminalInput
        ref={inputRef}
        input={input}
        suggestions={suggestions}
        activeSuggestion={activeSuggestion}
        onInputChange={handleInputChange}
        onFormSubmit={(e) => {
          handleFormSubmit(e);
        }}
        onKeyDown={handleKeyDown}
        onSuggestionClick={handleSuggestionClick}
        onKillProcess={killProcess}
        isProcessRunning={isProcessRunning}
      />
    </div>
  );
}
