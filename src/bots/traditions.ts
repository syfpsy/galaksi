import { GameEngine } from '../engine/engine';
import {
  AscensionPerkId,
  GameCommand,
  TraditionTier,
  TraditionTreeId,
} from '../engine/types';
import { canAdoptTradition, canSelectAscensionPerk } from '../engine/traditions';

const BOT_TREE_PRIORITIES: Record<string, TraditionTreeId[]> = {
  explorer: ['discovery', 'expansion', 'prosperity', 'supremacy', 'harmony'],
  industrialist: ['prosperity', 'expansion', 'discovery', 'harmony', 'supremacy'],
  admiral: ['supremacy', 'prosperity', 'expansion', 'discovery', 'harmony'],
  guardian: ['harmony', 'supremacy', 'prosperity', 'discovery', 'expansion'],
  raider: ['supremacy', 'prosperity', 'expansion', 'harmony', 'discovery'],
  qa_exploit: ['prosperity', 'supremacy', 'discovery', 'expansion', 'harmony'],
};

const BOT_PERK_PRIORITIES: Record<string, AscensionPerkId[]> = {
  explorer: ['transcendence', 'voidborne', 'galactic_force_projection', 'defender_of_the_galaxy', 'synthetic_evolution', 'ecumenopolis_mastery'],
  industrialist: ['synthetic_evolution', 'ecumenopolis_mastery', 'voidborne', 'galactic_force_projection', 'defender_of_the_galaxy', 'transcendence'],
  admiral: ['galactic_force_projection', 'defender_of_the_galaxy', 'transcendence', 'synthetic_evolution', 'voidborne', 'ecumenopolis_mastery'],
  guardian: ['defender_of_the_galaxy', 'ecumenopolis_mastery', 'galactic_force_projection', 'voidborne', 'synthetic_evolution', 'transcendence'],
  raider: ['galactic_force_projection', 'synthetic_evolution', 'transcendence', 'defender_of_the_galaxy', 'voidborne', 'ecumenopolis_mastery'],
  qa_exploit: ['synthetic_evolution', 'galactic_force_projection', 'defender_of_the_galaxy', 'transcendence', 'voidborne', 'ecumenopolis_mastery'],
};

/**
 * Autonomous decision-making for Bot Empire Traditions & Ascension Perks
 */
export function evaluateBotTraditions(
  engine: GameEngine,
  playerId: string,
  archetype: string,
  executedCommands: GameCommand[]
): void {
  const view = engine.getPlayerView(playerId);
  const traditions = view.myTraditions;
  if (!traditions) return;

  // 1. Pick Ascension Perk if slot is available
  if (traditions.availablePerkSlots > 0) {
    const perkPriority = BOT_PERK_PRIORITIES[archetype] || BOT_PERK_PRIORITIES.industrialist;
    for (const perkId of perkPriority) {
      if (!traditions.ascensionPerks.includes(perkId)) {
        const check = canSelectAscensionPerk(engine.state, playerId, perkId);
        if (check.canSelect) {
          const cmd: GameCommand = {
            type: 'SELECT_ASCENSION_PERK',
            perkId,
          };
          const receipt = engine.dispatchCommand(playerId, cmd);
          if (receipt.success) {
            executedCommands.push(cmd);
            return;
          }
        }
      }
    }
  }

  // 2. Adopt Next Tradition Tier based on tree priority
  const treePriority = BOT_TREE_PRIORITIES[archetype] || BOT_TREE_PRIORITIES.industrialist;
  for (const treeId of treePriority) {
    const tree = traditions.trees[treeId];
    if (!tree || tree.completed) continue;

    // Find next tier (1, 2, or 3)
    let nextTier: TraditionTier = 1;
    if (tree.unlockedTiers.includes(1)) {
      nextTier = tree.unlockedTiers.includes(2) ? 3 : 2;
    }

    const check = canAdoptTradition(engine.state, playerId, treeId, nextTier);
    if (check.canAdopt) {
      const cmd: GameCommand = {
        type: 'ADOPT_TRADITION',
        treeId,
        tier: nextTier,
      };
      const receipt = engine.dispatchCommand(playerId, cmd);
      if (receipt.success) {
        executedCommands.push(cmd);
        return;
      }
    }
  }
}
