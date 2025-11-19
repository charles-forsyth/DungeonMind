import React from 'react';
import { Entity, Position } from '../types';
import { Sword, Shield, Skull, Heart } from 'lucide-react';

interface GridBoardProps {
  entities: Entity[];
  onTileClick: (pos: Position) => void;
  selectedEntityId: string | null;
  targetablePositions?: Position[];
}

const GRID_SIZE = 10;

const GridBoard: React.FC<GridBoardProps> = ({ entities, onTileClick, selectedEntityId, targetablePositions = [] }) => {
  
  // Create grid array
  const tiles = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      tiles.push({ x, y });
    }
  }

  const getEntityAt = (x: number, y: number) => entities.find(e => e.x === x && e.y === y);

  const isTargetable = (x: number, y: number) => {
    return targetablePositions.some(p => p.x === x && p.y === y);
  };

  return (
    <div 
      className="grid grid-cols-10 gap-1 bg-slate-800 p-2 rounded-lg border-4 border-slate-700 shadow-2xl select-none"
      style={{ maxWidth: '600px', aspectRatio: '1/1' }}
    >
      {tiles.map((tile) => {
        const entity = getEntityAt(tile.x, tile.y);
        const isSelected = entity?.id === selectedEntityId;
        const canTarget = isTargetable(tile.x, tile.y);

        let tileClass = "relative w-full h-full bg-slate-900 rounded-sm flex items-center justify-center text-2xl cursor-pointer transition-all duration-200 hover:bg-slate-700";
        
        if (isSelected) tileClass += " ring-2 ring-yellow-400 bg-slate-800";
        if (canTarget) tileClass += " ring-2 ring-red-500 bg-red-900/20";

        return (
          <div 
            key={`${tile.x}-${tile.y}`}
            className={tileClass}
            onClick={() => onTileClick(tile)}
          >
            {/* Grid coordinate helper for dev debugging (optional, hidden for aesthetics) */}
            {/* <span className="absolute top-0 left-0 text-[8px] text-slate-600 p-0.5">{tile.x},{tile.y}</span> */}

            {entity && (
              <div className={`relative group w-full h-full flex items-center justify-center transform transition-transform ${entity.type === 'enemy' ? 'text-red-400' : 'text-blue-400'}`}>
                <span className="text-3xl drop-shadow-md filter">{entity.emoji}</span>
                
                {/* Simple HP Bar */}
                <div className="absolute bottom-0 left-0.5 right-0.5 h-1 bg-slate-700 rounded-full overflow-hidden">
                  <div 
                    className={`h-full ${entity.type === 'hero' ? 'bg-green-500' : 'bg-red-500'}`} 
                    style={{ width: `${(entity.hp / entity.maxHp) * 100}%` }}
                  />
                </div>

                {/* Hover Tooltip */}
                <div className="absolute bottom-full mb-2 hidden group-hover:block z-10 w-32 bg-black/90 text-white text-xs rounded p-2 pointer-events-none shadow-xl border border-slate-600">
                  <p className="font-bold text-yellow-400">{entity.name}</p>
                  <p className="capitalize text-slate-300">{entity.class}</p>
                  <div className="flex items-center gap-1 mt-1">
                    <Heart className="w-3 h-3 text-red-500" /> 
                    <span>{entity.hp}/{entity.maxHp}</span>
                  </div>
                  <p className="italic text-slate-500 mt-1 leading-tight">{entity.description}</p>
                </div>
              </div>
            )}
            
            {canTarget && !entity && (
               <div className="w-2 h-2 bg-red-500 rounded-full opacity-50 animate-pulse" />
            )}
          </div>
        );
      })}
    </div>
  );
};

export default GridBoard;
