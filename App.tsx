import React, { useState, useEffect, useCallback, useRef } from 'react';
import GridBoard from './components/GridBoard';
import LogPanel from './components/LogPanel';
import ControlPanel from './components/ControlPanel';
import { GameState, Entity, GameAction, LogEntry, Position } from './types';
import { generateScenario, getTacticalActions } from './services/geminiService';
import { Sword } from 'lucide-react';

const App: React.FC = () => {
  // Game State
  const [gameState, setGameState] = useState<GameState>({
    entities: [],
    turnCount: 1,
    turnSide: 'hero', // Start with heroes
    isGameOver: false,
    winner: null
  });
  
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [selectedEntityId, setSelectedEntityId] = useState<string | null>(null);
  const [isThinking, setIsThinking] = useState(false);
  const [autoPartyEnabled, setAutoPartyEnabled] = useState(false);
  
  // To prevent infinite loops in useEffect
  const processingTurnRef = useRef(false);

  const addLog = (message: string, type: LogEntry['type'] = 'info') => {
    setLogs(prev => [...prev, {
      id: Math.random().toString(36).substring(7),
      turn: gameState.turnCount,
      message,
      type
    }]);
  };

  // --- Game Logic Helpers ---

  const getEntityAt = (x: number, y: number) => gameState.entities.find(e => e.x === x && e.y === y);

  const isPositionValid = (x: number, y: number) => {
    return x >= 0 && x < 10 && y >= 0 && y < 10 && !gameState.entities.some(e => e.x === x && e.y === y);
  };

  const executeAction = (action: GameAction) => {
    setGameState(prev => {
      let newEntities = [...prev.entities];
      const actorIndex = newEntities.findIndex(e => e.id === action.actorId);
      if (actorIndex === -1) return prev; // Actor died or invalid

      const actor = { ...newEntities[actorIndex] };

      if (action.type === 'move' && action.targetX !== undefined && action.targetY !== undefined) {
        // Simple collision check again just in case
        const targetOccupied = newEntities.some(e => e.x === action.targetX && e.y === action.targetY);
        if (!targetOccupied) {
           actor.x = action.targetX;
           actor.y = action.targetY;
        }
      }

      if (action.type === 'attack' && action.targetId) {
        const targetIndex = newEntities.findIndex(e => e.id === action.targetId);
        if (targetIndex !== -1) {
          const target = { ...newEntities[targetIndex] };
          // Simple damage logic: D6 + 2-ish
          const damage = Math.floor(Math.random() * 6) + 2; 
          target.hp = Math.max(0, target.hp - damage);
          newEntities[targetIndex] = target;
          addLog(`${actor.name} hits ${target.name} for ${damage} dmg!`, 'combat');
          
          if (target.hp === 0) {
            addLog(`${target.name} falls!`, 'combat');
            newEntities = newEntities.filter(e => e.id !== target.id);
          }
        }
      }

      if (action.type === 'heal' && action.targetId) {
        const targetIndex = newEntities.findIndex(e => e.id === action.targetId);
        if (targetIndex !== -1) {
          const target = { ...newEntities[targetIndex] };
          const heal = Math.floor(Math.random() * 4) + 3;
          target.hp = Math.min(target.maxHp, target.hp + heal);
          newEntities[targetIndex] = target;
          addLog(`${actor.name} heals ${target.name} for ${heal}.`, 'ai');
        }
      }

      if (action.flavorText) {
        // Occasionally log flavor text
        if (Math.random() > 0.7) addLog(`"${action.flavorText}"`, 'info');
      }

      newEntities[actorIndex] = actor;
      
      // Check Win Condition
      const heroes = newEntities.filter(e => e.type === 'hero');
      const enemies = newEntities.filter(e => e.type === 'enemy');
      
      let winner = prev.winner;
      let isGameOver = prev.isGameOver;

      if (heroes.length === 0) {
        isGameOver = true;
        winner = 'enemy';
        addLog("The party has been defeated...", 'combat');
      } else if (enemies.length === 0) {
        isGameOver = true;
        winner = 'hero';
        addLog("Victory! The enemies are vanquished.", 'combat');
      }

      return { ...prev, entities: newEntities, isGameOver, winner };
    });
  };

  // --- Main API Interaction ---

  const handleGenerate = async (theme: string) => {
    setIsThinking(true);
    setLogs([]);
    addLog(`Generating dungeon: ${theme}...`);
    
    const entities = await generateScenario(theme);
    
    setGameState({
      entities,
      turnCount: 1,
      turnSide: 'hero',
      isGameOver: false,
      winner: null
    });
    addLog(`Encounter started! ${entities.length} entities placed.`);
    setIsThinking(false);
  };

  const executeTurnBatch = async (side: 'hero' | 'enemy') => {
    if (processingTurnRef.current || gameState.isGameOver) return;
    processingTurnRef.current = true;
    setIsThinking(true);

    // If it's player turn but auto is enabled, OR if it's enemy turn
    addLog(`AI (${side}) is thinking...`, 'ai');
    const actions = await getTacticalActions(gameState, side);
    
    // Execute actions sequentially with delay for visual clarity
    for (const action of actions) {
      if (gameState.isGameOver) break;
      executeAction(action);
      await new Promise(r => setTimeout(r, 800)); // Visual delay
    }

    setIsThinking(false);
    processingTurnRef.current = false;

    // Switch turn
    setGameState(prev => {
        if (prev.isGameOver) return prev;
        return {
            ...prev,
            turnSide: prev.turnSide === 'hero' ? 'enemy' : 'hero',
            turnCount: prev.turnSide === 'enemy' ? prev.turnCount + 1 : prev.turnCount
        };
    });
  };

  // --- Effects ---

  // Handle Auto Turns
  useEffect(() => {
    if (gameState.isGameOver) return;

    if (gameState.turnSide === 'enemy') {
        // Enemy always auto
        const timer = setTimeout(() => executeTurnBatch('enemy'), 1000);
        return () => clearTimeout(timer);
    } else if (gameState.turnSide === 'hero' && autoPartyEnabled) {
        // Hero auto if enabled
        const timer = setTimeout(() => executeTurnBatch('hero'), 1000);
        return () => clearTimeout(timer);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gameState.turnSide, autoPartyEnabled, gameState.isGameOver]); // We depend on side switching

  // --- Manual Interaction ---

  const handleTileClick = (pos: Position) => {
    if (isThinking || gameState.isGameOver || autoPartyEnabled || gameState.turnSide === 'enemy') return;

    const clickedEntity = getEntityAt(pos.x, pos.y);

    // Select own unit
    if (clickedEntity && clickedEntity.type === 'hero') {
      setSelectedEntityId(clickedEntity.id);
      return;
    }

    // Move or Attack if unit selected
    if (selectedEntityId) {
      const actor = gameState.entities.find(e => e.id === selectedEntityId);
      if (!actor) return;

      const dist = Math.abs(actor.x - pos.x) + Math.abs(actor.y - pos.y);

      // Attack
      if (clickedEntity && clickedEntity.type === 'enemy' && dist <= 1.5) { // 1.5 allows diagonals roughly
        executeAction({
            actorId: actor.id,
            type: 'attack',
            targetId: clickedEntity.id,
            flavorText: "Manual attack"
        });
        setSelectedEntityId(null);
        return;
      }

      // Move (simple range check - let's say 3 tiles for manual for now)
      if (!clickedEntity && dist <= 3 && isPositionValid(pos.x, pos.y)) {
         executeAction({
             actorId: actor.id,
             type: 'move',
             targetX: pos.x,
             targetY: pos.y,
             flavorText: "Manual move"
         });
         setSelectedEntityId(null);
      }
    }
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 flex flex-col items-center">
      <header className="w-full max-w-5xl mb-6 flex items-center justify-between border-b border-slate-800 pb-4">
        <div className="flex items-center gap-3">
           <div className="w-10 h-10 bg-purple-600 rounded-lg flex items-center justify-center shadow-lg shadow-purple-500/20">
             <Sword className="text-white" />
           </div>
           <div>
             <h1 className="text-2xl font-bold tracking-tight font-cinzel text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-blue-400">
               DungeonMind
             </h1>
             <p className="text-xs text-slate-500 uppercase tracking-widest">AI Tactical Auto-Battler</p>
           </div>
        </div>
        <div className="text-right hidden md:block">
           <p className="text-sm text-slate-400">Powered by <span className="text-white font-bold">Gemini 2.5</span></p>
        </div>
      </header>

      <main className="w-full max-w-5xl grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Game Board */}
        <div className="lg:col-span-7 flex justify-center">
          <GridBoard 
            entities={gameState.entities} 
            onTileClick={handleTileClick}
            selectedEntityId={selectedEntityId}
            targetablePositions={[]} // Could calc valid moves here
          />
        </div>

        {/* Right Column: Controls & Logs */}
        <div className="lg:col-span-5 flex flex-col gap-4 h-[600px]">
            <ControlPanel 
              onGenerate={handleGenerate}
              onAutoTurn={() => setAutoPartyEnabled(true)} // Handled by state toggle mainly
              onEndTurn={() => setGameState(p => ({ ...p, turnSide: 'enemy' }))}
              isThinking={isThinking}
              isGameOver={gameState.isGameOver}
              turnSide={gameState.turnSide}
              autoEnabled={autoPartyEnabled}
              toggleAuto={() => setAutoPartyEnabled(prev => !prev)}
            />
            
            <LogPanel logs={logs} />
        </div>

      </main>

      {/* Footer for permissions warning if needed, or simple credits */}
      <div className="mt-8 text-slate-600 text-xs max-w-2xl text-center">
        Manual Play: Click a hero to select. Click an empty tile to move (Range 3). Click an adjacent enemy to attack.
        <br/>
        Auto Party: The AI will control all heroes.
      </div>
    </div>
  );
};

export default App;