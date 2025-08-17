"use client";
import { getCurrentWindow } from "@tauri-apps/api/window";

export default function TitleBar() {
  const startDragging = () => {
    void getCurrentWindow().startDragging();
  };

  const handleMinimize = () => void getCurrentWindow().minimize();
  const handleMaximize = () => void getCurrentWindow().toggleMaximize();
  const handleClose = () => void getCurrentWindow().close();

  return (
    <div
      onMouseDown={startDragging}
      className="fixed top-0 left-0 right-0 z-40 flex justify-between items-center bg-transparent h-10 select-none px-2"
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
    </div>
  );
}