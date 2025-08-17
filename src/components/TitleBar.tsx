"use client";
import { useTerminal } from "@/hooks/useTerminal";
import { getCurrentWindow } from "@tauri-apps/api/window";
import { useEffect, useState } from "react";

export default function TitleBar() {
  const [isPinned, setIsPinned] = useState(false);

  useEffect(() => {
    const pinned = localStorage.getItem("isPinned") === "true";
    setIsPinned(pinned);
    void getCurrentWindow().setAlwaysOnTop(pinned);
  }, []);

  const startDragging = () => {
    void getCurrentWindow().startDragging();
  };

  const handleMinimize = () => void getCurrentWindow().minimize();
  const handleMaximize = () => void getCurrentWindow().toggleMaximize();
  const handleClose = () => void getCurrentWindow().close();

  const handlePin = () => {
    const newPinnedState = !isPinned;
    setIsPinned(newPinnedState);
    localStorage.setItem("isPinned", String(newPinnedState));
    void getCurrentWindow().setAlwaysOnTop(newPinnedState);
  };
  const { currentDir } = useTerminal()
  return (
    <div
      onMouseDown={startDragging}
      className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center bg-black/30 h-10 select-none px-2"
    >
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
        className="flex space-x-2"
      >
        <button
          onClick={handleClose}
          className="w-3 h-3 bg-red-500 rounded-full"
        />
        <button
          onClick={handleMinimize}
          className="w-3 h-3 bg-yellow-500 rounded-full"
        />
        <button
          onClick={handleMaximize}
          className="w-3 h-3 bg-green-500 rounded-full"
        />
      </div>
      <div className="text-sm text-gray-400">
        <span>{currentDir}</span>
      </div>
      <div
        onMouseDown={(e) => {
          e.stopPropagation();
        }}
      >
        <button
          onClick={handlePin}
          className={`w-3 h-3 rounded-full ${isPinned ? "bg-blue-500" : "bg-gray-400"
            }`}
        />
      </div>
    </div>
  );
}