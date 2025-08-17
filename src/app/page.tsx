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
    <div className="flex flex-col h-screen backdrop-blur-3xl text-white font-mono">
      <TerminalHistory history={history} endOfHistoryRef={endOfHistoryRef} />
      <TerminalInput
        input={input}
        onInputChange={handleInputChange}
        onFormSubmit={handleFormSubmit}
      />
    </div>
  );
}
