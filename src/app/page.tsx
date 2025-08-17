'use client';

import { useTerminal } from '@/hooks/useTerminal';
import { TerminalHeader } from '@/components/TerminalHeader';
import { TerminalHistory } from '@/components/TerminalHistory';
import { TerminalInput } from '@/components/TerminalInput';

export default function HomePage() {
  const {
    input,
    history,
    endOfHistoryRef,
    handleInputChange,
    handleFormSubmit,
    analyzeLastError,
  } = useTerminal();

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white font-mono pt-10">
      <TerminalHeader history={history} onAnalyzeLastError={analyzeLastError} />
      <TerminalHistory history={history} endOfHistoryRef={endOfHistoryRef} />
      <TerminalInput
        input={input}
        onInputChange={handleInputChange}
        onFormSubmit={handleFormSubmit}
      />
    </div>
  );
}
