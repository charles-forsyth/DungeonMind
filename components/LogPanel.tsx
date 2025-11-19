import React, { useEffect, useRef } from 'react';
import { LogEntry } from '../types';
import { ScrollText, Terminal } from 'lucide-react';

interface LogPanelProps {
  logs: LogEntry[];
}

const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [logs]);

  return (
    <div className="bg-slate-900 border border-slate-700 rounded-lg p-4 h-64 md:h-full flex flex-col">
      <div className="flex items-center gap-2 mb-2 text-slate-400 border-b border-slate-800 pb-2">
        <Terminal className="w-4 h-4" />
        <h3 className="font-bold uppercase text-xs tracking-wider">Adventure Log</h3>
      </div>
      
      <div className="flex-1 overflow-y-auto space-y-2 font-mono text-sm">
        {logs.length === 0 && (
          <div className="text-slate-600 text-center mt-10 italic">
            Waiting for adventure to begin...
          </div>
        )}
        {logs.map((log) => (
          <div key={log.id} className={`p-2 rounded border-l-2 ${
            log.type === 'combat' ? 'border-red-500 bg-red-900/10 text-red-200' :
            log.type === 'ai' ? 'border-purple-500 bg-purple-900/10 text-purple-200' :
            'border-blue-500 bg-blue-900/10 text-blue-200'
          }`}>
            <span className="text-xs opacity-50 mr-2">T{log.turn}</span>
            {log.message}
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};

export default LogPanel;
