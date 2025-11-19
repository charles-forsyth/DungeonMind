import React from 'react';
import { Play, Shield, Skull, Sparkles, Zap, RefreshCw } from 'lucide-react';

interface ControlPanelProps {
  onGenerate: (theme: string) => void;
  onAutoTurn: () => void;
  onEndTurn: () => void;
  isThinking: boolean;
  isGameOver: boolean;
  turnSide: 'hero' | 'enemy';
  autoEnabled: boolean;
  toggleAuto: () => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ 
  onGenerate, 
  onAutoTurn, 
  onEndTurn, 
  isThinking, 
  isGameOver, 
  turnSide,
  autoEnabled,
  toggleAuto
}) => {
  const [themeInput, setThemeInput] = React.useState("Goblin Ambush");

  return (
    <div className="bg-slate-800 p-4 rounded-lg border border-slate-700 shadow-lg space-y-6">
      
      {/* Game Gen Section */}
      <div className="space-y-2">
        <label className="text-xs font-bold text-slate-400 uppercase tracking-wider">New Adventure</label>
        <div className="flex gap-2">
          <input 
            type="text" 
            value={themeInput}
            onChange={(e) => setThemeInput(e.target.value)}
            placeholder="e.g. Skeleton King"
            className="bg-slate-900 border border-slate-700 text-slate-200 px-3 py-2 rounded flex-1 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
            disabled={isThinking}
          />
          <button 
            onClick={() => onGenerate(themeInput)}
            disabled={isThinking}
            className="bg-purple-600 hover:bg-purple-700 disabled:opacity-50 text-white px-4 py-2 rounded font-bold text-sm flex items-center gap-2 transition-colors"
          >
            <Sparkles className="w-4 h-4" />
            Gen
          </button>
        </div>
      </div>

      <div className="h-px bg-slate-700" />

      {/* Turn Controls */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className={`px-3 py-1 rounded-full text-xs font-bold border ${turnSide === 'hero' ? 'bg-blue-900/50 border-blue-500 text-blue-300' : 'bg-red-900/50 border-red-500 text-red-300'}`}>
            {turnSide === 'hero' ? "HERO TURN" : "ENEMY TURN"}
          </div>
          
          {isThinking && <span className="text-xs text-yellow-400 animate-pulse">Thinking...</span>}
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={toggleAuto}
            disabled={isGameOver}
            className={`p-3 rounded border transition-all flex flex-col items-center justify-center gap-1 ${
                autoEnabled 
                ? 'bg-green-900/30 border-green-500 text-green-400' 
                : 'bg-slate-700 border-slate-600 text-slate-400 hover:bg-slate-600'
            }`}
          >
            <Zap className={`w-5 h-5 ${autoEnabled ? 'fill-current' : ''}`} />
            <span className="text-xs font-bold">Auto Party</span>
          </button>

          <button
            onClick={onEndTurn}
            disabled={isThinking || isGameOver || turnSide === 'enemy'}
            className="bg-slate-700 hover:bg-slate-600 disabled:opacity-50 border border-slate-600 text-white p-3 rounded flex flex-col items-center justify-center gap-1 transition-colors"
          >
            <RefreshCw className="w-5 h-5" />
            <span className="text-xs font-bold">End Turn</span>
          </button>
        </div>
      </div>

      {isGameOver && (
        <div className="bg-slate-900/80 p-4 rounded text-center border border-slate-600">
           <h3 className="text-xl font-cinzel text-yellow-400 mb-2">Game Over</h3>
           <button 
             onClick={() => onGenerate(themeInput)}
             className="text-sm underline text-slate-400 hover:text-white"
           >
             Play Again
           </button>
        </div>
      )}
    </div>
  );
};

export default ControlPanel;