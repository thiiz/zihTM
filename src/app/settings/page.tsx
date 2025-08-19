'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { useEffect, useState } from 'react';

export default function SettingsPage() {
  const [apiKey, setApiKey] = useState('');

  const [saveMessage, setSaveMessage] = useState('');
  useEffect(() => {
    const storedKey = localStorage.getItem('gemini-api-key');
    if (storedKey) {
      setApiKey(storedKey);
    }
  }, []);

  const handleSave = () => {
    // In a real app, you'd encrypt and store this securely.
    // For now, we'll use localStorage for simplicity.
    localStorage.setItem('gemini-api-key', apiKey);
    setSaveMessage('API Key saved successfully!');
    setTimeout(() => {
      setSaveMessage('');
    }, 3000);
  };

  return (
    <div className="container mx-auto p-4  text-white min-h-screen pt-12">
      <header className="flex justify-between items-center mb-8">
        <Link href="/" className="text-blue-400 hover:underline">
          <ArrowLeft />
        </Link>
      </header>

      <main>
        <div className="bg-black/30 p-6 rounded-lg shadow-lg">
          <h2 className="text-xl mb-4">Gemini API Key</h2>
          <p className="text-gray-400 mb-4">
            Enter your Gemini API key to enable AI-powered features.
          </p>
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="password"
              value={apiKey}
              onChange={(e) => {
                setApiKey(e.target.value);
              }}
              placeholder="Enter your API key"
              className="flex-grow p-2 bg-black/30 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              onClick={handleSave}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-md font-semibold"
            >
              Save Key
            </button>
          </div>
          {saveMessage && <p className="mt-4 text-green-400">{saveMessage}</p>}
        </div>
      </main>
    </div>
  );
}
