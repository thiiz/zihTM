import { useState } from 'react'

export const useHistory = () => {
  const [history, setHistory] = useState<string[]>([])
  const [historyIndex, setHistoryIndex] = useState<number>(-1)

  const addHistory = (command: string) => {
    setHistory([command, ...history])
  }

  const getPreviousCommand = () => {
    if (historyIndex < history.length - 1) {
      const newHistoryIndex = historyIndex + 1
      setHistoryIndex(newHistoryIndex)
      return history[newHistoryIndex]
    }
    return history[historyIndex]
  }

  const getNextCommand = () => {
    if (historyIndex > 0) {
      const newHistoryIndex = historyIndex - 1
      setHistoryIndex(newHistoryIndex)
      return history[newHistoryIndex]
    }
    setHistoryIndex(-1)
    return ''
  }

  return {
    history,
    addHistory,
    getPreviousCommand,
    getNextCommand,
  }
}