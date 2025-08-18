import React, { useEffect, useState } from 'react';
import { invoke } from '@tauri-apps/api/core';
import { RoundedButton } from './RoundedButton';

interface ProjectScriptsProps {
  executeCommand: (command: string) => void;
  currentDir: string;
}

const ProjectScripts: React.FC<ProjectScriptsProps> = ({ executeCommand, currentDir }) => {
  const [scripts, setScripts] = useState<Record<string, string>>({});
  const [packageManager, setPackageManager] = useState<string>('npm');

  useEffect(() => {
    const fetchProjectInfo = async () => {
      try {
        const manager = await invoke<string>('detect_package_manager', { state: currentDir });
        setPackageManager(manager);

        const fetchedScripts = await invoke<Record<string, string>>('get_package_json_scripts', { state: currentDir });
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
    <div className="flex items-center gap-2">
      <p className="text-sm font-bold">Scripts:</p>
      {Object.keys(scripts).map((scriptName) => (
        <button
          key={scriptName}
          onClick={() => {
            handleScriptClick(scriptName);
          }}
          className="px-2 py-1 text-xs bg-gray-700 rounded hover:bg-gray-600"
        >
          {scriptName}
        </button>
      ))}
    </div>
  );
};

export default ProjectScripts;