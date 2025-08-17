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
    endOfHistoryRef,
    handleInputChange,
    handleFormSubmit,
    handleKeyDown,
    analyzeLastError,
  } = useTerminal();

  return (
    <div className="flex flex-col h-screen text-white font-mono">
      <TerminalHeader
        history={history}
        onAnalyzeLastError={analyzeLastError}
        currentDir={currentDir}
      />
      <TerminalHistory history={history} endOfHistoryRef={endOfHistoryRef} />
      <TerminalInput
        input={input}
        suggestions={suggestions}
        onInputChange={handleInputChange}
        onFormSubmit={handleFormSubmit}
        onKeyDown={handleKeyDown}
      />
    </div>
  );
}
