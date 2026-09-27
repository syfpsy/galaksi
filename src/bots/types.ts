import { GameEngine } from '../engine/engine';
import { GameCommand } from '../engine/types';

export interface IBotAgent {
  playerId: string;
  archetype: 'industrialist' | 'raider' | 'guardian' | 'explorer' | 'admiral' | 'qa_exploit';
  update(engine: GameEngine): GameCommand[];
}
