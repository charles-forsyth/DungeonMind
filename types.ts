export interface Position {
  x: number;
  y: number;
}

export type EntityType = 'hero' | 'enemy';
export type EntityClass = 'warrior' | 'mage' | 'rogue' | 'cleric' | 'monster' | 'boss';

export interface Entity {
  id: string;
  name: string;
  type: EntityType;
  class: EntityClass;
  hp: number;
  maxHp: number;
  x: number;
  y: number;
  emoji: string;
  description: string;
}

export interface GameAction {
  actorId: string;
  type: 'move' | 'attack' | 'wait' | 'heal';
  targetX?: number; // For move
  targetY?: number; // For move
  targetId?: string; // For attack/heal
  flavorText: string;
}

export interface LogEntry {
  id: string;
  turn: number;
  message: string;
  type: 'info' | 'combat' | 'ai';
}

export interface GameState {
  entities: Entity[];
  turnCount: number;
  turnSide: EntityType; // whose turn it is
  isGameOver: boolean;
  winner: EntityType | null;
}
