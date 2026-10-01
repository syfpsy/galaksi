import React, { useEffect, useRef, useState, useCallback } from 'react';
import * as THREE from 'three';
import { BattleReport, CombatRound, DefenseStructureType, ShipType } from '../../engine/types';
import { SHIP_STATS } from '../../engine/constants';
import { WeaponModuleId, loadSavedLoadouts, DEFAULT_LOADOUTS, WEAPON_MODULES } from '../../engine/shipDesign';
import { sound } from '../sound';
import { Camera, Eye, Flame, Maximize2, Pause, Play, RotateCcw, Shield, Sparkles, Swords, Zap } from 'lucide-react';

export type CameraPreset = 'cinematic' | 'tactical' | 'attacker' | 'defender';
export type TacticalInterventionType =
  | 'focus_fire'
  | 'shield_overcharge'
  | 'fighter_swarm'
  | 'emergency_ftl';

export interface TacticalCombat3DArenaProps {
  report: BattleReport;
  currentRoundIdx: number;
  isPlaying: boolean;
  onTogglePlay?: () => void;
  onSelectRound?: (roundIdx: number) => void;
  onTacticalIntervention?: (tactic: TacticalInterventionType) => void;
}

interface Particle {
  mesh: THREE.Mesh;
  velocity: THREE.Vector3;
  life: number;
  maxLife: number;
}

interface LaserBeam {
  mesh: THREE.Mesh;
  light?: THREE.PointLight;
  duration: number;
  elapsed: number;
}

interface CombatProjectile {
  mesh: THREE.Object3D;
  startPos: THREE.Vector3;
  targetPos: THREE.Vector3;
  progress: number;
  speed: number;
  weaponType: WeaponModuleId;
  isAttacker: boolean;
  smokeTimer?: number;
}

export const TacticalCombat3DArena: React.FC<TacticalCombat3DArenaProps> = ({
  report,
  currentRoundIdx,
  isPlaying,
  onTogglePlay,
  onSelectRound,
  onTacticalIntervention,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const [cameraPreset, setCameraPreset] = useState<CameraPreset>('cinematic');
  const [showGrid, setShowGrid] = useState(true);

  // Tactical Intervention Command Points (CP) & Battle Juice
  const [commandPoints, setCommandPoints] = useState<number>(100);
  const [activeTacticalBanner, setActiveTacticalBanner] = useState<{
    text: string;
    icon: string;
    color: string;
  } | null>(null);
  const [combatLogTicker, setCombatLogTicker] = useState<string>(
    '📡 Taktik Muharebe İletişimi: Filo savaş düzenine geçti. Komuta emirleri hazır.'
  );
  const cameraShakeIntensityRef = useRef<number>(0);

  // References for Three.js instance
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const animFrameIdRef = useRef<number | null>(null);

  // Dynamic combat entity groups
  const attackerShipsGroupRef = useRef<THREE.Group | null>(null);
  const defenderShipsGroupRef = useRef<THREE.Group | null>(null);
  const fxGroupRef = useRef<THREE.Group | null>(null);

  // Live particle and projectile arrays
  const activeParticlesRef = useRef<Particle[]>([]);
  const activeLasersRef = useRef<LaserBeam[]>([]);
  const activeProjectilesRef = useRef<CombatProjectile[]>([]);

  // Camera animation target & orbit state
  const cameraTargetRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 0, 0));
  const cameraDesiredPosRef = useRef<THREE.Vector3>(new THREE.Vector3(0, 16, 52));
  const isDraggingRef = useRef(false);
  const previousMousePositionRef = useRef({ x: 0, y: 0 });
  const orbitRotationRef = useRef({ theta: 0, phi: 0.28 });
  const orbitDistanceRef = useRef(52);

  const currentRound: CombatRound | undefined = report.rounds[currentRoundIdx];
  const totalRounds = report.rounds.length;

  // Camera presets coordinates
  const applyCameraPreset = useCallback((preset: CameraPreset) => {
    setCameraPreset(preset);
    if (preset === 'cinematic') {
      cameraDesiredPosRef.current.set(0, 14, 50);
      cameraTargetRef.current.set(0, 0, 0);
      orbitDistanceRef.current = 50;
      orbitRotationRef.current = { theta: 0, phi: 0.28 };
    } else if (preset === 'tactical') {
      cameraDesiredPosRef.current.set(0, 48, 22);
      cameraTargetRef.current.set(0, 0, 0);
      orbitDistanceRef.current = 55;
      orbitRotationRef.current = { theta: 0, phi: 1.15 };
    } else if (preset === 'attacker') {
      cameraDesiredPosRef.current.set(-42, 10, 8);
      cameraTargetRef.current.set(15, 0, 0);
      orbitDistanceRef.current = 45;
      orbitRotationRef.current = { theta: -1.4, phi: 0.2 };
    } else if (preset === 'defender') {
      cameraDesiredPosRef.current.set(42, 10, -8);
      cameraTargetRef.current.set(-15, 0, 0);
      orbitDistanceRef.current = 45;
      orbitRotationRef.current = { theta: 1.4, phi: 0.2 };
    }
  }, []);

  // --- Procedural Low-Poly Sci-Fi Ship Builders ---
  const createScoutMesh = useCallback((isAttacker: boolean) => {
    const group = new THREE.Group();
    const primaryColor = isAttacker ? 0xf43f5e : 0x00f3ff;
    const accentColor = isAttacker ? 0xffa500 : 0x38bdf8;

    // Needle fuselage
    const bodyGeo = new THREE.ConeGeometry(0.7, 3.2, 5);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.85,
      roughness: 0.3,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = isAttacker ? -Math.PI / 2 : Math.PI / 2;
    group.add(body);

    // Twin swept wings
    const wingGeo = new THREE.BoxGeometry(0.1, 0.25, 2.6);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.7, roughness: 0.4 });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(isAttacker ? -0.4 : 0.4, 0, 0);
    group.add(wing);

    // Glowing thruster
    const thrusterGeo = new THREE.CylinderGeometry(0.2, 0.4, 0.5, 6);
    const thrusterMat = new THREE.MeshBasicMaterial({
      color: accentColor,
      blending: THREE.AdditiveBlending,
    });
    const thruster = new THREE.Mesh(thrusterGeo, thrusterMat);
    thruster.rotation.z = isAttacker ? -Math.PI / 2 : Math.PI / 2;
    thruster.position.set(isAttacker ? -1.7 : 1.7, 0, 0);
    group.add(thruster);

    return group;
  }, []);

  const createFighterMesh = useCallback((isAttacker: boolean) => {
    const group = new THREE.Group();
    const primaryColor = isAttacker ? 0xe11d48 : 0x0284c7;
    const accentColor = isAttacker ? 0xf59e0b : 0x38bdf8;

    // Delta fuselage
    const bodyGeo = new THREE.ConeGeometry(1.1, 4.2, 4);
    const bodyMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.88,
      roughness: 0.28,
    });
    const body = new THREE.Mesh(bodyGeo, bodyMat);
    body.rotation.z = isAttacker ? -Math.PI / 2 : Math.PI / 2;
    group.add(body);

    // Dual swept wings with wingtip fins
    const wingGeo = new THREE.BoxGeometry(0.15, 0.35, 4.4);
    const wingMat = new THREE.MeshStandardMaterial({ color: 0x0f172a, metalness: 0.8, roughness: 0.35 });
    const wing = new THREE.Mesh(wingGeo, wingMat);
    wing.position.set(isAttacker ? -0.8 : 0.8, 0, 0);
    group.add(wing);

    // Dual engines
    [-0.9, 0.9].forEach((zOffset) => {
      const engGeo = new THREE.CylinderGeometry(0.25, 0.35, 1.0, 6);
      const engMat = new THREE.MeshBasicMaterial({ color: accentColor, blending: THREE.AdditiveBlending });
      const eng = new THREE.Mesh(engGeo, engMat);
      eng.rotation.z = isAttacker ? -Math.PI / 2 : Math.PI / 2;
      eng.position.set(isAttacker ? -2.0 : 2.0, 0, zOffset);
      group.add(eng);
    });

    return group;
  }, []);

  const createTransportMesh = useCallback((isAttacker: boolean) => {
    const group = new THREE.Group();
    const primaryColor = isAttacker ? 0xb45309 : 0x0d9488;

    // Heavy cargo hull
    const hullGeo = new THREE.BoxGeometry(4.0, 1.8, 2.2);
    const hullMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.75,
      roughness: 0.45,
    });
    const hull = new THREE.Mesh(hullGeo, hullMat);
    group.add(hull);

    // Forward cockpit
    const bridgeGeo = new THREE.BoxGeometry(1.2, 1.0, 1.4);
    const bridgeMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.9, roughness: 0.2 });
    const bridge = new THREE.Mesh(bridgeGeo, bridgeMat);
    bridge.position.set(isAttacker ? 2.2 : -2.2, 0.3, 0);
    group.add(bridge);

    // 4 corner engine pods
    [-0.7, 0.7].forEach((y) => {
      [-1.2, 1.2].forEach((z) => {
        const podGeo = new THREE.CylinderGeometry(0.25, 0.3, 1.2, 6);
        const podMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, blending: THREE.AdditiveBlending });
        const pod = new THREE.Mesh(podGeo, podMat);
        pod.rotation.z = isAttacker ? -Math.PI / 2 : Math.PI / 2;
        pod.position.set(isAttacker ? -2.2 : 2.2, y, z);
        group.add(pod);
      });
    });

    return group;
  }, []);

  const createBattleshipMesh = useCallback((isAttacker: boolean) => {
    const group = new THREE.Group();
    const primaryColor = isAttacker ? 0x991b1b : 0x1e3a8a;
    const accentColor = isAttacker ? 0xf59e0b : 0x00f3ff;

    // Segmented capital hull
    const mainHullGeo = new THREE.BoxGeometry(7.5, 2.2, 3.2);
    const mainHullMat = new THREE.MeshStandardMaterial({
      color: primaryColor,
      metalness: 0.9,
      roughness: 0.25,
    });
    const mainHull = new THREE.Mesh(mainHullGeo, mainHullMat);
    group.add(mainHull);

    // Armored Prow Cone
    const prowGeo = new THREE.ConeGeometry(2.0, 3.5, 4);
    const prowMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.95, roughness: 0.2 });
    const prow = new THREE.Mesh(prowGeo, prowMat);
    prow.rotation.z = isAttacker ? -Math.PI / 2 : Math.PI / 2;
    prow.position.set(isAttacker ? 4.5 : -4.5, 0, 0);
    group.add(prow);

    // Superstructure Tower
    const towerGeo = new THREE.BoxGeometry(1.8, 1.5, 1.4);
    const towerMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.85, roughness: 0.3 });
    const tower = new THREE.Mesh(towerGeo, towerMat);
    tower.position.set(isAttacker ? -0.8 : 0.8, 1.6, 0);
    group.add(tower);

    // Dorsal Heavy Turret Batteries
    [-1.8, 1.8].forEach((xOffset) => {
      const turretBaseGeo = new THREE.CylinderGeometry(0.6, 0.7, 0.4, 8);
      const turretBaseMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.9, roughness: 0.2 });
      const turret = new THREE.Mesh(turretBaseGeo, turretBaseMat);
      turret.position.set(xOffset, 1.2, 0);

      // Gun Barrels
      const barrelGeo = new THREE.CylinderGeometry(0.1, 0.1, 1.4, 6);
      const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.95, roughness: 0.15 });
      const barrel1 = new THREE.Mesh(barrelGeo, barrelMat);
      barrel1.rotation.z = isAttacker ? -Math.PI / 2 : Math.PI / 2;
      barrel1.position.set(isAttacker ? 0.8 : -0.8, 0.1, -0.2);
      const barrel2 = barrel1.clone();
      barrel2.position.z = 0.2;

      turret.add(barrel1);
      turret.add(barrel2);
      group.add(turret);
    });

    // Massive Quad Thrusters
    [-0.6, 0.6].forEach((y) => {
      [-0.8, 0.8].forEach((z) => {
        const engGeo = new THREE.CylinderGeometry(0.4, 0.6, 1.4, 8);
        const engMat = new THREE.MeshBasicMaterial({ color: accentColor, blending: THREE.AdditiveBlending });
        const eng = new THREE.Mesh(engGeo, engMat);
        eng.rotation.z = isAttacker ? -Math.PI / 2 : Math.PI / 2;
        eng.position.set(isAttacker ? -4.0 : 4.0, y, z);
        group.add(eng);
      });
    });

    return group;
  }, []);

  // --- Procedural 3D Planetary Defense Platform Builders ---
  const createMissileBatteryMesh = useCallback(() => {
    const group = new THREE.Group();
    // Armored Bunker Base
    const baseGeo = new THREE.CylinderGeometry(1.6, 2.0, 1.0, 6);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x334155, metalness: 0.8, roughness: 0.3 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    group.add(base);

    // Launcher Box Turret
    const boxGeo = new THREE.BoxGeometry(1.2, 0.8, 1.4);
    const boxMat = new THREE.MeshStandardMaterial({ color: 0x1e293b, metalness: 0.9, roughness: 0.2 });
    const launcherBox = new THREE.Mesh(boxGeo, boxMat);
    launcherBox.position.set(-0.3, 0.9, 0);
    launcherBox.rotation.z = -Math.PI / 6;
    group.add(launcherBox);

    // Glowing Missile Tips
    [-0.3, 0.3].forEach((z) => {
      const tipGeo = new THREE.ConeGeometry(0.15, 0.6, 6);
      const tipMat = new THREE.MeshBasicMaterial({ color: 0x38bdf8 });
      const tip = new THREE.Mesh(tipGeo, tipMat);
      tip.rotation.z = -Math.PI / 2;
      tip.position.set(-0.8, 1.1, z);
      group.add(tip);
    });

    return group;
  }, []);

  const createPlasmaTurretMesh = useCallback(() => {
    const group = new THREE.Group();
    // Reinforced Pedestal
    const baseGeo = new THREE.CylinderGeometry(1.8, 2.4, 1.2, 8);
    const baseMat = new THREE.MeshStandardMaterial({ color: 0x1f2937, metalness: 0.85, roughness: 0.25 });
    const base = new THREE.Mesh(baseGeo, baseMat);
    group.add(base);

    // Rotating Dome
    const domeGeo = new THREE.SphereGeometry(1.3, 10, 8, 0, Math.PI * 2, 0, Math.PI / 2);
    const domeMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.9, roughness: 0.2 });
    const dome = new THREE.Mesh(domeGeo, domeMat);
    dome.position.y = 0.6;
    group.add(dome);

    // Dual Heavy Plasma Cannon Barrels
    [-0.4, 0.4].forEach((z) => {
      const barrelGeo = new THREE.CylinderGeometry(0.2, 0.25, 2.4, 8);
      const barrelMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.95 });
      const barrel = new THREE.Mesh(barrelGeo, barrelMat);
      barrel.rotation.z = -Math.PI / 2;
      barrel.position.set(-1.2, 1.1, z);
      group.add(barrel);

      // Glowing Plasma Chamber Ring
      const ringGeo = new THREE.TorusGeometry(0.28, 0.08, 6, 12);
      const ringMat = new THREE.MeshBasicMaterial({ color: 0xf97316 });
      const ring = new THREE.Mesh(ringGeo, ringMat);
      ring.rotation.y = Math.PI / 2;
      ring.position.set(-0.6, 1.1, z);
      group.add(ring);
    });

    return group;
  }, []);

  const createIonCannonMesh = useCallback(() => {
    const group = new THREE.Group();
    // Massive Hexagonal Fortress Core
    const coreGeo = new THREE.CylinderGeometry(2.2, 2.8, 1.8, 6);
    const coreMat = new THREE.MeshStandardMaterial({ color: 0x111827, metalness: 0.9, roughness: 0.2 });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Spinal Heavy Ion Projector Tube
    const tubeGeo = new THREE.CylinderGeometry(0.45, 0.6, 3.8, 8);
    const tubeMat = new THREE.MeshStandardMaterial({ color: 0x374151, metalness: 0.95, roughness: 0.15 });
    const tube = new THREE.Mesh(tubeGeo, tubeMat);
    tube.rotation.z = -Math.PI / 2;
    tube.position.set(-1.8, 1.4, 0);
    group.add(tube);

    // Multi-stage Violet Energy Acceleration Coils
    [-2.2, -1.5, -0.8].forEach((x) => {
      const coilGeo = new THREE.TorusGeometry(0.65, 0.12, 8, 16);
      const coilMat = new THREE.MeshBasicMaterial({ color: 0xa855f7 });
      const coil = new THREE.Mesh(coilGeo, coilMat);
      coil.rotation.y = Math.PI / 2;
      coil.position.set(x, 1.4, 0);
      group.add(coil);
    });

    // Muzzle Emitter Glow
    const emitterGeo = new THREE.SphereGeometry(0.35, 8, 8);
    const emitterMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, blending: THREE.AdditiveBlending });
    const emitter = new THREE.Mesh(emitterGeo, emitterMat);
    emitter.position.set(-3.7, 1.4, 0);
    group.add(emitter);

    return group;
  }, []);

  // Spawn visual ship models for a fleet according to current counts
  const populateFleetGroup = useCallback(
    (
      group: THREE.Group,
      shipCounts: Record<ShipType, number>,
      isAttacker: boolean,
      defenses?: Record<DefenseStructureType, number>
    ) => {
      // Clear previous models
      while (group.children.length > 0) {
        const obj = group.children[0];
        group.remove(obj);
      }

      // Class layout positions
      const layoutSlots: Record<ShipType, { x: number; y: number; z: number }[]> = {
        battleship: [
          { x: isAttacker ? -28 : 28, y: 0, z: 0 },
          { x: isAttacker ? -32 : 32, y: 2.5, z: -8 },
          { x: isAttacker ? -32 : 32, y: -2.5, z: 8 },
        ],
        fighter: [
          { x: isAttacker ? -18 : 18, y: 3.5, z: -10 },
          { x: isAttacker ? -16 : 16, y: 1.5, z: -5 },
          { x: isAttacker ? -15 : 15, y: -1.5, z: 5 },
          { x: isAttacker ? -18 : 18, y: -3.5, z: 10 },
          { x: isAttacker ? -19 : 19, y: 0, z: -14 },
          { x: isAttacker ? -19 : 19, y: 0, z: 14 },
        ],
        scout: [
          { x: isAttacker ? -14 : 14, y: 4.5, z: -16 },
          { x: isAttacker ? -13 : 13, y: -4.5, z: 16 },
          { x: isAttacker ? -12 : 12, y: 0, z: -20 },
          { x: isAttacker ? -12 : 12, y: 0, z: 20 },
        ],
        transport: [
          { x: isAttacker ? -34 : 34, y: 1.0, z: -5 },
          { x: isAttacker ? -34 : 34, y: -1.0, z: 5 },
        ],
      };

      (['battleship', 'fighter', 'scout', 'transport'] as ShipType[]).forEach((st) => {
        const count = shipCounts[st] || 0;
        if (count <= 0) return;

        const slots = layoutSlots[st];
        const numToRender = Math.min(slots.length, Math.max(1, count));

        for (let i = 0; i < numToRender; i++) {
          let mesh: THREE.Group;
          if (st === 'battleship') mesh = createBattleshipMesh(isAttacker);
          else if (st === 'fighter') mesh = createFighterMesh(isAttacker);
          else if (st === 'scout') mesh = createScoutMesh(isAttacker);
          else mesh = createTransportMesh(isAttacker);

          const slot = slots[i % slots.length];
          mesh.position.set(slot.x, slot.y, slot.z);

          // Store ship type & side in user data
          mesh.userData = { shipType: st, isAttacker, initialCount: count };
          group.add(mesh);
        }
      });

      // Render defender orbital defense platforms if present
      if (!isAttacker && defenses) {
        const defenseSlots: Record<DefenseStructureType, { x: number; y: number; z: number }[]> = {
          ion_cannon: [
            { x: 38, y: 0, z: 0 },
            { x: 40, y: 4, z: -8 },
            { x: 40, y: -4, z: 8 },
          ],
          plasma_turret: [
            { x: 36, y: 3, z: -14 },
            { x: 36, y: -3, z: 14 },
            { x: 35, y: 5, z: 6 },
            { x: 35, y: -5, z: -6 },
          ],
          missile_battery: [
            { x: 33, y: 4, z: -20 },
            { x: 33, y: -4, z: 20 },
            { x: 32, y: 6, z: -10 },
            { x: 32, y: -6, z: 10 },
            { x: 34, y: 0, z: -18 },
            { x: 34, y: 0, z: 18 },
          ],
        };

        (['ion_cannon', 'plasma_turret', 'missile_battery'] as DefenseStructureType[]).forEach((dt) => {
          const count = defenses[dt] || 0;
          if (count <= 0) return;

          const slots = defenseSlots[dt];
          const numToRender = Math.min(slots.length, Math.max(1, count));

          for (let i = 0; i < numToRender; i++) {
            let mesh: THREE.Group;
            if (dt === 'ion_cannon') mesh = createIonCannonMesh();
            else if (dt === 'plasma_turret') mesh = createPlasmaTurretMesh();
            else mesh = createMissileBatteryMesh();

            const slot = slots[i % slots.length];
            mesh.position.set(slot.x, slot.y, slot.z);

            mesh.userData = {
              isDefense: true,
              defenseType: dt,
              isAttacker: false,
              initialCount: count,
            };
            group.add(mesh);
          }
        });
      }
    },
    [
      createBattleshipMesh,
      createFighterMesh,
      createScoutMesh,
      createTransportMesh,
      createMissileBatteryMesh,
      createPlasmaTurretMesh,
      createIonCannonMesh,
    ]
  );

  // --- Weapon-Specific Projectile & VFX Spawners ---
  const spawnLaserBeam = useCallback((start: THREE.Vector3, end: THREE.Vector3, isAttacker: boolean) => {
    if (!fxGroupRef.current) return;
    const fxGroup = fxGroupRef.current;
    sound.playLaser();

    const distance = start.distanceTo(end);
    const beamGeo = new THREE.CylinderGeometry(0.18, 0.18, distance, 6);
    const beamMat = new THREE.MeshBasicMaterial({
      color: isAttacker ? 0xf43f5e : 0x00f3ff,
      blending: THREE.AdditiveBlending,
      transparent: true,
      opacity: 0.95,
    });
    const beam = new THREE.Mesh(beamGeo, beamMat);

    const midPoint = new THREE.Vector3().addVectors(start, end).multiplyScalar(0.5);
    beam.position.copy(midPoint);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());

    fxGroup.add(beam);
    activeLasersRef.current.push({
      mesh: beam,
      duration: 0.32,
      elapsed: 0,
    });

    // Deflector shield flare at impact target
    const shieldGeo = new THREE.SphereGeometry(2.5, 12, 12, 0, Math.PI * 2, 0, Math.PI / 2);
    const shieldMat = new THREE.MeshBasicMaterial({
      color: isAttacker ? 0x00f3ff : 0xf59e0b,
      transparent: true,
      opacity: 0.7,
      blending: THREE.AdditiveBlending,
      side: THREE.DoubleSide,
    });
    const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
    shieldMesh.position.copy(end);
    shieldMesh.rotation.y = isAttacker ? Math.PI / 2 : -Math.PI / 2;
    fxGroup.add(shieldMesh);
    activeLasersRef.current.push({
      mesh: shieldMesh,
      duration: 0.28,
      elapsed: 0,
    });
  }, []);

  const spawnPlasmaOrb = useCallback((start: THREE.Vector3, end: THREE.Vector3, isAttacker: boolean) => {
    if (!fxGroupRef.current) return;
    const fxGroup = fxGroupRef.current;
    sound.playPlasma();

    const group = new THREE.Group();
    // Inner superheated molten core
    const coreGeo = new THREE.SphereGeometry(0.48, 10, 10);
    const coreMat = new THREE.MeshBasicMaterial({
      color: 0xfffbeb,
      blending: THREE.AdditiveBlending,
    });
    const core = new THREE.Mesh(coreGeo, coreMat);
    group.add(core);

    // Outer fiery plasma corona
    const coronaGeo = new THREE.SphereGeometry(0.85, 10, 10);
    const coronaMat = new THREE.MeshBasicMaterial({
      color: isAttacker ? 0xf97316 : 0xf59e0b,
      transparent: true,
      opacity: 0.85,
      blending: THREE.AdditiveBlending,
    });
    const corona = new THREE.Mesh(coronaGeo, coronaMat);
    group.add(corona);

    group.position.copy(start);
    fxGroup.add(group);

    activeProjectilesRef.current.push({
      mesh: group,
      startPos: start,
      targetPos: end,
      progress: 0,
      speed: 1.85,
      weaponType: 'plasma',
      isAttacker,
    });
  }, []);

  const spawnRailgunSlug = useCallback((start: THREE.Vector3, end: THREE.Vector3, isAttacker: boolean) => {
    if (!fxGroupRef.current) return;
    const fxGroup = fxGroupRef.current;
    sound.playRailgun();

    // Hypersonic solid tungsten projectile
    const slugGeo = new THREE.CylinderGeometry(0.09, 0.14, 3.2, 5);
    const slugMat = new THREE.MeshBasicMaterial({
      color: isAttacker ? 0x93c5fd : 0xbae6fd,
      blending: THREE.AdditiveBlending,
    });
    const slug = new THREE.Mesh(slugGeo, slugMat);
    slug.position.copy(start);
    slug.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), end.clone().sub(start).normalize());
    fxGroup.add(slug);

    activeProjectilesRef.current.push({
      mesh: slug,
      startPos: start,
      targetPos: end,
      progress: 0,
      speed: 3.5,
      weaponType: 'railgun',
      isAttacker,
    });
  }, []);

  const spawnTorpedoMissile = useCallback((start: THREE.Vector3, end: THREE.Vector3, isAttacker: boolean) => {
    if (!fxGroupRef.current) return;
    const fxGroup = fxGroupRef.current;
    sound.playTorpedo();

    const group = new THREE.Group();
    // Fuselage
    const fuseGeo = new THREE.CylinderGeometry(0.24, 0.24, 1.6, 6);
    const fuseMat = new THREE.MeshStandardMaterial({ color: 0x3b0764, metalness: 0.85 });
    const fuse = new THREE.Mesh(fuseGeo, fuseMat);
    fuse.rotation.x = Math.PI / 2;
    group.add(fuse);

    // Purple warhead
    const warheadGeo = new THREE.ConeGeometry(0.28, 0.7, 6);
    const warheadMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, blending: THREE.AdditiveBlending });
    const warhead = new THREE.Mesh(warheadGeo, warheadMat);
    warhead.rotation.x = Math.PI / 2;
    warhead.position.z = 1.0;
    group.add(warhead);

    // Exhaust glow
    const exhaustGeo = new THREE.CylinderGeometry(0.08, 0.35, 0.4, 6);
    const exhaustMat = new THREE.MeshBasicMaterial({ color: 0xd946ef, blending: THREE.AdditiveBlending });
    const exhaust = new THREE.Mesh(exhaustGeo, exhaustMat);
    exhaust.rotation.x = Math.PI / 2;
    exhaust.position.z = -0.9;
    group.add(exhaust);

    group.position.copy(start);
    group.lookAt(end);
    fxGroup.add(group);

    activeProjectilesRef.current.push({
      mesh: group,
      startPos: start,
      targetPos: end,
      progress: 0,
      speed: 1.35,
      weaponType: 'torpedo',
      isAttacker,
    });
  }, []);

  // Trigger weapon fire VFX for this round
  const triggerRoundFireEffects = useCallback(
    (round: CombatRound) => {
      if (!fxGroupRef.current || !attackerShipsGroupRef.current || !defenderShipsGroupRef.current) return;

      const fxGroup = fxGroupRef.current;
      const attShips = attackerShipsGroupRef.current.children;
      const defShips = defenderShipsGroupRef.current.children;

      if (attShips.length === 0 || defShips.length === 0) return;

      const playerLoadouts = loadSavedLoadouts();

      // 1. Attacker Weapon Salvos
      if (round.attackerDamageDealt > 0) {
        const numSalvos = Math.min(attShips.length, 5);

        for (let i = 0; i < numSalvos; i++) {
          const shooter = attShips[i % attShips.length];
          const target = defShips[Math.floor(Math.random() * defShips.length)];
          const shipType = (shooter.userData?.shipType as ShipType) || 'fighter';
          const weaponType: WeaponModuleId =
            playerLoadouts[shipType]?.weapon || DEFAULT_LOADOUTS[shipType]?.weapon || 'laser';

          const start = shooter.position.clone();
          const end = target.position.clone();

          setTimeout(() => {
            if (weaponType === 'laser') {
              spawnLaserBeam(start, end, true);
            } else if (weaponType === 'plasma') {
              spawnPlasmaOrb(start, end, true);
            } else if (weaponType === 'railgun') {
              spawnRailgunSlug(start, end, true);
            } else if (weaponType === 'torpedo') {
              spawnTorpedoMissile(start, end, true);
            }
          }, i * 65);
        }
      }

      // 2. Defender Return Fire
      if (round.defenderDamageDealt > 0) {
        setTimeout(() => {
          const numSalvos = Math.min(defShips.length, 5);

          for (let i = 0; i < numSalvos; i++) {
            const shooter = defShips[i % defShips.length];
            const target = attShips[Math.floor(Math.random() * attShips.length)];
            const isDefense = Boolean(shooter.userData?.isDefense);
            const defenseType = shooter.userData?.defenseType as DefenseStructureType | undefined;
            const shipType = (shooter.userData?.shipType as ShipType) || 'scout';

            let weaponType: WeaponModuleId = 'laser';
            if (isDefense) {
              if (defenseType === 'missile_battery') weaponType = 'torpedo';
              else if (defenseType === 'plasma_turret') weaponType = 'plasma';
              else if (defenseType === 'ion_cannon') weaponType = 'laser';
            } else {
              weaponType = DEFAULT_LOADOUTS[shipType]?.weapon || 'laser';
            }

            const start = shooter.position.clone();
            const end = target.position.clone();

            setTimeout(() => {
              if (weaponType === 'laser') {
                spawnLaserBeam(start, end, false);
              } else if (weaponType === 'plasma') {
                spawnPlasmaOrb(start, end, false);
              } else if (weaponType === 'railgun') {
                spawnRailgunSlug(start, end, false);
              } else if (weaponType === 'torpedo') {
                spawnTorpedoMissile(start, end, false);
              }
            }, i * 75);
          }
        }, 130);
      }

      // 3. Casualties & Explosions
      const hasAttackerLosses = Object.values(round.attackerLosses).some((cnt) => cnt > 0);
      const hasDefenderLosses = Object.values(round.defenderLosses).some((cnt) => cnt > 0);

      if (hasAttackerLosses || hasDefenderLosses) {
        setTimeout(() => {
          sound.playExplosion();

          // Spawn explosion debris particles
          const originPos = hasDefenderLosses
            ? defShips[Math.floor(Math.random() * defShips.length)].position.clone()
            : attShips[Math.floor(Math.random() * attShips.length)].position.clone();

          for (let p = 0; p < 25; p++) {
            const partGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
            const partMat = new THREE.MeshBasicMaterial({
              color: p % 2 === 0 ? 0xff4500 : 0xffd700,
              blending: THREE.AdditiveBlending,
            });
            const partMesh = new THREE.Mesh(partGeo, partMat);
            partMesh.position.copy(originPos);

            const velocity = new THREE.Vector3(
              (Math.random() - 0.5) * 18,
              (Math.random() - 0.5) * 18,
              (Math.random() - 0.5) * 18
            );

            fxGroup.add(partMesh);
            activeParticlesRef.current.push({
              mesh: partMesh,
              velocity,
              life: 0,
              maxLife: 0.65 + Math.random() * 0.35,
            });
          }
        }, 220);
      }
    },
    [spawnLaserBeam, spawnPlasmaOrb, spawnRailgunSlug, spawnTorpedoMissile]
  );

  // Initialize Scene, Camera, Lights, Grid, Starfield
  useEffect(() => {
    if (!containerRef.current || !canvasRef.current) return;

    const width = containerRef.current.clientWidth || 640;
    const height = containerRef.current.clientHeight || 340;

    // 1. Scene
    const scene = new THREE.Scene();
    scene.fog = new THREE.FogExp2(0x030712, 0.007);
    sceneRef.current = scene;

    // 2. Camera
    const camera = new THREE.PerspectiveCamera(46, width / height, 0.5, 600);
    camera.position.set(0, 14, 50);
    cameraRef.current = camera;

    // 3. Renderer
    const renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.current,
      antialias: true,
      powerPreference: 'high-performance',
      alpha: true,
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.15;
    rendererRef.current = renderer;

    // 4. Lighting
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.45);
    scene.add(ambientLight);

    const dirLight1 = new THREE.DirectionalLight(0xffffff, 1.2);
    dirLight1.position.set(20, 40, 30);
    scene.add(dirLight1);

    const dirLight2 = new THREE.DirectionalLight(0xf43f5e, 0.6);
    dirLight2.position.set(-30, -20, -20);
    scene.add(dirLight2);

    // 5. Starfield Background (1,000 deep space stars)
    const starCount = 1000;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      const idx = i * 3;
      starPositions[idx] = (Math.random() - 0.5) * 360;
      starPositions[idx + 1] = (Math.random() - 0.5) * 260;
      starPositions[idx + 2] = (Math.random() - 0.5) * 360;

      const isCyan = Math.random() > 0.6;
      starColors[idx] = isCyan ? 0.3 : 1.0;
      starColors[idx + 1] = isCyan ? 0.9 : 0.95;
      starColors[idx + 2] = isCyan ? 1.0 : 0.85;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));
    const starMat = new THREE.PointsMaterial({
      size: 1.3,
      vertexColors: true,
      transparent: true,
      opacity: 0.8,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 6. Tactical Holographic Floor Grid
    const gridHelper = new THREE.GridHelper(80, 40, 0x00f3ff, 0x133852);
    gridHelper.position.y = -7;
    (gridHelper.material as THREE.Material).transparent = true;
    (gridHelper.material as THREE.Material).opacity = 0.35;
    scene.add(gridHelper);

    // 7. Fleets & VFX Groups
    const attackerGroup = new THREE.Group();
    attackerShipsGroupRef.current = attackerGroup;
    scene.add(attackerGroup);

    const defenderGroup = new THREE.Group();
    defenderShipsGroupRef.current = defenderGroup;
    scene.add(defenderGroup);

    const fxGroup = new THREE.Group();
    fxGroupRef.current = fxGroup;
    scene.add(fxGroup);

    // Resize observer
    const resizeObserver = new ResizeObserver((entries) => {
      for (const entry of entries) {
        const { width: w, height: h } = entry.contentRect;
        if (w > 0 && h > 0) {
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
          renderer.setSize(w, h);
        }
      }
    });
    resizeObserver.observe(containerRef.current);

    // Render loop
    let lastTime = performance.now();
    const animate = () => {
      animFrameIdRef.current = requestAnimationFrame(animate);

      const now = performance.now();
      const delta = Math.min(0.1, (now - lastTime) / 1000);
      lastTime = now;

      // Gentle continuous star twinkling / rotation
      starField.rotation.y += delta * 0.015;

      // Smooth camera interpolation towards target
      if (cameraPreset === 'cinematic') {
        // Slow majestic drift
        const t = now * 0.00035;
        const radius = orbitDistanceRef.current;
        camera.position.x = Math.sin(t) * (radius * 0.35);
        camera.position.z = Math.cos(t) * radius;
        camera.position.y = 12 + Math.sin(t * 1.5) * 4;
        camera.lookAt(0, 0, 0);
      } else {
        camera.position.lerp(cameraDesiredPosRef.current, delta * 4.5);
        camera.lookAt(cameraTargetRef.current);
      }

      // Dynamic screen shake damping for tactile combat juice
      if (cameraShakeIntensityRef.current > 0.001) {
        const shake = cameraShakeIntensityRef.current;
        camera.position.x += (Math.random() - 0.5) * shake;
        camera.position.y += (Math.random() - 0.5) * shake;
        camera.position.z += (Math.random() - 0.5) * shake;
        cameraShakeIntensityRef.current = Math.max(0, cameraShakeIntensityRef.current - delta * 4.0);
      }

      // Update active laser beams
      for (let i = activeLasersRef.current.length - 1; i >= 0; i--) {
        const laser = activeLasersRef.current[i];
        laser.elapsed += delta;
        const progress = laser.elapsed / laser.duration;

        if (progress >= 1) {
          fxGroup.remove(laser.mesh);
          if (laser.mesh.geometry) laser.mesh.geometry.dispose();
          activeLasersRef.current.splice(i, 1);
        } else {
          // Fade beam
          (laser.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
        }
      }

      // Update active moving projectiles (Plasma, Railgun, Torpedo)
      for (let i = activeProjectilesRef.current.length - 1; i >= 0; i--) {
        const proj = activeProjectilesRef.current[i];
        proj.progress += delta * proj.speed;

        if (proj.weaponType === 'torpedo') {
          // Smoke puff in wake
          proj.smokeTimer = (proj.smokeTimer || 0) + delta;
          if (proj.smokeTimer > 0.04) {
            proj.smokeTimer = 0;
            const smokeGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
            const smokeMat = new THREE.MeshBasicMaterial({
              color: 0x9333ea,
              transparent: true,
              opacity: 0.75,
              blending: THREE.AdditiveBlending,
            });
            const smoke = new THREE.Mesh(smokeGeo, smokeMat);
            smoke.position.copy(proj.mesh.position);
            fxGroup.add(smoke);
            activeParticlesRef.current.push({
              mesh: smoke,
              velocity: new THREE.Vector3(
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2,
                (Math.random() - 0.5) * 2
              ),
              life: 0,
              maxLife: 0.35,
            });
          }
        } else if (proj.weaponType === 'plasma') {
          // Pulsing thermal core
          proj.mesh.scale.setScalar(0.9 + Math.sin(now * 0.025) * 0.2);
        }

        if (proj.progress >= 1) {
          // Reached target! Trigger impact visual
          const impactPos = proj.targetPos.clone();
          if (proj.weaponType === 'plasma') {
            // Thermal shockwave sphere + scattering embers
            const blastGeo = new THREE.SphereGeometry(2.8, 12, 12);
            const blastMat = new THREE.MeshBasicMaterial({
              color: 0xf97316,
              transparent: true,
              opacity: 0.9,
              blending: THREE.AdditiveBlending,
            });
            const blast = new THREE.Mesh(blastGeo, blastMat);
            blast.position.copy(impactPos);
            fxGroup.add(blast);
            activeLasersRef.current.push({ mesh: blast, duration: 0.35, elapsed: 0 });

            for (let p = 0; p < 8; p++) {
              const emberGeo = new THREE.BoxGeometry(0.25, 0.25, 0.25);
              const emberMat = new THREE.MeshBasicMaterial({ color: 0xfbbf24, blending: THREE.AdditiveBlending });
              const ember = new THREE.Mesh(emberGeo, emberMat);
              ember.position.copy(impactPos);
              fxGroup.add(ember);
              activeParticlesRef.current.push({
                mesh: ember,
                velocity: new THREE.Vector3(
                  (Math.random() - 0.5) * 14,
                  (Math.random() - 0.5) * 14,
                  (Math.random() - 0.5) * 14
                ),
                life: 0,
                maxLife: 0.45,
              });
            }
          } else if (proj.weaponType === 'railgun') {
            // Tungsten kinetic ricochet sparks
            for (let p = 0; p < 14; p++) {
              const sparkGeo = new THREE.BoxGeometry(0.14, 0.14, 0.14);
              const sparkMat = new THREE.MeshBasicMaterial({ color: 0x67e8f9, blending: THREE.AdditiveBlending });
              const spark = new THREE.Mesh(sparkGeo, sparkMat);
              spark.position.copy(impactPos);
              fxGroup.add(spark);
              activeParticlesRef.current.push({
                mesh: spark,
                velocity: new THREE.Vector3(
                  (Math.random() - 0.5) * 20,
                  (Math.random() - 0.5) * 20,
                  (Math.random() - 0.5) * 20
                ),
                life: 0,
                maxLife: 0.32,
              });
            }
          } else if (proj.weaponType === 'torpedo') {
            // Heavy antimatter explosion
            sound.playExplosion();
            const ringGeo = new THREE.RingGeometry(0.5, 3.8, 16);
            const ringMat = new THREE.MeshBasicMaterial({
              color: 0xc084fc,
              transparent: true,
              opacity: 0.95,
              side: THREE.DoubleSide,
              blending: THREE.AdditiveBlending,
            });
            const ring = new THREE.Mesh(ringGeo, ringMat);
            ring.position.copy(impactPos);
            ring.lookAt(camera.position);
            fxGroup.add(ring);
            activeLasersRef.current.push({ mesh: ring, duration: 0.4, elapsed: 0 });

            for (let p = 0; p < 18; p++) {
              const debrisGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
              const debrisMat = new THREE.MeshBasicMaterial({
                color: p % 2 === 0 ? 0xa855f7 : 0xe879f9,
                blending: THREE.AdditiveBlending,
              });
              const debris = new THREE.Mesh(debrisGeo, debrisMat);
              debris.position.copy(impactPos);
              fxGroup.add(debris);
              activeParticlesRef.current.push({
                mesh: debris,
                velocity: new THREE.Vector3(
                  (Math.random() - 0.5) * 16,
                  (Math.random() - 0.5) * 16,
                  (Math.random() - 0.5) * 16
                ),
                life: 0,
                maxLife: 0.55,
              });
            }
          }

          fxGroup.remove(proj.mesh);
          activeProjectilesRef.current.splice(i, 1);
        } else {
          proj.mesh.position.lerpVectors(proj.startPos, proj.targetPos, Math.min(1, proj.progress));
          if (proj.weaponType === 'torpedo') {
            proj.mesh.lookAt(proj.targetPos);
          }
        }
      }

      // Update active explosion particles
      for (let i = activeParticlesRef.current.length - 1; i >= 0; i--) {
        const p = activeParticlesRef.current[i];
        p.life += delta;
        p.mesh.position.addScaledVector(p.velocity, delta);
        p.velocity.multiplyScalar(0.96); // drag

        const progress = p.life / p.maxLife;
        if (progress >= 1) {
          fxGroup.remove(p.mesh);
          if (p.mesh.geometry) p.mesh.geometry.dispose();
          activeParticlesRef.current.splice(i, 1);
        } else {
          p.mesh.scale.setScalar(1 - progress * 0.7);
          (p.mesh.material as THREE.MeshBasicMaterial).opacity = 1 - progress;
        }
      }

      renderer.render(scene, camera);
    };

    animFrameIdRef.current = requestAnimationFrame(animate);

    // Cleanup on unmount
    return () => {
      resizeObserver.disconnect();
      if (animFrameIdRef.current) cancelAnimationFrame(animFrameIdRef.current);
      activeLasersRef.current.forEach((l) => {
        fxGroup.remove(l.mesh);
        if (l.mesh.geometry) l.mesh.geometry.dispose();
      });
      activeProjectilesRef.current.forEach((p) => {
        fxGroup.remove(p.mesh);
      });
      activeParticlesRef.current.forEach((p) => {
        fxGroup.remove(p.mesh);
        if (p.mesh.geometry) p.mesh.geometry.dispose();
      });
      renderer.dispose();
    };
  }, [cameraPreset]);

  // Update fleet formations when currentRound changes
  useEffect(() => {
    if (!attackerShipsGroupRef.current || !defenderShipsGroupRef.current) return;

    const round = currentRound || report.rounds[0];
    const attRemaining = round ? round.attackerRemaining : report.survivingAttacker;
    const defRemaining = round ? round.defenderRemaining : report.survivingDefender;
    const defDefensesRemaining = round?.defenderDefenseRemaining || report.survivingDefenses || report.initialDefenses;

    populateFleetGroup(attackerShipsGroupRef.current, attRemaining, true);
    populateFleetGroup(defenderShipsGroupRef.current, defRemaining, false, defDefensesRemaining);

    if (round) {
      triggerRoundFireEffects(round);
    }
  }, [currentRoundIdx, report, populateFleetGroup, triggerRoundFireEffects]);

  // Natural CP recharge (+4 CP every second, max 100)
  useEffect(() => {
    const cpInterval = setInterval(() => {
      setCommandPoints((prev) => Math.min(100, prev + 4));
    }, 1000);
    return () => clearInterval(cpInterval);
  }, []);

  // Banner auto-dismiss after 2.8s
  useEffect(() => {
    if (!activeTacticalBanner) return;
    const bannerTimer = setTimeout(() => {
      setActiveTacticalBanner(null);
    }, 2800);
    return () => clearTimeout(bannerTimer);
  }, [activeTacticalBanner]);

  // Tactical Intervention Triggers
  const triggerTacticalAction = useCallback(
    (tactic: TacticalInterventionType) => {
      const fxGroup = fxGroupRef.current;
      if (!fxGroup) return;

      if (tactic === 'focus_fire') {
        if (commandPoints < 30) {
          sound.playError();
          return;
        }
        setCommandPoints((cp) => Math.max(0, cp - 30));
        sound.playLaser();
        cameraShakeIntensityRef.current = 1.4;

        // 12 synchronous laser beams converging on target
        const targetPos = new THREE.Vector3(18, 0, 0);
        for (let i = 0; i < 10; i++) {
          const startPos = new THREE.Vector3(-22, (Math.random() - 0.5) * 8, (Math.random() - 0.5) * 14);
          const dir = new THREE.Vector3().subVectors(targetPos, startPos);
          const dist = dir.length();
          const beamGeo = new THREE.CylinderGeometry(0.35, 0.35, dist, 6);
          const beamMat = new THREE.MeshBasicMaterial({
            color: 0xff0055,
            transparent: true,
            opacity: 1,
            blending: THREE.AdditiveBlending,
          });
          const beamMesh = new THREE.Mesh(beamGeo, beamMat);
          beamMesh.position.copy(startPos).addScaledVector(dir, 0.5);
          beamMesh.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
          fxGroup.add(beamMesh);
          activeLasersRef.current.push({
            mesh: beamMesh,
            duration: 0.55,
            elapsed: 0,
          });
        }

        // Giant impact sparks
        for (let i = 0; i < 35; i++) {
          const sparkGeo = new THREE.BoxGeometry(0.3, 0.3, 0.3);
          const sparkMat = new THREE.MeshBasicMaterial({ color: 0xffe600, blending: THREE.AdditiveBlending });
          const spark = new THREE.Mesh(sparkGeo, sparkMat);
          spark.position.copy(targetPos).add(new THREE.Vector3((Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3, (Math.random() - 0.5) * 3));
          fxGroup.add(spark);
          activeParticlesRef.current.push({
            mesh: spark,
            velocity: new THREE.Vector3((Math.random() - 0.5) * 24, (Math.random() - 0.5) * 24, (Math.random() - 0.5) * 24),
            life: 0,
            maxLife: 0.7,
          });
        }

        setActiveTacticalBanner({
          text: 'AMİRAL EMRİ: ODAK ATEŞİ! (+%35 Kritik Taarruz)',
          icon: '🎯',
          color: '#f43f5e',
        });
        setCombatLogTicker('🎯 Amiral: "Tüm bataryalar düşman amiral kruvazörüne kilitlensin! Tam salvo ateşi!"');
        onTacticalIntervention?.('focus_fire');
      } else if (tactic === 'shield_overcharge') {
        if (commandPoints < 35) {
          sound.playError();
          return;
        }
        setCommandPoints((cp) => Math.max(0, cp - 35));
        sound.playShield();
        cameraShakeIntensityRef.current = 0.6;

        // Spherical protective energy dome
        const shieldGeo = new THREE.SphereGeometry(12, 18, 18);
        const shieldMat = new THREE.MeshBasicMaterial({
          color: 0x00f3ff,
          wireframe: true,
          transparent: true,
          opacity: 0.85,
          blending: THREE.AdditiveBlending,
        });
        const shieldMesh = new THREE.Mesh(shieldGeo, shieldMat);
        shieldMesh.position.set(-18, 0, 0);
        fxGroup.add(shieldMesh);

        let elapsed = 0;
        const shieldInterval = setInterval(() => {
          elapsed += 0.05;
          shieldMesh.scale.addScalar(0.04);
          shieldMat.opacity = Math.max(0, 0.85 - elapsed * 0.7);
          if (elapsed >= 1.2) {
            clearInterval(shieldInterval);
            fxGroup.remove(shieldMesh);
            shieldGeo.dispose();
            shieldMat.dispose();
          }
        }, 50);

        setActiveTacticalBanner({
          text: 'AMİRAL EMRİ: KALKANLARA AŞIRI GÜÇ! (-%40 Alınan Hasar)',
          icon: '🛡️',
          color: '#06b6d4',
        });
        setCombatLogTicker('🛡️ Mühendislik: "Reaktör enerjisi kalkanlara aktarıldı! Bariyer darbeleri emiyor!"');
        onTacticalIntervention?.('shield_overcharge');
      } else if (tactic === 'fighter_swarm') {
        if (commandPoints < 25) {
          sound.playError();
          return;
        }
        setCommandPoints((cp) => Math.max(0, cp - 25));
        sound.playLaser();
        cameraShakeIntensityRef.current = 0.9;

        // 6 dive fighters
        for (let i = 0; i < 6; i++) {
          const startPos = new THREE.Vector3(-30, (i - 2.5) * 3, (Math.random() - 0.5) * 12);
          const targetPos = new THREE.Vector3(25, (i - 2.5) * 2, (Math.random() - 0.5) * 8);
          const missileGeo = new THREE.ConeGeometry(0.3, 1.8, 4);
          missileGeo.rotateZ(-Math.PI / 2);
          const missileMat = new THREE.MeshBasicMaterial({ color: 0xf59e0b, blending: THREE.AdditiveBlending });
          const mesh = new THREE.Mesh(missileGeo, missileMat);
          mesh.position.copy(startPos);
          fxGroup.add(mesh);

          activeProjectilesRef.current.push({
            mesh,
            startPos,
            targetPos,
            progress: 0,
            speed: 2.2 + Math.random() * 0.4,
            weaponType: 'torpedo',
            isAttacker: true,
          });
        }

        setActiveTacticalBanner({
          text: 'AMİRAL EMRİ: AVCI SALDIRISI & İT DALAŞI! (+120 Doğrudan Hasar)',
          icon: '🚀',
          color: '#eab308',
        });
        setCombatLogTicker('🚀 Filo Komutanı: "Kırmızı Filo dalışa geçti! Düşman savunma hattı dağıtılıyor!"');
        onTacticalIntervention?.('fighter_swarm');
      } else if (tactic === 'emergency_ftl') {
        if (commandPoints < 50) {
          sound.playError();
          return;
        }
        setCommandPoints((cp) => Math.max(0, cp - 50));
        sound.playLaunch();
        cameraShakeIntensityRef.current = 1.6;

        // Hyperspace rupture ring
        const ringGeo = new THREE.TorusGeometry(8, 0.4, 16, 32);
        const ringMat = new THREE.MeshBasicMaterial({ color: 0xa855f7, blending: THREE.AdditiveBlending });
        const ring = new THREE.Mesh(ringGeo, ringMat);
        ring.position.set(-16, 0, 0);
        ring.rotation.y = Math.PI / 2;
        fxGroup.add(ring);

        for (let i = 0; i < 40; i++) {
          const pGeo = new THREE.BoxGeometry(0.35, 0.35, 0.35);
          const pMat = new THREE.MeshBasicMaterial({ color: 0xc084fc, blending: THREE.AdditiveBlending });
          const pMesh = new THREE.Mesh(pGeo, pMat);
          pMesh.position.set(-16, 0, 0);
          fxGroup.add(pMesh);
          activeParticlesRef.current.push({
            mesh: pMesh,
            velocity: new THREE.Vector3((Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20, (Math.random() - 0.5) * 20),
            life: 0,
            maxLife: 1.0,
          });
        }

        let ftlTime = 0;
        const ftlInterval = setInterval(() => {
          ftlTime += 0.05;
          ring.rotation.z += 0.2;
          ring.scale.subScalar(0.04);
          if (ftlTime >= 1.0) {
            clearInterval(ftlInterval);
            fxGroup.remove(ring);
            ringGeo.dispose();
            ringMat.dispose();
          }
        }, 50);

        setActiveTacticalBanner({
          text: 'AMİRAL EMRİ: ACİL FTL KAÇIŞ PROTOKOLÜ! (Filo Kurtarıldı)',
          icon: '🌌',
          color: '#c084fc',
        });
        setCombatLogTicker('🌌 Seyir Subayı: "FTL motorları devreye alındı! Hiperuzay sıçraması tamamlandı, filo güvende!"');
        onTacticalIntervention?.('emergency_ftl');
      }
    },
    [commandPoints, onTacticalIntervention]
  );

  // Mouse drag & zoom controls
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current || cameraPreset === 'cinematic') return;

    const deltaX = e.clientX - previousMousePositionRef.current.x;
    const deltaY = e.clientY - previousMousePositionRef.current.y;
    previousMousePositionRef.current = { x: e.clientX, y: e.clientY };

    orbitRotationRef.current.theta -= deltaX * 0.01;
    orbitRotationRef.current.phi = Math.max(0.05, Math.min(Math.PI / 2.2, orbitRotationRef.current.phi + deltaY * 0.01));

    const dist = orbitDistanceRef.current;
    cameraDesiredPosRef.current.set(
      Math.sin(orbitRotationRef.current.theta) * Math.cos(orbitRotationRef.current.phi) * dist,
      Math.sin(orbitRotationRef.current.phi) * dist,
      Math.cos(orbitRotationRef.current.theta) * Math.cos(orbitRotationRef.current.phi) * dist
    );
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.stopPropagation();
    orbitDistanceRef.current = Math.max(20, Math.min(100, orbitDistanceRef.current + e.deltaY * 0.05));
    if (cameraPreset !== 'cinematic') {
      const dist = orbitDistanceRef.current;
      cameraDesiredPosRef.current.set(
        Math.sin(orbitRotationRef.current.theta) * Math.cos(orbitRotationRef.current.phi) * dist,
        Math.sin(orbitRotationRef.current.phi) * dist,
        Math.cos(orbitRotationRef.current.theta) * Math.cos(orbitRotationRef.current.phi) * dist
      );
    }
  };

  return (
    <div
      ref={containerRef}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
      className="relative w-full h-[350px] bg-[#020611] rounded-sm overflow-hidden border border-[#1b3d54] select-none shadow-2xl group flex flex-col justify-between"
    >
      <canvas ref={canvasRef} className="absolute inset-0 w-full h-full block cursor-grab active:cursor-grabbing" />

      {/* Active Tactical Intervention Hero Banner Overlay */}
      {activeTacticalBanner && (
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-30 pointer-events-none flex flex-col items-center animate-in zoom-in-95 duration-200">
          <div
            className="px-5 py-2.5 rounded-sm bg-[#050e18]/95 border shadow-[0_0_25px_rgba(0,243,255,0.4)] backdrop-blur-md flex items-center gap-3 font-mono"
            style={{ borderColor: activeTacticalBanner.color }}
          >
            <span className="text-2xl animate-bounce">{activeTacticalBanner.icon}</span>
            <div>
              <div className="text-[12px] font-bold text-white uppercase tracking-wider" style={{ color: activeTacticalBanner.color }}>
                {activeTacticalBanner.text}
              </div>
              <div className="text-[9.5px] text-slate-300">
                Savaş Simülasyonu & Filo Doktrini Anında Güncellendi
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Top HUD: Title, Round Indicator, Live Fire Score */}
      <div className="relative top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10 font-mono text-[10px]">
        {/* Attacker Flank Badge */}
        <div className="bg-[#0b141e]/90 border border-rose-500/50 backdrop-blur-md px-2.5 py-1 rounded-sm text-rose-300 flex items-center gap-1.5 shadow-[0_0_8px_rgba(244,63,94,0.2)]">
          <div className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
          <span className="font-bold uppercase tracking-wider">{report.attackerName}</span>
          {currentRound && (
            <span className="font-bold text-rose-400 bg-rose-950/80 px-1.5 py-0.5 rounded-sm border border-rose-500/30">
              ⚡ -{currentRound.attackerDamageDealt}
            </span>
          )}
        </div>

        {/* Center Round Indicator & Active Weapon VFX Legend */}
        <div className="flex flex-col items-center gap-1">
          <div className="bg-[#08131e]/95 border border-cyan-400/40 backdrop-blur-md px-3 py-1 rounded-sm text-cyan-300 font-bold uppercase tracking-widest flex items-center gap-1.5 shadow-[0_0_10px_rgba(0,243,255,0.2)]">
            <Swords className="w-3.5 h-3.5 text-amber-400" />
            <span>TUR {currentRoundIdx + 1} / {totalRounds}</span>
          </div>
          <div className="hidden sm:flex items-center gap-1.5 bg-[#040914]/85 border border-[#1b3d52]/60 px-2 py-0.5 rounded-sm text-[9px] text-slate-400 backdrop-blur-xs">
            <span className="text-cyan-400/80 font-bold">3D Donanım:</span>
            <span className="text-rose-400">⚡ Lazer</span>
            <span className="text-amber-400">🔥 Plazma</span>
            <span className="text-sky-300">☄️ Raylı Top</span>
            <span className="text-purple-400">🚀 Torpido</span>
          </div>
        </div>

        {/* Defender Flank Badge */}
        <div className="bg-[#0b141e]/90 border border-cyan-500/50 backdrop-blur-md px-2.5 py-1 rounded-sm text-cyan-300 flex items-center gap-1.5 shadow-[0_0_8px_rgba(6,182,212,0.2)]">
          {currentRound && (
            <span className="font-bold text-cyan-300 bg-cyan-950/80 px-1.5 py-0.5 rounded-sm border border-cyan-500/30">
              ⚡ -{currentRound.defenderDamageDealt}
            </span>
          )}
          <span className="font-bold uppercase tracking-wider">{report.defenderName}</span>
          <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        </div>
      </div>

      {/* Bottom Controls & Tactical Intervention Console */}
      <div className="relative bottom-2 left-2 right-2 z-10 flex flex-col gap-1.5 pointer-events-auto">
        {/* Tactical Command Intervention Bar (Amiral Taktik Kartları) */}
        <div className="p-1.5 rounded-sm bg-[#050d18]/95 border border-[#1b3d52] backdrop-blur-md flex flex-wrap items-center justify-between gap-2 shadow-2xl">
          {/* 4 Interactive Tactical Cards */}
          <div className="flex items-center gap-1.5 flex-1">
            <span className="text-[10px] font-mono text-cyan-300 font-bold uppercase tracking-wider mr-1 hidden sm:inline">
              Taktik:
            </span>

            {/* 1. Odak Ateşi */}
            <button
              type="button"
              disabled={commandPoints < 30}
              onClick={() => triggerTacticalAction('focus_fire')}
              className={`px-2 py-1 rounded-sm text-[10px] font-mono font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                commandPoints >= 30
                  ? 'bg-rose-950/50 hover:bg-rose-900/60 border-rose-500/60 text-rose-200 shadow-sm hover:scale-102 active:scale-98'
                  : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="Odak Ateşi (30 CP): Tüm bataryalar düşman amiral gemisine kilitlenir (+%35 Taarruz Gücü & Lazer Salvosu)."
            >
              <span>🎯</span>
              <span>Odak Ateşi</span>
              <span className="text-[9px] text-rose-400 font-normal">30 CP</span>
            </button>

            {/* 2. Kalkan Gücü */}
            <button
              type="button"
              disabled={commandPoints < 35}
              onClick={() => triggerTacticalAction('shield_overcharge')}
              className={`px-2 py-1 rounded-sm text-[10px] font-mono font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                commandPoints >= 35
                  ? 'bg-cyan-950/50 hover:bg-cyan-900/60 border-cyan-500/60 text-cyan-200 shadow-sm hover:scale-102 active:scale-98'
                  : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="Kalkanları Aşırı Yükle (35 CP): Koruyucu heksagonal enerji kubbesi açar (-%40 Alınan Hasar)."
            >
              <span>🛡️</span>
              <span>Kalkan Gücü</span>
              <span className="text-[9px] text-cyan-400 font-normal">35 CP</span>
            </button>

            {/* 3. Avcı Taarruzu */}
            <button
              type="button"
              disabled={commandPoints < 25}
              onClick={() => triggerTacticalAction('fighter_swarm')}
              className={`px-2 py-1 rounded-sm text-[10px] font-mono font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                commandPoints >= 25
                  ? 'bg-amber-950/50 hover:bg-amber-900/60 border-amber-500/60 text-amber-200 shadow-sm hover:scale-102 active:scale-98'
                  : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="Avcı Taarruzu (25 CP): Avcı filosu düşman hattını boydan boya tarar (+120 Doğrudan Hasar)."
            >
              <span>🚀</span>
              <span>Avcı Dalgası</span>
              <span className="text-[9px] text-amber-400 font-normal">25 CP</span>
            </button>

            {/* 4. Acil FTL */}
            <button
              type="button"
              disabled={commandPoints < 50}
              onClick={() => triggerTacticalAction('emergency_ftl')}
              className={`px-2 py-1 rounded-sm text-[10px] font-mono font-bold flex items-center gap-1 transition-all border cursor-pointer ${
                commandPoints >= 50
                  ? 'bg-purple-950/50 hover:bg-purple-900/60 border-purple-500/60 text-purple-200 shadow-sm hover:scale-102 active:scale-98'
                  : 'bg-slate-900/40 border-slate-800 text-slate-600 cursor-not-allowed opacity-50'
              }`}
              title="Acil FTL Kaçışı (50 CP): Hiperuzay girdabı açarak kalan filoyu kontrollü geri çeker."
            >
              <span>🌌</span>
              <span>Acil FTL</span>
              <span className="text-[9px] text-purple-400 font-normal">50 CP</span>
            </button>
          </div>

          {/* CP Power Gauge */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="flex flex-col items-end">
              <span className="text-[9.5px] font-mono font-bold text-cyan-300">
                ⚡ {commandPoints}/100 CP
              </span>
              <div className="w-20 h-1.5 bg-[#030712] rounded-full overflow-hidden border border-[#1b3d52]">
                <div
                  className="h-full bg-gradient-to-r from-cyan-500 to-emerald-400 transition-all duration-300"
                  style={{ width: `${commandPoints}%` }}
                />
              </div>
            </div>
          </div>
        </div>

        {/* Live Comms Radio Ticker Strip */}
        <div className="flex items-center justify-between px-2.5 py-0.5 rounded-sm bg-[#040a14]/85 border border-[#1b3d52]/60 text-[9.5px] font-mono text-slate-300">
          <span className="flex items-center gap-1.5 truncate">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping shrink-0" />
            <span className="truncate">{combatLogTicker}</span>
          </span>
          <span className="text-slate-500 text-[8.5px] shrink-0 ml-2">CANLI TELSİZ</span>
        </div>

        {/* Camera Preset & Round Controls */}
        <div className="flex items-center justify-between">
          {/* Camera Presets */}
          <div className="flex items-center gap-1 bg-[#091522]/90 border border-[#1b3d52] backdrop-blur-md p-1 rounded-sm">
            <button
              type="button"
              onClick={() => applyCameraPreset('cinematic')}
              className={`px-2 py-0.5 rounded-sm text-[10px] font-mono transition-all cursor-pointer ${
                cameraPreset === 'cinematic'
                  ? 'stellaris-rail-btn active text-cyan-300 font-bold'
                  : 'stellaris-btn-metallic text-slate-400 hover:text-white'
              }`}
              title="Sinematik kamera süzülmesi"
            >
              🎥 Sinematik
            </button>
            <button
              type="button"
              onClick={() => applyCameraPreset('tactical')}
              className={`px-2 py-0.5 rounded-sm text-[10px] font-mono transition-all cursor-pointer ${
                cameraPreset === 'tactical'
                  ? 'stellaris-rail-btn active text-cyan-300 font-bold'
                  : 'stellaris-btn-metallic text-slate-400 hover:text-white'
              }`}
              title="Taktik üstten izometrik görünüm"
            >
              📐 Taktik Izgara
            </button>
            <button
              type="button"
              onClick={() => applyCameraPreset('attacker')}
              className={`px-2 py-0.5 rounded-sm text-[10px] font-mono transition-all cursor-pointer ${
                cameraPreset === 'attacker'
                  ? 'stellaris-rail-btn active text-rose-300 font-bold'
                  : 'stellaris-btn-metallic text-slate-400 hover:text-white'
              }`}
              title="Saldırgan filosu arkası açısı"
            >
              🔴 Saldırgan
            </button>
            <button
              type="button"
              onClick={() => applyCameraPreset('defender')}
              className={`px-2 py-0.5 rounded-sm text-[10px] font-mono transition-all cursor-pointer ${
                cameraPreset === 'defender'
                  ? 'stellaris-rail-btn active text-cyan-300 font-bold'
                  : 'stellaris-btn-metallic text-slate-400 hover:text-white'
              }`}
              title="Savunucu filosu arkası açısı"
            >
              🔵 Savunucu
            </button>
          </div>

          {/* Round Playback Controls */}
          <div className="flex items-center gap-1.5 bg-[#091522]/90 border border-[#1b3d52] backdrop-blur-md px-2 py-1 rounded-sm">
            {onTogglePlay && (
              <button
                type="button"
                onClick={onTogglePlay}
                className={`px-2.5 py-0.5 rounded-sm text-[10px] font-mono font-bold flex items-center gap-1 cursor-pointer transition-all ${
                  isPlaying
                    ? 'border border-amber-500/70 text-amber-300 bg-amber-950/40 animate-pulse'
                    : 'stellaris-btn-metallic text-cyan-300'
                }`}
              >
                {isPlaying ? <Pause className="w-3 h-3" /> : <Play className="w-3 h-3" />}
                <span>{isPlaying ? 'DURAKLAT' : 'OYNAT'}</span>
              </button>
            )}

            {onSelectRound && (
              <>
                <button
                  type="button"
                  disabled={currentRoundIdx === 0}
                  onClick={() => onSelectRound(Math.max(0, currentRoundIdx - 1))}
                  className="px-1.5 py-0.5 rounded-sm stellaris-btn-metallic text-slate-300 disabled:opacity-40 text-[10px] font-mono cursor-pointer"
                  title="Önceki Tur"
                >
                  ◀
                </button>
                <button
                  type="button"
                  disabled={currentRoundIdx >= totalRounds - 1}
                  onClick={() => onSelectRound(Math.min(totalRounds - 1, currentRoundIdx + 1))}
                  className="px-1.5 py-0.5 rounded-sm stellaris-btn-metallic text-slate-300 disabled:opacity-40 text-[10px] font-mono cursor-pointer"
                  title="Sonraki Tur"
                >
                  ▶
                </button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
