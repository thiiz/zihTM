import { invoke } from '@tauri-apps/api/core';
import { Audiowide } from 'next/font/google';
import React, { useEffect, useState } from 'react';
interface ProjectScriptsProps {
  executeCommand: (command: string) => void;
  currentDir: string;
}
const stalinistOne = Audiowide({
  variable: "--font-audiowide",
  subsets: ["latin"],
  weight: ['400']
});

const ProjectScripts: React.FC<ProjectScriptsProps> = ({ executeCommand, currentDir }) => {
  const [scripts, setScripts] = useState<Record<string, string>>({});
  const [packageManager, setPackageManager] = useState<string>('npm');

  useEffect(() => {
    const fetchProjectInfo = async () => {
      try {
        const manager = await invoke<string>('detect_package_manager');
        setPackageManager(manager);

        const fetchedScripts = await invoke<Record<string, string>>('get_package_json_scripts');
        setScripts(fetchedScripts);
      } catch (error) {
        console.error('Error fetching project info:', error);
      }
    };

    void fetchProjectInfo();
  }, [currentDir]);

  const handleScriptClick = (scriptName: string) => {
    executeCommand(`${packageManager} run ${scriptName}`);
  };

  if (Object.keys(scripts).length === 0) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 ml-4">
      {Object.keys(scripts).map((scriptName) => (
        <button
          key={scriptName}
          onClick={() => {
            handleScriptClick(scriptName);
          }}
          className={`py-1 px-2 uppercase text-xs bg-black/50 rounded transition-colors hover:bg-black/100 ${stalinistOne.className}`}
        >
          {scriptName}
        </button>
      ))}
    </div>
  );
};

export default ProjectScripts;