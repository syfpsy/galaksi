import { IntelLevel, MissionType, ShipType } from '../engine/types';

export interface SelectedTarget {
  type: 'system' | 'planet' | 'fleet' | 'relay';
  systemId: string;
  planetId?: string;
  fleetId?: string;
}

export interface FleetDispatchForm {
  targetSystemId: string;
  targetPlanetId?: string;
  targetFleetId?: string;
  mission: MissionType;
  ships: Record<ShipType, number>;
  cargo: {
    ore: number;
    crystal: number;
    fuel: number;
  };
}
