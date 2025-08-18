/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client';

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
    handleInputChange,
    handleFormSubmit,
    handleKeyDown,
    analyzeLastError,
    handleSuggestionClick,
    killProcess,
  } = useTerminal();

  return (
    <div className="fixed bottom-0 left-0 w-full h-[400px] flex flex-col text-white font-mono">
      <TerminalHeader
        history={commandHistory}
        onAnalyzeLastError={analyzeLastError}
        currentDir={currentDir}
      />
      <TerminalHistory history={commandHistory} endOfHistoryRef={endOfHistoryRef} />
      <TerminalInput
        input={input}
        suggestions={suggestions}
        activeSuggestion={activeSuggestion}
        onInputChange={handleInputChange}
        onFormSubmit={handleFormSubmit}
        onKeyDown={handleKeyDown}
        onSuggestionClick={handleSuggestionClick}
        onKillProcess={killProcess}
      />
    </div>
  );
}
