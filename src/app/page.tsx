/* eslint-disable @typescript-eslint/no-unsafe-assignment */
'use client';

import { TerminalHeader } from '@/components/TerminalHeader';
import { TerminalHistory } from '@/components/TerminalHistory';
import { TerminalInput } from '@/components/TerminalInput';
import { useTerminal } from '@/hooks/useTerminal';

export default function HomePage() {
  const {
    input,
    history,
    currentDir,
    suggestions,
    activeSuggestion,
    endOfHistoryRef,
    handleInputChange,
    handleFormSubmit,
    handleKeyDown,
    analyzeLastError,
    handleSuggestionClick,
  } = useTerminal();

  return (
    <div className="fixed bottom-0 left-0 w-full h-[400px] flex flex-col text-white font-mono">
      <TerminalHeader
        history={history}
        onAnalyzeLastError={analyzeLastError}
        currentDir={currentDir}
      />
      <TerminalHistory history={history} endOfHistoryRef={endOfHistoryRef} />
      <TerminalInput
        input={input}
        suggestions={suggestions}
        activeSuggestion={activeSuggestion}
        onInputChange={handleInputChange}
        onFormSubmit={handleFormSubmit}
        onKeyDown={handleKeyDown}
        onSuggestionClick={handleSuggestionClick}
      />
    </div>
  );
}
