import { GoogleGenAI, Type } from "@google/genai";
import { Entity, GameState, GameAction } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Helper to create a prompt context
const getContext = (state: GameState) => {
  return JSON.stringify({
    gridSize: "10x10",
    entities: state.entities.map(e => ({
      id: e.id,
      name: e.name,
      type: e.type,
      class: e.class,
      hp: `${e.hp}/${e.maxHp}`,
      position: { x: e.x, y: e.y }
    }))
  });
};

export const generateScenario = async (theme: string): Promise<Entity[]> => {
  const model = "gemini-2.5-flash";
  
  const systemInstruction = `
    You are a Dungeon Master for a tactical RPG. 
    Create a balanced encounter for a 10x10 grid (x:0-9, y:0-9).
    Generate 3 Hero entities and 3-4 Enemy entities based on the theme: "${theme}".
    Heroes should start near y=9 (bottom), Enemies near y=0 (top).
    Ensure unique IDs.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: "Generate the entity list.",
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["hero", "enemy"] },
              class: { type: Type.STRING, enum: ["warrior", "mage", "rogue", "cleric", "monster", "boss"] },
              hp: { type: Type.INTEGER },
              maxHp: { type: Type.INTEGER },
              x: { type: Type.INTEGER },
              y: { type: Type.INTEGER },
              emoji: { type: Type.STRING },
              description: { type: Type.STRING }
            },
            required: ["id", "name", "type", "class", "hp", "maxHp", "x", "y", "emoji"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as Entity[];
    }
    throw new Error("No text returned from AI");
  } catch (error) {
    console.error("Failed to generate scenario:", error);
    // Fallback scenario
    return [
      { id: 'h1', name: 'Sir Alaric', type: 'hero', class: 'warrior', hp: 30, maxHp: 30, x: 4, y: 9, emoji: '🛡️', description: 'A brave knight.' },
      { id: 'h2', name: 'Elara', type: 'hero', class: 'mage', hp: 20, maxHp: 20, x: 3, y: 8, emoji: '🔮', description: 'A mystic sorceress.' },
      { id: 'e1', name: 'Goblin', type: 'enemy', class: 'monster', hp: 15, maxHp: 15, x: 4, y: 1, emoji: '👹', description: 'A sneaky goblin.' },
      { id: 'e2', name: 'Orc', type: 'enemy', class: 'monster', hp: 25, maxHp: 25, x: 5, y: 2, emoji: '👺', description: 'A brutal orc.' }
    ];
  }
};

export const getTacticalActions = async (gameState: GameState, activeSide: 'hero' | 'enemy'): Promise<GameAction[]> => {
  const model = "gemini-2.5-flash";
  const context = getContext(gameState);
  
  const systemInstruction = `
    You are the AI controlling the ${activeSide === 'hero' ? 'HERO PARTY' : 'ENEMY FORCES'}.
    Analyze the current game state and provide a list of tactical actions for EACH living ${activeSide} entity.
    
    Rules:
    1. Grid is 10x10 (0-9). 
    2. Movement range is generally 1-2 tiles. 
    3. Melee range is adjacent (distance 1 or 1.4 diagonal). Ranged is distance 4.
    4. 'attack' requires a targetId.
    5. 'move' requires targetX and targetY.
    6. Provide concise, flavorful 'flavorText' for the action log.
    7. Do not move into occupied squares unless attacking (but you can't occupy the same square).
    8. Be smart: Focus low HP targets, protect healers.
  `;

  try {
    const response = await ai.models.generateContent({
      model,
      contents: `Current State JSON: ${context}`,
      config: {
        systemInstruction,
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              actorId: { type: Type.STRING },
              type: { type: Type.STRING, enum: ["move", "attack", "wait", "heal"] },
              targetX: { type: Type.INTEGER, nullable: true },
              targetY: { type: Type.INTEGER, nullable: true },
              targetId: { type: Type.STRING, nullable: true },
              flavorText: { type: Type.STRING }
            },
            required: ["actorId", "type", "flavorText"]
          }
        }
      }
    });

    if (response.text) {
      return JSON.parse(response.text) as GameAction[];
    }
    return [];
  } catch (error) {
    console.error("Failed to get AI actions:", error);
    return [];
  }
};
