'use client';

interface TerminalInputProps {
  input: string;
  suggestions: string[];
  activeSuggestion: number;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSuggestionClick: (suggestion: string) => void;
}

export function TerminalInput({
  input,
  suggestions,
  activeSuggestion,
  onInputChange,
  onFormSubmit,
  onKeyDown,
  onSuggestionClick,
}: TerminalInputProps) {
  return (
    <footer className="p-3 bg-black/30 border-t border-gray-800">
      <div className="relative">
        <form onSubmit={onFormSubmit} className="flex items-center">
          <span className="text-green-400 mr-2">$</span>
          <input
            type="text"
            value={input}
            onChange={onInputChange}
            onKeyDown={onKeyDown}
            className="flex-1 bg-transparent focus:outline-none"
            placeholder="Enter a command or use 'ai:' for suggestions..."
            autoFocus
          />
        </form>
        {suggestions.length > 0 && (
          <div className="absolute bottom-full left-0 w-full bg-black/90 border border-gray-800 rounded-md mb-1">
            <ul className="text-white">
              {suggestions.map((suggestion, index) => (
                <li
                  key={index}
                  className={`px-3 py-1 cursor-pointer ${
                    index === activeSuggestion ? 'bg-gray-700' : 'hover:bg-gray-700'
                  }`}
                  onClick={() => {
                    onSuggestionClick(suggestion);
                  }}
                >
                  {suggestion}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </footer>
  );
}
