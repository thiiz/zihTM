'use client';

interface TerminalInputProps {
  input: string;
  suggestions: string[];
  activeSuggestion: number;
  onInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onFormSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  onKeyDown: (e: React.KeyboardEvent<HTMLInputElement>) => void;
  onSuggestionClick: (suggestion: string) => void;
  onKillProcess: () => void;
}

export function TerminalInput({
  input,
  suggestions,
  activeSuggestion,
  onInputChange,
  onFormSubmit,
  onKeyDown,
  onSuggestionClick,
  onKillProcess,
}: TerminalInputProps) {
  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.ctrlKey && e.key === 'c') {
      e.preventDefault();
      onKillProcess();
    } else {
      onKeyDown(e);
    }
  };

  return (
    <footer className="p-3 bg-black/30 border-t border-gray-800">
      <div className="relative">
        <form onSubmit={onFormSubmit} className="flex items-center">
          <span className="text-green-400 mr-2">$</span>
          <div className="relative flex-1">
            <input
              type="text"
              value={input}
              onChange={onInputChange}
              onKeyDown={handleKeyDown}
              className="w-full bg-transparent focus:outline-none"
              placeholder="Enter a command or use 'ai:' for suggestions..."
              autoFocus
            />
            {suggestions.length > 0 && activeSuggestion < suggestions.length && input && (
              <div className="absolute inset-y-0 left-0 pointer-events-none">
                <span className="text-transparent">{input}</span>
                <span className="text-gray-500">
                  {suggestions[activeSuggestion].substring(input.length)}
                </span>
              </div>
            )}
          </div>
          <button
            type="button"
            onClick={onKillProcess}
            className="ml-2 px-2 py-1 text-xs bg-red-500 text-white rounded hover:bg-red-600"
            title="Kill Process (Ctrl+C)"
          >
            Kill
          </button>
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
