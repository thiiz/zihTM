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
    endOfHistoryRef,
    handleInputChange,
    handleFormSubmit,
    analyzeLastError,
  } = useTerminal();

  return (
    <div className="flex flex-col h-screen bg-black/30 backdrop-blur-sm text-white font-mono pt-10">
      <TerminalHeader
        history={history}
        onAnalyzeLastError={analyzeLastError}
        currentDir={currentDir}
      />
      <TerminalHistory history={history} endOfHistoryRef={endOfHistoryRef} />
      <TerminalInput
        input={input}
        onInputChange={handleInputChange}
        onFormSubmit={handleFormSubmit}
      />
    </div>
  );
}
