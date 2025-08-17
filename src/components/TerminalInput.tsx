'use client';

interface TerminalInputProps {
  input: string;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
}

export function TerminalInput({ input, onInputChange, onFormSubmit }: TerminalInputProps) {
  return (
    <footer className="p-3 bg-black/30 border-t border-gray-800">
      <form onSubmit={onFormSubmit} className="flex items-center">
        <span className="text-green-400 mr-2">$</span>
        <input
          type="text"
          value={input}
          onChange={onInputChange}
          className="flex-1 bg-transparent focus:outline-none"
          placeholder="Enter a command or use 'ai:' for suggestions..."
          autoFocus
        />
      </form>
    </footer>
  );
}
