"use client";
import {getCurrentWindow  } from "@tauri-apps/api/window";
import { Maximize, Minimize, X } from "lucide-react";

export default function TitleBar() {
  const handleMinimize = () => getCurrentWindow().minimize();
  const handleMaximize = () => getCurrentWindow().toggleMaximize();
  const handleClose = () => getCurrentWindow().close();

  return (
    <div
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          getCurrentWindow().startDragging();
        }
      }}
      className="fixed top-0 left-0 right-0 flex justify-end bg-transparent h-10 select-none"
    >
      <div className="flex">
        <button onClick={handleMinimize} className="p-2 hover:bg-black/20">
          <Minimize size={16} />
        </button>
        <button onClick={handleMaximize} className="p-2 hover:bg-black/20">
          <Maximize size={16} />
        </button>
        <button onClick={handleClose} className="p-2 hover:bg-red-500/80">
          <X size={16} />
        </button>
      </div>
    </div>
  );
}