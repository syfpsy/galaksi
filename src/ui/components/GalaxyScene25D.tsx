import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { calculatePlanetOrbit } from '../../engine/orbital';
import { getFleetCurrentPosition } from '../../engine/flight';
import { Fleet, GameState, StarSystem } from '../../engine/types';
import { SelectedTarget } from '../types';
import {
  getAtmosphereTexture,
  getCloudTexture,
  getDesertTexture,
  getGalacticNebulaTexture,
  getIceTexture,
  getOceanTexture,
  getShipEngineGlowTexture,
  getStarCoronaGlowTexture,
  getSunTexture,
  getTerranTexture,
  getVolcanicTexture,
  getWarpGateTexture,
  getCityLightsTexture,
  getTerritoryInfluenceTexture,
} from './proceduralTextures';
import { sound } from '../sound';
import { formatDuration } from '../timeUtils';
import { getPlanetAsset } from '../planetAssets';

const planetTextureCache = new Map<string, THREE.Texture>();
const planetTextureLoader = new THREE.TextureLoader();

function getLoadedPlanetTexture(imagePath: string): THREE.Texture {
  if (planetTextureCache.has(imagePath)) {
    return planetTextureCache.get(imagePath)!;
  }
  const tex = planetTextureLoader.load(imagePath, (t) => {
    t.colorSpace = THREE.SRGBColorSpace;
    t.wrapS = THREE.RepeatWrapping;
    t.wrapT = THREE.ClampToEdgeWrapping;
    t.needsUpdate = true;
  });
  tex.colorSpace = THREE.SRGBColorSpace;
  planetTextureCache.set(imagePath, tex);
  return tex;
}

interface GalaxyScene25DProps {
  state: GameState;
  activePlayerId: string;
  selectedTarget: SelectedTarget | null;
  godMode: boolean;
  focusedSystemId: string;
  viewMode: 'galaxy' | 'system';
  showProjections: boolean;
  zoom: number;
  onZoomChange?: (newZoom: number) => void;
  sensorCoverage: Set<string>;
  onSelectSystem: (systemId: string) => void;
  onEnterSystemView?: (systemId: string) => void;
  onExitSystemView?: () => void;
  onSelectPlanet?: (systemId: string, planetId: string) => void;
  onSelectFleet: (fleetId: string) => void;
  onHoverPlanet?: (planetId: string | null) => void;
}

interface ScreenLabel {
  id: string;
  type: 'system' | 'planet' | 'jump_gate' | 'star' | 'fleet';
  title: string;
  subtitle?: string;
  color: string;
  systemId: string;
  planetId?: string;
  targetSystemId?: string;
  fleetId?: string;
  x: number;
  y: number;
  visible: boolean;
  ownerName?: string;
  ownerColor?: string;
  colonizedCount?: number;
  openSlotsCount?: number;
  hasPoi?: boolean;
  hasDebris?: boolean;
  isRelay?: boolean;
}

export const GalaxyScene25D: React.FC<GalaxyScene25DProps> = ({
  state,
  activePlayerId,
  selectedTarget,
  godMode,
  focusedSystemId,
  viewMode,
  showProjections,
  zoom,
  onZoomChange,
  sensorCoverage,
  onSelectSystem,
  onEnterSystemView,
  onExitSystemView,
  onSelectPlanet,
  onSelectFleet,
  onHoverPlanet,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hudLabels, setHudLabels] = useState<ScreenLabel[]>([]);
  const onHoverPlanetRef = useRef(onHoverPlanet);
  onHoverPlanetRef.current = onHoverPlanet;

  // Live references for animation loop
  const stateRef = useRef(state);
  stateRef.current = state;

  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  const focusedSystemIdRef = useRef(focusedSystemId);
  focusedSystemIdRef.current = focusedSystemId;

  const showProjectionsRef = useRef(showProjections);
  showProjectionsRef.current = showProjections;

  const selectedTargetRef = useRef(selectedTarget);
  selectedTargetRef.current = selectedTarget;

  const activePlayerIdRef = useRef(activePlayerId);
  activePlayerIdRef.current = activePlayerId;

  const godModeRef = useRef(godMode);
  godModeRef.current = godMode;

  const sensorCoverageRef = useRef(sensorCoverage);
  sensorCoverageRef.current = sensorCoverage;

  const targetCameraPosRef = useRef<THREE.Vector3>(
    viewMode === 'system' ? new THREE.Vector3(500, 240, 260) : new THREE.Vector3(500, 120, 750)
  );
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(500, 400, 0));
  const triggerWarpRef = useRef<(() => void) | null>(null);

  // Sync camera when viewMode changes externally
  useEffect(() => {
    if (viewMode === 'system') {
      targetCameraPosRef.current.set(500, 240, 260);
      targetLookAtRef.current.set(500, 400, 0);
    } else {
      targetCameraPosRef.current.set(500, 120, 750);
      targetLookAtRef.current.set(500, 400, 0);
    }
    triggerWarpRef.current?.();
  }, [viewMode]);

  // Center camera when focusedSystemId changes
  useEffect(() => {
    targetLookAtRef.current.set(500, 400, 0);
    triggerWarpRef.current?.();
  }, [focusedSystemId]);

  // Sync camera when zoom prop changes from external HUD buttons (+ / - / 100%)
  useEffect(() => {
    const baseZ = viewModeRef.current === 'system' ? 260 : 750;
    const desiredZ = Math.max(45, Math.min(1350, baseZ / (zoom || 1)));
    targetCameraPosRef.current.z = desiredZ;
  }, [zoom]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // =========================================================================
    // 1. Scene, Camera & WebGL Renderer Setup
    // =========================================================================
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x020617); // Deep cosmic void slate-950

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 5000);
    const targetCameraPos = targetCameraPosRef.current;
    const targetLookAt = targetLookAtRef.current;

    camera.position.copy(targetCameraPos);
    camera.lookAt(targetLookAt);

    const renderer = new THREE.WebGLRenderer({
      antialias: true,
      alpha: true,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.25;
    container.appendChild(renderer.domElement);

    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.45);
    scene.add(ambientLight);

    // Deep Cosmic Starfield (Shared celestial backdrop)
    const starCount = 1400;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 2600 + 500;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 2200 + 400;
      starPositions[i * 3 + 2] = -80 - Math.random() * 500;

      const shade = 0.5 + Math.random() * 0.5;
      starColors[i * 3] = shade * (0.8 + Math.random() * 0.2);
      starColors[i * 3 + 1] = shade * 0.9;
      starColors[i * 3 + 2] = shade;
    }
    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.4,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // =========================================================================
    // 2. MACRO GALAXY GROUP (Visible ONLY in Galaxy Map Mode)
    // =========================================================================
    const galaxyMacroGroup = new THREE.Group();
    scene.add(galaxyMacroGroup);

    // 2.1 Rotating Galactic Spiral Arms
    const spiralGroup = new THREE.Group();
    spiralGroup.position.set(500, 400, -25);
    galaxyMacroGroup.add(spiralGroup);

    const spiralParticleCount = 900;
    const spiralGeo = new THREE.BufferGeometry();
    const spiralPos = new Float32Array(spiralParticleCount * 3);
    const spiralColors = new Float32Array(spiralParticleCount * 3);

    for (let i = 0; i < spiralParticleCount; i++) {
      const arm = i % 2 === 0 ? 0 : Math.PI;
      const t = Math.pow(Math.random(), 1.5) * 12;
      const r = 25 + t * 45;
      const angle = arm + t * 0.7 + (Math.random() - 0.5) * 0.45;

      const px = Math.cos(angle) * r;
      const py = Math.sin(angle) * r * 0.85;
      const pz = (Math.random() - 0.5) * 40;

      spiralPos[i * 3] = px;
      spiralPos[i * 3 + 1] = py;
      spiralPos[i * 3 + 2] = pz;

      const distRatio = r / 550;
      if (distRatio < 0.25) {
        spiralColors[i * 3] = 0.85;
        spiralColors[i * 3 + 1] = 0.75;
        spiralColors[i * 3 + 2] = 1.0;
      } else if (distRatio < 0.6) {
        spiralColors[i * 3] = 0.2;
        spiralColors[i * 3 + 1] = 0.75;
        spiralColors[i * 3 + 2] = 0.95;
      } else {
        spiralColors[i * 3] = 0.15;
        spiralColors[i * 3 + 1] = 0.4;
        spiralColors[i * 3 + 2] = 0.85;
      }
    }
    spiralGeo.setAttribute('position', new THREE.BufferAttribute(spiralPos, 3));
    spiralGeo.setAttribute('color', new THREE.BufferAttribute(spiralColors, 3));

    const spiralMat = new THREE.PointsMaterial({
      size: 3.5,
      map: getGalacticNebulaTexture(),
      vertexColors: true,
      transparent: true,
      opacity: 0.55,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const spiralPoints = new THREE.Points(spiralGeo, spiralMat);
    spiralPoints.raycast = () => {};
    spiralGroup.add(spiralPoints);

    // 2.2 Sector Constellation Boundary Rings
    const boundaryGroup = new THREE.Group();
    galaxyMacroGroup.add(boundaryGroup);

    const createSectorRing = (radius: number, color: number, opacity: number) => {
      const ringPts: THREE.Vector3[] = [];
      const segments = 96;
      for (let i = 0; i <= segments; i++) {
        const theta = (i / segments) * Math.PI * 2;
        ringPts.push(
          new THREE.Vector3(500 + Math.cos(theta) * radius, 400 + Math.sin(theta) * radius * 0.85, -5)
        );
      }
      const ringGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
      const ringMat = new THREE.LineBasicMaterial({
        color,
        transparent: true,
        opacity,
        depthWrite: false,
      });
      return new THREE.Line(ringGeo, ringMat);
    };

    boundaryGroup.add(createSectorRing(140, 0xa855f7, 0.22));
    boundaryGroup.add(createSectorRing(265, 0x38bdf8, 0.16));
    boundaryGroup.add(createSectorRing(410, 0x64748b, 0.12));

    // 2.3 Macro Star Systems & Coronas
    const starMeshes = new Map<string, { group: THREE.Group; mesh: THREE.Mesh; light: THREE.PointLight; corona: THREE.Sprite }>();
    const systemPositions = new Map<string, THREE.Vector3>();

    Object.values(stateRef.current.map.systems).forEach((sys, idx) => {
      const pos = new THREE.Vector3(sys.x, sys.y, 0);
      systemPositions.set(sys.id, pos);

      const group = new THREE.Group();
      group.position.copy(pos);

      const isRelay = sys.hasRelay;
      const starColorHex = isRelay ? '#c084fc' : idx % 3 === 0 ? '#f59e0b' : idx % 3 === 1 ? '#06b6d4' : '#ef4444';
      const starColor = isRelay ? 0xa855f7 : idx % 3 === 0 ? 0xf59e0b : idx % 3 === 1 ? 0x06b6d4 : 0xef4444;
      const starRadius = isRelay ? 18 : 13;

      // Solar Sphere Core
      const starSphereGeo = new THREE.SphereGeometry(starRadius, 32, 32);
      const starSphereMat = new THREE.MeshBasicMaterial({
        map: getSunTexture(starColorHex),
      });
      const starMesh = new THREE.Mesh(starSphereGeo, starSphereMat);
      (starMesh as any).userData = { type: 'system', systemId: sys.id };
      group.add(starMesh);

      // Dedicated Point Light
      const pointLight = new THREE.PointLight(starColor, isRelay ? 3.0 : 2.2, 850);
      pointLight.position.set(0, 0, 12);
      group.add(pointLight);

      // Smooth Radial Corona Flare Sprite
      const coronaTexture = getStarCoronaGlowTexture(starColorHex);
      const coronaSpriteMat = new THREE.SpriteMaterial({
        map: coronaTexture,
        transparent: true,
        opacity: 0.88,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const coronaSprite = new THREE.Sprite(coronaSpriteMat);
      coronaSprite.scale.set(starRadius * 5.0, starRadius * 5.0, 1);
      coronaSprite.raycast = () => {};
      group.add(coronaSprite);

      // Tactical System Boundary Ring & Stellaris Faction Territory Influence
      const ringPts: THREE.Vector3[] = [];
      const ringSegments = 64;
      const territoryRadius = starRadius * 3.4;
      for (let r = 0; r <= ringSegments; r++) {
        const theta = (r / ringSegments) * Math.PI * 2;
        ringPts.push(
          new THREE.Vector3(
            Math.cos(theta) * territoryRadius,
            Math.sin(theta) * territoryRadius * 0.85,
            -1
          )
        );
      }
      const territoryGeo = new THREE.BufferGeometry().setFromPoints(ringPts);
      const territoryMat = new THREE.LineBasicMaterial({
        color: starColor,
        transparent: true,
        opacity: 0.25,
        depthWrite: false,
      });
      const territoryLine = new THREE.Line(territoryGeo, territoryMat);
      territoryLine.raycast = () => {};
      group.add(territoryLine);

      // Determine controlling faction for Stellaris territory influence
      let controllingOwnerId: string | null = null;
      if (sys.hasRelay && stateRef.current.relay.controllingPlayerId) {
        controllingOwnerId = stateRef.current.relay.controllingPlayerId;
      } else {
        const slotOwners = sys.slots
          .map((s) => stateRef.current.planets[s.planetId]?.ownerId)
          .filter(Boolean) as string[];
        if (slotOwners.length > 0) {
          controllingOwnerId = slotOwners[0];
        }
      }

      const controllingPlayer = controllingOwnerId ? stateRef.current.players[controllingOwnerId] : null;
      if (controllingPlayer) {
        // Ethereal Faction Territory Influence Disc (Stellaris Sector Aura)
        const territorySpriteMat = new THREE.SpriteMaterial({
          map: getTerritoryInfluenceTexture(controllingPlayer.color),
          transparent: true,
          opacity: 0.72,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const territorySprite = new THREE.Sprite(territorySpriteMat);
        territorySprite.position.set(0, 0, -2);
        territorySprite.scale.set(territoryRadius * 2.8, territoryRadius * 2.8 * 0.85, 1);
        territorySprite.raycast = () => {};
        group.add(territorySprite);
      }

      galaxyMacroGroup.add(group);
      starMeshes.set(sys.id, { group, mesh: starMesh, light: pointLight, corona: coronaSprite });
    });

    // 2.4 Macro Subspace Hyperlanes
    const hyperlaneGroup = new THREE.Group();
    galaxyMacroGroup.add(hyperlaneGroup);

    interface LanePulse {
      from: THREE.Vector3;
      to: THREE.Vector3;
      progress: number;
      speed: number;
      sprite: THREE.Sprite;
    }
    const lanePulses: LanePulse[] = [];

    const pulseSpriteMat = new THREE.SpriteMaterial({
      map: getShipEngineGlowTexture('#00f3ff'),
      transparent: true,
      opacity: 0.75,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });

    stateRef.current.map.lanes.forEach((lane, lIdx) => {
      const from = systemPositions.get(lane.fromSystemId);
      const to = systemPositions.get(lane.toSystemId);
      if (!from || !to) return;

      const points = [from.clone(), to.clone()];
      const laneGeo = new THREE.BufferGeometry().setFromPoints(points);
      const laneMat = new THREE.LineBasicMaterial({
        color: 0x1e3a8a,
        linewidth: 1.5,
        transparent: true,
        opacity: 0.55,
      });
      const line = new THREE.Line(laneGeo, laneMat);
      line.raycast = () => {};
      hyperlaneGroup.add(line);

      if (lIdx % 2 === 0) {
        const pulseSprite = new THREE.Sprite(pulseSpriteMat);
        pulseSprite.position.copy(from);
        pulseSprite.scale.set(4, 4, 1);
        pulseSprite.raycast = () => {};
        hyperlaneGroup.add(pulseSprite);

        lanePulses.push({
          from,
          to,
          progress: (lIdx * 0.17) % 1,
          speed: 0.14 + (lIdx % 3) * 0.04,
          sprite: pulseSprite,
        });
      }
    });

    // 2.5 Macro Fleets in Transit
    const macroFleetsGroup = new THREE.Group();
    galaxyMacroGroup.add(macroFleetsGroup);

    const shipHullGeo = new THREE.ConeGeometry(3.5, 9, 3);
    shipHullGeo.rotateX(Math.PI / 2);

    const thrusterConeGeo = new THREE.ConeGeometry(1.8, 6, 6);
    thrusterConeGeo.rotateX(-Math.PI / 2);

    interface FleetVisual {
      group: THREE.Group;
      hullMesh: THREE.Mesh;
      thrusterMesh: THREE.Mesh;
      glowSprite: THREE.Sprite;
      fleetId: string;
      routeLine?: THREE.Line;
      targetMarker?: THREE.Sprite;
    }
    const fleetVisuals = new Map<string, FleetVisual>();

    const getOrCreateFleetVisual = (fleet: Fleet, isOwn: boolean): FleetVisual => {
      if (fleetVisuals.has(fleet.id)) return fleetVisuals.get(fleet.id)!;

      const group = new THREE.Group();
      (group as any).userData = { type: 'fleet', fleetId: fleet.id };

      const factionColor = isOwn ? 0x00f3ff : 0xf43f5e;
      const hullMat = new THREE.MeshStandardMaterial({
        color: factionColor,
        roughness: 0.4,
        metalness: 0.8,
      });
      const hullMesh = new THREE.Mesh(shipHullGeo, hullMat);
      (hullMesh as any).userData = { type: 'fleet', fleetId: fleet.id };
      group.add(hullMesh);

      const thrusterMat = new THREE.MeshBasicMaterial({
        color: factionColor,
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
      });
      const thrusterMesh = new THREE.Mesh(thrusterConeGeo, thrusterMat);
      thrusterMesh.position.set(0, 0, -4.5);
      thrusterMesh.raycast = () => {};
      group.add(thrusterMesh);

      const glowMat = new THREE.SpriteMaterial({
        map: getShipEngineGlowTexture(isOwn ? '#00f3ff' : '#f43f5e'),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const glowSprite = new THREE.Sprite(glowMat);
      glowSprite.position.set(0, 0, -6.5);
      glowSprite.scale.set(8, 8, 1);
      glowSprite.raycast = () => {};
      group.add(glowSprite);

      // Trajectory Line (Origin -> Ship -> Target)
      const routePoints = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
      const routeGeo = new THREE.BufferGeometry().setFromPoints(routePoints);
      const routeMat = new THREE.LineBasicMaterial({
        color: factionColor,
        transparent: true,
        opacity: 0.65,
        depthWrite: false,
      });
      const routeLine = new THREE.Line(routeGeo, routeMat);
      routeLine.raycast = () => {};
      routeLine.visible = false;
      macroFleetsGroup.add(routeLine);

      // Target Arrival Marker
      const targetMarkerMat = new THREE.SpriteMaterial({
        map: getWarpGateTexture(),
        transparent: true,
        opacity: 0.75,
        blending: THREE.AdditiveBlending,
      });
      const targetMarker = new THREE.Sprite(targetMarkerMat);
      targetMarker.scale.set(10, 10, 1);
      targetMarker.raycast = () => {};
      targetMarker.visible = false;
      macroFleetsGroup.add(targetMarker);

      macroFleetsGroup.add(group);

      const fv: FleetVisual = { group, hullMesh, thrusterMesh, glowSprite, fleetId: fleet.id, routeLine, targetMarker };
      fleetVisuals.set(fleet.id, fv);
      return fv;
    };

    // =========================================================================
    // 3. MICRO SYSTEM ORRERY GROUP (Visible ONLY in System View Mode)
    // =========================================================================
    // Centered at (500, 400, 0) - Only this single system exists in this view!
    const systemOrreryGroup = new THREE.Group();
    scene.add(systemOrreryGroup);

    interface PlanetVisualObjects {
      systemId: string;
      orbitLines: THREE.Line[];
      planetMeshes: {
        slotIndex: number;
        planetId: string;
        planetMesh: THREE.Mesh;
        cloudMesh?: THREE.Mesh;
        ringMesh?: THREE.Mesh;
        atmoSprite?: THREE.Sprite;
        moonMesh?: THREE.Mesh;
        stationMesh?: THREE.Mesh;
        patrolShips?: { group: THREE.Group; dist: number; speed: number; phase: number }[];
        ghostMeshes: THREE.Mesh[];
      }[];
      warpBuoys: {
        sprite: THREE.Sprite;
        targetSystemId: string;
        targetSystemName: string;
        position: THREE.Vector3;
      }[];
      systemFleetsGroup: THREE.Group;
      systemFleetVisuals: Map<string, FleetVisual>;
    }
    let currentOrrery: PlanetVisualObjects | null = null;

    const buildOrreryForSystem = (system: StarSystem) => {
      // Clear previous orrery elements
      while (systemOrreryGroup.children.length > 0) {
        const obj = systemOrreryGroup.children[0];
        systemOrreryGroup.remove(obj);
      }

      const orbitLines: THREE.Line[] = [];
      const planetMeshes: PlanetVisualObjects['planetMeshes'] = [];
      const warpBuoys: PlanetVisualObjects['warpBuoys'] = [];

      const isRelay = system.hasRelay;
      const sysIdx = Object.keys(stateRef.current.map.systems).indexOf(system.id);
      const starColorHex = isRelay ? '#c084fc' : sysIdx % 3 === 0 ? '#f59e0b' : sysIdx % 3 === 1 ? '#06b6d4' : '#ef4444';
      const starColor = isRelay ? 0xa855f7 : sysIdx % 3 === 0 ? 0xf59e0b : sysIdx % 3 === 1 ? 0x06b6d4 : 0xef4444;
      const centralStarRadius = isRelay ? 26 : 20;

      // 3.1 Central Star Core Sphere
      const starGeo = new THREE.SphereGeometry(centralStarRadius, 36, 36);
      const starMat = new THREE.MeshBasicMaterial({
        map: getSunTexture(starColorHex),
      });
      const centralStarMesh = new THREE.Mesh(starGeo, starMat);
      centralStarMesh.position.set(500, 400, 0);
      (centralStarMesh as any).userData = { type: 'star', systemId: system.id };
      systemOrreryGroup.add(centralStarMesh);

      // Central Star Physical Point Light
      const centralLight = new THREE.PointLight(starColor, 3.2, 950);
      centralLight.position.set(500, 400, 16);
      systemOrreryGroup.add(centralLight);

      // Central Star Corona Flare Sprite
      const coronaSpriteMat = new THREE.SpriteMaterial({
        map: getStarCoronaGlowTexture(starColorHex),
        transparent: true,
        opacity: 0.9,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });
      const centralCorona = new THREE.Sprite(coronaSpriteMat);
      centralCorona.position.set(500, 400, 1);
      centralCorona.scale.set(centralStarRadius * 5.5, centralStarRadius * 5.5, 1);
      centralCorona.raycast = () => {};
      systemOrreryGroup.add(centralCorona);

      // 3.2 Hyperlane Jump Gates at the outer boundary of this system (Radius ~ 340)
      const connectedLanes = stateRef.current.map.lanes.filter(
        (l) => l.fromSystemId === system.id || l.toSystemId === system.id
      );

      const warpSpriteMat = new THREE.SpriteMaterial({
        map: getWarpGateTexture(),
        transparent: true,
        opacity: 0.85,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      });

      connectedLanes.forEach((lane) => {
        const otherSysId = lane.fromSystemId === system.id ? lane.toSystemId : lane.fromSystemId;
        const otherSys = stateRef.current.map.systems[otherSysId];
        if (!otherSys) return;

        // Calculate direction vector toward the connected system in the galaxy
        const angle = Math.atan2(otherSys.y - system.y, otherSys.x - system.x);
        const buoyDist = 380;

        const bx = 500 + Math.cos(angle) * buoyDist;
        const by = 400 + Math.sin(angle) * buoyDist * 0.85;
        const buoyPos = new THREE.Vector3(bx, by, 4);

        // Direction arrow pointing outwards
        const arrowPoints = [
          buoyPos.clone(),
          new THREE.Vector3(
            bx + Math.cos(angle) * 32,
            by + Math.sin(angle) * 32 * 0.85,
            4
          ),
        ];
        const arrowGeo = new THREE.BufferGeometry().setFromPoints(arrowPoints);
        const arrowMat = new THREE.LineBasicMaterial({
          color: 0x00f3ff,
          linewidth: 1.5,
          transparent: true,
          opacity: 0.7,
        });
        const arrowLine = new THREE.Line(arrowGeo, arrowMat);
        arrowLine.raycast = () => {};
        systemOrreryGroup.add(arrowLine);

        // Jump Gate Portal Sprite
        const buoy = new THREE.Sprite(warpSpriteMat);
        buoy.position.copy(buoyPos);
        buoy.scale.set(22, 22, 1);
        (buoy as any).userData = {
          type: 'jump_gate',
          targetSystemId: otherSys.id,
          targetSystemName: otherSys.name,
        };
        systemOrreryGroup.add(buoy);

        warpBuoys.push({
          sprite: buoy,
          targetSystemId: otherSys.id,
          targetSystemName: otherSys.name,
          position: buoyPos,
        });
      });

      // 3.3 Orbit Lines & High-Detail Planets
      system.slots.forEach((slot) => {
        const orbit = calculatePlanetOrbit(system.id, slot.slotIndex, slot.planetId, stateRef.current.timeMs);

        // 1. Orbit Loop Line (centered at 500, 400)
        const orbitPoints: THREE.Vector3[] = [];
        const segments = 64;
        for (let s = 0; s <= segments; s++) {
          const theta = (s / segments) * Math.PI * 2;
          const ox = 500 + Math.cos(theta) * orbit.orbitalRadius;
          const oy = 400 + Math.sin(theta) * orbit.orbitalRadius * 0.85;
          orbitPoints.push(new THREE.Vector3(ox, oy, 0));
        }

        const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
        const orbitMat = new THREE.LineBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.35,
          depthWrite: false,
        });
        const orbitLine = new THREE.Line(orbitGeo, orbitMat);
        orbitLine.raycast = () => {};
        systemOrreryGroup.add(orbitLine);
        orbitLines.push(orbitLine);

        // 2. Planet Sphere Mesh
        const planetRadius = 8 + (slot.size % 4);
        const planetGeo = new THREE.SphereGeometry(planetRadius, 28, 28);

        const asset = getPlanetAsset(slot.type);
        const photorealisticTexture = getLoadedPlanetTexture(asset.spaceImage);
        const atmoColor = asset.glowColor;

        const planetObj = stateRef.current.planets[slot.planetId];
        const planetMat = new THREE.MeshStandardMaterial({
          map: photorealisticTexture,
          roughness: 0.65,
          metalness: 0.1,
        });

        // Colonized worlds glow with nocturnal metropolitan city lights
        if (planetObj && planetObj.ownerId) {
          const ownerObj = stateRef.current.players[planetObj.ownerId];
          const factionColor = ownerObj?.color || '#fde047';
          planetMat.emissiveMap = getCityLightsTexture(factionColor);
          planetMat.emissive = new THREE.Color(factionColor);
          planetMat.emissiveIntensity = 0.65;
        }

        const planetMesh = new THREE.Mesh(planetGeo, planetMat);
        (planetMesh as any).userData = {
          type: 'planet',
          systemId: system.id,
          planetId: slot.planetId,
        };
        systemOrreryGroup.add(planetMesh);

        // 3. Atmospheric Halo Glow Sprite
        const atmoMat = new THREE.SpriteMaterial({
          map: getAtmosphereTexture(atmoColor),
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const atmoSprite = new THREE.Sprite(atmoMat);
        atmoSprite.scale.set(planetRadius * 2.8, planetRadius * 2.8, 1);
        atmoSprite.raycast = () => {};
        systemOrreryGroup.add(atmoSprite);

        // 4. Clouds (Terran / Ocean worlds)
        let cloudMesh: THREE.Mesh | undefined;
        if (slot.type === 'terran' || slot.type === 'ocean') {
          const cloudGeo = new THREE.SphereGeometry(planetRadius * 1.03, 24, 24);
          const cloudMat = new THREE.MeshStandardMaterial({
            map: getCloudTexture(),
            transparent: true,
            opacity: 0.45,
            depthWrite: false,
          });
          cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
          cloudMesh.raycast = () => {};
          systemOrreryGroup.add(cloudMesh);
        }

        // 5. Planetary Rings (Desert / Gas worlds)
        let ringMesh: THREE.Mesh | undefined;
        if (slot.type === 'desert') {
          const ringGeo = new THREE.RingGeometry(planetRadius * 1.4, planetRadius * 2.2, 36);
          const ringMat = new THREE.MeshBasicMaterial({
            color: 0xf59e0b,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.6,
          });
          ringMesh = new THREE.Mesh(ringGeo, ringMat);
          ringMesh.rotation.x = Math.PI / 3;
          ringMesh.raycast = () => {};
          systemOrreryGroup.add(ringMesh);
        }

        // 6. Natural Planetary Moonlet
        let moonMesh: THREE.Mesh | undefined;
        if (slot.slotIndex === 1 || slot.type === 'terran') {
          const moonGeo = new THREE.SphereGeometry(planetRadius * 0.28, 16, 16);
          const moonMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.8,
          });
          moonMesh = new THREE.Mesh(moonGeo, moonMat);
          moonMesh.raycast = () => {};
          systemOrreryGroup.add(moonMesh);
        }

        // 7. Orbital Defense Station / Starbase
        let stationMesh: THREE.Mesh | undefined;
        if (planetObj && planetObj.ownerId) {
          const stationGeo = new THREE.OctahedronGeometry(planetRadius * 0.35);
          const stationMat = new THREE.MeshStandardMaterial({
            color: 0x00f3ff,
            metalness: 0.9,
            roughness: 0.2,
          });
          stationMesh = new THREE.Mesh(stationGeo, stationMat);
          stationMesh.raycast = () => {};
          systemOrreryGroup.add(stationMesh);
        }

        // 7.1 Orbital Patrol Craft (for colonized worlds)
        const patrolShips: { group: THREE.Group; dist: number; speed: number; phase: number }[] = [];
        if (planetObj && planetObj.ownerId) {
          const ownerObj = stateRef.current.players[planetObj.ownerId];
          const factionColor = ownerObj?.color || '#00f3ff';
          const shipCount = 2;

          for (let s = 0; s < shipCount; s++) {
            const pGroup = new THREE.Group();

            // Ship Hull (delta arrowhead)
            const pHullGeo = new THREE.ConeGeometry(1.6, 4.5, 3);
            pHullGeo.rotateX(Math.PI / 2);
            const pHullMat = new THREE.MeshStandardMaterial({
              color: new THREE.Color(factionColor),
              metalness: 0.8,
              roughness: 0.25,
            });
            const pHullMesh = new THREE.Mesh(pHullGeo, pHullMat);
            pHullMesh.raycast = () => {};
            pGroup.add(pHullMesh);

            // Plasma Thruster Flame
            const pThrusterGeo = new THREE.ConeGeometry(0.8, 2.2, 4);
            pThrusterGeo.rotateX(-Math.PI / 2);
            const pThrusterMat = new THREE.MeshBasicMaterial({
              color: 0x00f3ff,
              transparent: true,
              opacity: 0.9,
            });
            const pThrusterMesh = new THREE.Mesh(pThrusterGeo, pThrusterMat);
            pThrusterMesh.position.z = -2.5;
            pThrusterMesh.raycast = () => {};
            pGroup.add(pThrusterMesh);

            systemOrreryGroup.add(pGroup);
            patrolShips.push({
              group: pGroup,
              dist: planetRadius + 9 + s * 4.5,
              speed: 0.0018 + s * 0.0008,
              phase: s * Math.PI,
            });
          }
        }

        // 8. Future Forecast Projection Wireframes
        const ghostMeshes: THREE.Mesh[] = [];
        const ghostGeo = new THREE.SphereGeometry(planetRadius * 0.6, 12, 12);
        const ghostMat = new THREE.MeshBasicMaterial({
          color: 0x00f3ff,
          wireframe: true,
          transparent: true,
          opacity: 0.35,
        });

        for (let g = 0; g < 3; g++) {
          const gm = new THREE.Mesh(ghostGeo, ghostMat);
          gm.raycast = () => {};
          systemOrreryGroup.add(gm);
          ghostMeshes.push(gm);
        }

        planetMeshes.push({
          slotIndex: slot.slotIndex,
          planetId: slot.planetId,
          planetMesh,
          cloudMesh,
          ringMesh,
          atmoSprite,
          moonMesh,
          stationMesh,
          patrolShips,
          ghostMeshes,
        });
      });

      const systemFleetsGroup = new THREE.Group();
      systemOrreryGroup.add(systemFleetsGroup);
      const systemFleetVisuals = new Map<string, FleetVisual>();

      currentOrrery = {
        systemId: system.id,
        orbitLines,
        planetMeshes,
        warpBuoys,
        systemFleetsGroup,
        systemFleetVisuals,
      };
    };

    // =========================================================================
    // 4. 3D Selection Reticle
    // =========================================================================
    const reticleGeo = new THREE.RingGeometry(22, 25, 32);
    const reticleMat = new THREE.MeshBasicMaterial({
      color: 0x00f3ff,
      transparent: true,
      opacity: 0.9,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const reticleMesh = new THREE.Mesh(reticleGeo, reticleMat);
    reticleMesh.visible = false;
    reticleMesh.raycast = () => {};
    scene.add(reticleMesh);

    // 4.1 3D Subtle Hover Reticle
    const hoverReticleGeo = new THREE.RingGeometry(20, 22, 32);
    const hoverReticleMat = new THREE.MeshBasicMaterial({
      color: 0x38bdf8,
      transparent: true,
      opacity: 0.55,
      side: THREE.DoubleSide,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const hoverReticleMesh = new THREE.Mesh(hoverReticleGeo, hoverReticleMat);
    hoverReticleMesh.visible = false;
    hoverReticleMesh.raycast = () => {};
    scene.add(hoverReticleMesh);

    // 4.2 Hyperspace Warp Jump Particles
    const warpStreakCount = 160;
    const warpGeo = new THREE.BufferGeometry();
    const warpPositions = new Float32Array(warpStreakCount * 6);
    const warpColors = new Float32Array(warpStreakCount * 6);

    for (let i = 0; i < warpStreakCount; i++) {
      const angle = Math.random() * Math.PI * 2;
      const radius = 25 + Math.random() * 280;
      const zNear = 60 + Math.random() * 160;
      const zFar = zNear - 350 - Math.random() * 550;

      const px = 500 + Math.cos(angle) * radius;
      const py = 400 + Math.sin(angle) * radius * 0.85;

      warpPositions[i * 6] = px;
      warpPositions[i * 6 + 1] = py;
      warpPositions[i * 6 + 2] = zNear;

      warpPositions[i * 6 + 3] = px;
      warpPositions[i * 6 + 4] = py;
      warpPositions[i * 6 + 5] = zFar;

      const isViolet = i % 3 === 0;
      const r = isViolet ? 0.75 : 0.0;
      const g = isViolet ? 0.4 : 0.95;
      const b = 1.0;

      warpColors[i * 6] = r;
      warpColors[i * 6 + 1] = g;
      warpColors[i * 6 + 2] = b;
      warpColors[i * 6 + 3] = r;
      warpColors[i * 6 + 4] = g;
      warpColors[i * 6 + 5] = b;
    }

    warpGeo.setAttribute('position', new THREE.BufferAttribute(warpPositions, 3));
    warpGeo.setAttribute('color', new THREE.BufferAttribute(warpColors, 3));

    const warpMat = new THREE.LineBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
    });
    const warpTunnel = new THREE.LineSegments(warpGeo, warpMat);
    warpTunnel.raycast = () => {};
    scene.add(warpTunnel);

    let warpProgress = 0;
    let isWarping = false;

    triggerWarpRef.current = () => {
      isWarping = true;
      warpProgress = 1.0;
    };

    // =========================================================================
    // 5. Interactive Mouse Controls
    // =========================================================================
    let isDragging = false;
    let hasDragged = false;
    let dragStartPos = { x: 0, y: 0 };
    let previousMousePosition = { x: 0, y: 0 };
    let hoveredInteractiveId: string | null = null;
    let hoveredPlanetIdForReticle: string | null = null;
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      if (e.button !== 0 && e.button !== 1) return;
      isDragging = true;
      hasDragged = false;
      dragStartPos = { x: e.clientX, y: e.clientY };
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      if (isDragging) {
        const deltaX = e.clientX - previousMousePosition.x;
        const deltaY = e.clientY - previousMousePosition.y;

        const distMoved = Math.hypot(e.clientX - dragStartPos.x, e.clientY - dragStartPos.y);
        if (distMoved > 4) {
          hasDragged = true;
        }

        const panFactor = targetCameraPos.z / 950;
        targetLookAt.x -= deltaX * panFactor;
        targetLookAt.y += deltaY * panFactor;

        previousMousePosition = { x: e.clientX, y: e.clientY };
        return;
      }

      // Hover Raycasting when not dragging
      raycaster.setFromCamera(mouse, camera);
      const isSystemMode = viewModeRef.current === 'system';
      const targetGroup = isSystemMode ? systemOrreryGroup : galaxyMacroGroup;
      const intersects = raycaster.intersectObjects(targetGroup.children, true);

      let foundInteractive = false;
      let currentHoverId: string | null = null;
      let currentHoverPlanet: string | null = null;

      for (const hit of intersects) {
        const udata = (hit.object as any).userData;
        if (udata) {
          foundInteractive = true;
          if (udata.type === 'planet') {
            currentHoverId = udata.planetId;
            currentHoverPlanet = udata.planetId;
            break;
          }
          if (udata.type === 'star') {
            currentHoverId = `star_${udata.systemId}`;
            break;
          }
          if (udata.type === 'system') {
            currentHoverId = udata.systemId;
            break;
          }
          if (udata.type === 'jump_gate') {
            currentHoverId = `gate_${udata.targetSystemId}`;
            break;
          }
          if (udata.type === 'fleet') {
            currentHoverId = udata.fleetId;
            break;
          }
        }
      }

      container.style.cursor = foundInteractive ? 'pointer' : 'grab';

      if (currentHoverId !== hoveredInteractiveId) {
        if (currentHoverId) {
          sound.playHover();
        }
        hoveredInteractiveId = currentHoverId;
        hoveredPlanetIdForReticle = currentHoverPlanet;
        if (onHoverPlanetRef.current) {
          onHoverPlanetRef.current(currentHoverPlanet);
        }
      }
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = targetCameraPos.z < 250 ? 0.45 : 0.85;
      const zoomDelta = e.deltaY * zoomFactor;

      const minZ = viewModeRef.current === 'system' ? 45 : 450;
      const maxZ = viewModeRef.current === 'system' ? 700 : 1350;

      targetCameraPos.z = Math.max(minZ, Math.min(maxZ, targetCameraPos.z + zoomDelta));

      if (onZoomChange) {
        const baseZ = viewModeRef.current === 'system' ? 260 : 750;
        const computedZoom = +(baseZ / targetCameraPos.z).toFixed(2);
        onZoomChange(computedZoom);
      }
    };

    const onClick = (e: MouseEvent) => {
      if (hasDragged) {
        hasDragged = false;
        return;
      }

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const isSystemMode = viewModeRef.current === 'system';
      const targetGroup = isSystemMode ? systemOrreryGroup : galaxyMacroGroup;
      const intersects = raycaster.intersectObjects(targetGroup.children, true);

      for (const hit of intersects) {
        const udata = (hit.object as any).userData;
        if (udata) {
          if (udata.type === 'jump_gate') {
            sound.playWarp();
            if (onEnterSystemView) onEnterSystemView(udata.targetSystemId);
            else onSelectSystem(udata.targetSystemId);
            return;
          }
          if (udata.type === 'star') {
            sound.playClick();
            onSelectSystem(udata.systemId);
            return;
          }
          if (udata.type === 'fleet') {
            sound.playClick();
            onSelectFleet(udata.fleetId);
            return;
          }
          if (udata.type === 'system') {
            sound.playClick();
            onSelectSystem(udata.systemId);
            return;
          }
          if (udata.type === 'planet') {
            sound.playClick();
            if (onSelectPlanet) {
              onSelectPlanet(udata.systemId, udata.planetId);
            }
            return;
          }
        }
      }
    };

    const onDoubleClick = (e: MouseEvent) => {
      if (hasDragged) {
        hasDragged = false;
        return;
      }

      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const isSystemMode = viewModeRef.current === 'system';
      const targetGroup = isSystemMode ? systemOrreryGroup : galaxyMacroGroup;
      const intersects = raycaster.intersectObjects(targetGroup.children, true);

      for (const hit of intersects) {
        const udata = (hit.object as any).userData;
        if (udata) {
          if (udata.type === 'jump_gate') {
            sound.playWarp();
            if (onEnterSystemView) onEnterSystemView(udata.targetSystemId);
            else onSelectSystem(udata.targetSystemId);
            return;
          }
          if (udata.type === 'star') {
            sound.playClick();
            onSelectSystem(udata.systemId);
            return;
          }
          if (udata.type === 'system') {
            sound.playWarp();
            if (onEnterSystemView) {
              onEnterSystemView(udata.systemId);
            } else {
              onSelectSystem(udata.systemId);
            }
            return;
          }
          if (udata.type === 'planet') {
            sound.playWarp();
            if (onSelectPlanet) {
              onSelectPlanet(udata.systemId, udata.planetId);
            }
            return;
          }
        }
      }

      // If in system mode and double clicked on empty space (no hit on targetGroup), zoom back out to galaxy view
      if (isSystemMode && onExitSystemView) {
        sound.playClick();
        onExitSystemView();
      }
    };

    const onKeyDown = (e: KeyboardEvent) => {
      if (['INPUT', 'TEXTAREA'].includes((e.target as HTMLElement)?.tagName)) return;
      if (e.key === 'Escape' || e.key.toLowerCase() === 'm') {
        if (viewModeRef.current === 'system' && onExitSystemView) {
          sound.playClick();
          onExitSystemView();
        } else if (viewModeRef.current === 'galaxy' && onEnterSystemView) {
          sound.playWarp();
          onEnterSystemView(focusedSystemIdRef.current);
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);
    container.addEventListener('dblclick', onDoubleClick);
    window.addEventListener('keydown', onKeyDown);

    const onResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);
    const resizeObserver = new ResizeObserver(() => {
      onResize();
    });
    resizeObserver.observe(container);

    // =========================================================================
    // 6. Main 60 FPS Animation & Render Loop
    // =========================================================================
    let animationFrameId: number;
    let clock = new THREE.Clock();
    let frameCounter = 0;
    const tempProjVec = new THREE.Vector3();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const currentTimeMs = stateRef.current.timeMs;
      frameCounter++;

      const isSystemMode = viewModeRef.current === 'system';

      // 6.1 Two-Tier Visibility Switch (Stellaris Style)
      galaxyMacroGroup.visible = !isSystemMode;
      systemOrreryGroup.visible = isSystemMode;

      // 6.2 Camera Positioning
      if (isSystemMode) {
        targetCameraPos.x = targetLookAt.x;
        targetCameraPos.y = targetLookAt.y - Math.min(220, targetCameraPos.z * 0.55);
      } else {
        targetCameraPos.x = targetLookAt.x;
        targetCameraPos.y = targetLookAt.y - Math.min(280, targetCameraPos.z * 0.5);
      }

      camera.position.lerp(targetCameraPos, 0.08);
      camera.lookAt(targetLookAt);

      // 6.3 Cosmic Background Motion
      spiralGroup.rotation.z += 0.00018;
      starField.rotation.z += 0.00008;

      const currentCoverage = sensorCoverageRef.current;
      const isGodMode = godModeRef.current;

      // 6.4 If in Galaxy Macro Mode: Update macro star lights, pulses, and fleets
      if (!isSystemMode) {
        starMeshes.forEach(({ group, light, corona }, sysId) => {
          const isVisible = isGodMode || currentCoverage.has(sysId);
          light.intensity = isVisible ? 2.5 : 0.6;
          corona.material.opacity = isVisible ? 0.88 : 0.3;
        });

        lanePulses.forEach((pulse) => {
          pulse.progress += delta * pulse.speed;
          if (pulse.progress > 1) pulse.progress = 0;
          pulse.sprite.position.lerpVectors(pulse.from, pulse.to, pulse.progress);
          pulse.sprite.position.z = 2;
        });

        const activeFleets = Object.values(stateRef.current.fleets);
        const activeFleetIds = new Set<string>();

        activeFleets.forEach((fleet) => {
          const isOwn = fleet.ownerId === activePlayerIdRef.current;
          const isVisible =
            isGodMode ||
            isOwn ||
            currentCoverage.has(fleet.originSystemId) ||
            currentCoverage.has(fleet.targetSystemId);

          if (!isVisible) return;
          activeFleetIds.add(fleet.id);

          const visual = getOrCreateFleetVisual(fleet, isOwn);
          const pos = getFleetCurrentPosition(fleet, currentTimeMs, stateRef.current.map.systems);

          visual.group.position.set(pos.x, pos.y, 8);

          if (fleet.status === 'in_transit' || fleet.status === 'returning' || fleet.status === 'intercepting') {
            const originSys = stateRef.current.map.systems[fleet.originSystemId];
            const targetSys = stateRef.current.map.systems[fleet.targetSystemId];
            if (originSys && targetSys) {
              const dx = targetSys.x - originSys.x;
              const dy = targetSys.y - originSys.y;
              visual.group.rotation.z = Math.atan2(dy, dx) - Math.PI / 2;

              if (visual.routeLine) {
                const posAttr = (visual.routeLine.geometry as THREE.BufferGeometry).attributes.position;
                posAttr.setXYZ(0, originSys.x, originSys.y, 4);
                posAttr.setXYZ(1, pos.x, pos.y, 8);
                posAttr.setXYZ(2, targetSys.x, targetSys.y, 4);
                posAttr.needsUpdate = true;
                visual.routeLine.visible = true;
              }
              if (visual.targetMarker) {
                visual.targetMarker.position.set(targetSys.x, targetSys.y, 6);
                visual.targetMarker.visible = true;
              }
            }
            const pulseScale = 1.0 + Math.sin(currentTimeMs * 0.015) * 0.25;
            visual.thrusterMesh.scale.set(pulseScale, pulseScale, pulseScale);
            visual.glowSprite.scale.set(8 * pulseScale, 8 * pulseScale, 1);
          } else {
            visual.group.rotation.z += delta * 0.5;
            visual.thrusterMesh.scale.set(0.6, 0.6, 0.6);
            if (visual.routeLine) visual.routeLine.visible = false;
            if (visual.targetMarker) visual.targetMarker.visible = false;
          }
        });

        fleetVisuals.forEach((visual, fleetId) => {
          if (!activeFleetIds.has(fleetId)) {
            macroFleetsGroup.remove(visual.group);
            if (visual.routeLine) macroFleetsGroup.remove(visual.routeLine);
            if (visual.targetMarker) macroFleetsGroup.remove(visual.targetMarker);
            fleetVisuals.delete(fleetId);
          }
        });
      }

      // 6.5 If in System View Mode: Update isolated planetary orbits & jump gates
      if (isSystemMode) {
        const activeSysId = focusedSystemIdRef.current;
        const currentSystem = stateRef.current.map.systems[activeSysId];

        if (currentSystem) {
          if (!currentOrrery || currentOrrery.systemId !== currentSystem.id) {
            buildOrreryForSystem(currentSystem);
          }

          if (currentOrrery) {
            currentOrrery.planetMeshes.forEach((pVis) => {
              const orbit = calculatePlanetOrbit(
                currentSystem.id,
                pVis.slotIndex,
                pVis.planetId,
                currentTimeMs
              );

              // Center orbits exactly at (500, 400)
              const px = 500 + orbit.x;
              const py = 400 + orbit.y;
              const pz = 5;

              pVis.planetMesh.position.set(px, py, pz);
              pVis.planetMesh.rotation.y += delta * 0.4;

              if (pVis.atmoSprite) pVis.atmoSprite.position.set(px, py, pz);

              if (pVis.cloudMesh) {
                pVis.cloudMesh.position.set(px, py, pz);
                pVis.cloudMesh.rotation.y += delta * 0.55;
              }

              if (pVis.ringMesh) pVis.ringMesh.position.set(px, py, pz);

              if (pVis.moonMesh) {
                const moonTheta = currentTimeMs * 0.002 + pVis.slotIndex;
                const moonDist = 16;
                pVis.moonMesh.position.set(
                  px + Math.cos(moonTheta) * moonDist,
                  py + Math.sin(moonTheta) * moonDist * 0.85,
                  pz + 2
                );
              }

              if (pVis.stationMesh) {
                const satTheta = currentTimeMs * 0.0015;
                const satDist = 12;
                pVis.stationMesh.position.set(
                  px + Math.cos(satTheta) * satDist,
                  py + Math.sin(satTheta) * satDist * 0.85,
                  pz + 3
                );
                pVis.stationMesh.rotation.x += delta;
                pVis.stationMesh.rotation.y += delta * 1.2;
              }

              if (pVis.patrolShips) {
                pVis.patrolShips.forEach((ps) => {
                  const pTheta = currentTimeMs * ps.speed + ps.phase;
                  const psx = px + Math.cos(pTheta) * ps.dist;
                  const psy = py + Math.sin(pTheta) * ps.dist * 0.85;
                  const psz = pz + 2.5 + Math.sin(pTheta * 2) * 1.5;

                  ps.group.position.set(psx, psy, psz);
                  ps.group.rotation.z = pTheta + Math.PI / 2;
                });
              }

              pVis.ghostMeshes.forEach((gm, gIdx) => {
                if (showProjectionsRef.current && orbit.projections[gIdx]) {
                  gm.visible = true;
                  const proj = orbit.projections[gIdx];
                  gm.position.set(500 + proj.x, 400 + proj.y, pz);
                } else {
                  gm.visible = false;
                }
              });
            });

            // 6.5.2 In-System Active & Moving Fleets Update (3D System View)
            if (currentOrrery.systemFleetsGroup) {
              const activeInSystemFleetIds = new Set<string>();
              const sysFleets = Object.values(stateRef.current.fleets).filter(
                (f) =>
                  f.originSystemId === currentSystem.id ||
                  f.targetSystemId === currentSystem.id
              );

              sysFleets.forEach((fleet) => {
                const isOwn = fleet.ownerId === activePlayerIdRef.current;
                const isVisible =
                  isGodMode ||
                  isOwn ||
                  currentCoverage.has(currentSystem.id) ||
                  currentCoverage.has(fleet.originSystemId) ||
                  currentCoverage.has(fleet.targetSystemId);

                if (!isVisible) return;
                activeInSystemFleetIds.add(fleet.id);

                let vis = currentOrrery!.systemFleetVisuals.get(fleet.id);
                if (!vis) {
                  const group = new THREE.Group();
                  (group as any).userData = { type: 'fleet', fleetId: fleet.id };

                  const factionColor = isOwn ? 0x00f3ff : 0xf43f5e;
                  const hullMat = new THREE.MeshStandardMaterial({
                    color: factionColor,
                    roughness: 0.35,
                    metalness: 0.8,
                  });
                  const hullMesh = new THREE.Mesh(shipHullGeo, hullMat);
                  (hullMesh as any).userData = { type: 'fleet', fleetId: fleet.id };
                  group.add(hullMesh);

                  const thrusterMat = new THREE.MeshBasicMaterial({
                    color: factionColor,
                    transparent: true,
                    opacity: 0.9,
                    blending: THREE.AdditiveBlending,
                  });
                  const thrusterMesh = new THREE.Mesh(thrusterConeGeo, thrusterMat);
                  thrusterMesh.position.set(0, 0, -4.5);
                  thrusterMesh.raycast = () => {};
                  group.add(thrusterMesh);

                  const glowMat = new THREE.SpriteMaterial({
                    map: getShipEngineGlowTexture(isOwn ? '#00f3ff' : '#f43f5e'),
                    transparent: true,
                    opacity: 0.85,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                  });
                  const glowSprite = new THREE.Sprite(glowMat);
                  glowSprite.position.set(0, 0, -6.5);
                  glowSprite.scale.set(7, 7, 1);
                  glowSprite.raycast = () => {};
                  group.add(glowSprite);

                  // 3D In-system route line
                  const routePts = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(0, 0, 0)];
                  const routeGeo = new THREE.BufferGeometry().setFromPoints(routePts);
                  const routeMat = new THREE.LineBasicMaterial({
                    color: factionColor,
                    transparent: true,
                    opacity: 0.6,
                    depthWrite: false,
                  });
                  const routeLine = new THREE.Line(routeGeo, routeMat);
                  routeLine.raycast = () => {};
                  currentOrrery!.systemFleetsGroup.add(routeLine);

                  currentOrrery!.systemFleetsGroup.add(group);

                  vis = { group, hullMesh, thrusterMesh, glowSprite, fleetId: fleet.id, routeLine };
                  currentOrrery!.systemFleetVisuals.set(fleet.id, vis);
                }

                // Compute position in system coordinates
                const totalTravelMs = Math.max(1, fleet.arrivalTime - fleet.departureTime);
                const elapsedMs = Math.max(0, currentTimeMs - fleet.departureTime);
                const progress = Math.min(1, elapsedMs / totalTravelMs);

                let startX = 500;
                let startY = 400;
                let targetX = 500;
                let targetY = 400;

                const getPlanetPos = (planetId?: string) => {
                  if (!planetId || !currentOrrery) return null;
                  const p = currentOrrery.planetMeshes.find((pm) => pm.planetId === planetId);
                  return p ? p.planetMesh.position : null;
                };

                const getBuoyPos = (otherSysId: string) => {
                  const b = currentOrrery?.warpBuoys.find((wb) => wb.targetSystemId === otherSysId);
                  if (b) return b.position;
                  const otherSys = stateRef.current.map.systems[otherSysId];
                  if (!otherSys) return new THREE.Vector3(500, 100, 4);
                  const angle = Math.atan2(otherSys.y - currentSystem.y, otherSys.x - currentSystem.x);
                  return new THREE.Vector3(
                    500 + Math.cos(angle) * 410,
                    400 + Math.sin(angle) * 410 * 0.85,
                    4
                  );
                };

                if (fleet.status === 'orbiting') {
                  const pPos = getPlanetPos(fleet.targetPlanetId);
                  const ox = pPos ? pPos.x : 500;
                  const oy = pPos ? pPos.y : 400;
                  const orbitR = pPos ? 22 : 46;
                  const theta = currentTimeMs * 0.0012 + (fleet.id.charCodeAt(0) % 10);
                  const fx = ox + Math.cos(theta) * orbitR;
                  const fy = oy + Math.sin(theta) * orbitR * 0.85;

                  vis.group.position.set(fx, fy, 8);
                  vis.group.rotation.z = theta + Math.PI / 2;
                  if (vis.routeLine) vis.routeLine.visible = false;
                } else {
                  if (
                    fleet.originSystemId === currentSystem.id &&
                    fleet.targetSystemId === currentSystem.id
                  ) {
                    const pTarget = getPlanetPos(fleet.targetPlanetId);
                    targetX = pTarget ? pTarget.x : 500;
                    targetY = pTarget ? pTarget.y : 400;
                  } else if (fleet.targetSystemId === currentSystem.id) {
                    const bPos = getBuoyPos(fleet.originSystemId);
                    startX = bPos.x;
                    startY = bPos.y;
                    const pTarget = getPlanetPos(fleet.targetPlanetId);
                    targetX = pTarget ? pTarget.x : 500;
                    targetY = pTarget ? pTarget.y : 400;
                  } else {
                    const bPos = getBuoyPos(fleet.targetSystemId);
                    targetX = bPos.x;
                    targetY = bPos.y;
                    const pOrigin = getPlanetPos(fleet.targetPlanetId);
                    startX = pOrigin ? pOrigin.x : 500;
                    startY = pOrigin ? pOrigin.y : 400;
                  }

                  const fx = startX + (targetX - startX) * progress;
                  const fy = startY + (targetY - startY) * progress;
                  vis.group.position.set(fx, fy, 8);

                  const angle = Math.atan2(targetY - startY, targetX - startX);
                  vis.group.rotation.z = angle - Math.PI / 2;

                  if (vis.routeLine) {
                    const posAttr = (vis.routeLine.geometry as THREE.BufferGeometry).attributes.position;
                    posAttr.setXYZ(0, startX, startY, 4);
                    posAttr.setXYZ(1, targetX, targetY, 4);
                    posAttr.needsUpdate = true;
                    vis.routeLine.visible = true;
                  }
                }

                const pulseScale = 1.0 + Math.sin(currentTimeMs * 0.015) * 0.25;
                vis.thrusterMesh.scale.set(pulseScale, pulseScale, pulseScale);
                vis.glowSprite.scale.set(7 * pulseScale, 7 * pulseScale, 1);
              });

              // Cleanup removed in-system fleet visuals
              currentOrrery.systemFleetVisuals.forEach((vis, fid) => {
                if (!activeInSystemFleetIds.has(fid)) {
                  currentOrrery!.systemFleetsGroup.remove(vis.group);
                  if (vis.routeLine) currentOrrery!.systemFleetsGroup.remove(vis.routeLine);
                  currentOrrery!.systemFleetVisuals.delete(fid);
                }
              });
            }
          }
        }
      }

      // 6.6 Selection Reticle Update
      const curSelected = selectedTargetRef.current;
      if (curSelected) {
        if (!isSystemMode && curSelected.type === 'system') {
          const sys = stateRef.current.map.systems[curSelected.systemId];
          if (sys) {
            reticleMesh.visible = true;
            reticleMesh.position.set(sys.x, sys.y, 8);
            reticleMesh.scale.set(1.4, 1.4, 1);
            reticleMesh.rotation.z += delta * 1.8;
          }
        } else if (isSystemMode && curSelected.type === 'system') {
          reticleMesh.visible = true;
          reticleMesh.position.set(500, 400, 8);
          reticleMesh.scale.set(1.6, 1.6, 1);
          reticleMesh.rotation.z += delta * 1.5;
        } else if (isSystemMode && curSelected.type === 'planet' && currentOrrery) {
          const pVis = currentOrrery.planetMeshes.find((p) => p.planetId === curSelected.planetId);
          if (pVis) {
            reticleMesh.visible = true;
            reticleMesh.position.copy(pVis.planetMesh.position);
            reticleMesh.position.z = 10;
            reticleMesh.scale.set(0.9, 0.9, 1);
            reticleMesh.rotation.z += delta * 2.2;
          }
        } else {
          reticleMesh.visible = false;
        }
      } else {
        reticleMesh.visible = false;
      }

      // 6.6.1 Hover Reticle Animation (Soft cyan ring on hovered planet)
      if (hoveredPlanetIdForReticle && isSystemMode && currentOrrery) {
        const pVis = currentOrrery.planetMeshes.find((p) => p.planetId === hoveredPlanetIdForReticle);
        if (pVis) {
          hoverReticleMesh.visible = true;
          hoverReticleMesh.position.copy(pVis.planetMesh.position);
          hoverReticleMesh.position.z = 9;
          hoverReticleMesh.scale.set(0.95, 0.95, 1);
          hoverReticleMesh.rotation.z -= delta * 1.5;
        } else {
          hoverReticleMesh.visible = false;
        }
      } else {
        hoverReticleMesh.visible = false;
      }

      // 6.6.2 Hyperspace Warp Jump Tunnel Animation
      if (isWarping) {
        warpProgress -= delta * 2.2;
        if (warpProgress <= 0) {
          warpProgress = 0;
          isWarping = false;
          warpMat.opacity = 0;
          warpTunnel.visible = false;
        } else {
          warpTunnel.visible = true;
          warpMat.opacity = Math.sin(warpProgress * Math.PI) * 0.9;
          warpTunnel.rotation.z += delta * 3.8;
          warpTunnel.position.set(targetLookAt.x, targetLookAt.y, targetCameraPos.z - 200);
        }
      } else {
        warpTunnel.visible = false;
      }

      // 6.7 Project 3D Coordinates to 2D Screen for HTML Billboard Labels
      if (frameCounter % 2 === 0) {
        const labels: ScreenLabel[] = [];

        if (!isSystemMode) {
          // Macro Galaxy View Labels (All 12 Systems)
          Object.values(stateRef.current.map.systems).forEach((sys) => {
            tempProjVec.set(sys.x, sys.y - 24, 0);
            tempProjVec.project(camera);

            const screenX = ((tempProjVec.x + 1) * width) / 2;
            const screenY = ((-tempProjVec.y + 1) * height) / 2;
            const isVisible = tempProjVec.z < 1 && tempProjVec.z > -1;

            if (isVisible) {
              const isHomeworld = Object.values(stateRef.current.planets).some(
                (p) => p.systemId === sys.id && p.ownerId === activePlayerIdRef.current && p.isHomeworld
              );
              const isRelay = sys.hasRelay;
              const starColor = isRelay ? '#c084fc' : '#38bdf8';

              let controllingOwnerId: string | null = null;
              if (isRelay && stateRef.current.relay.controllingPlayerId) {
                controllingOwnerId = stateRef.current.relay.controllingPlayerId;
              } else {
                const slotOwners = sys.slots
                  .map((s) => stateRef.current.planets[s.planetId]?.ownerId)
                  .filter(Boolean) as string[];
                if (slotOwners.length > 0) {
                  controllingOwnerId = slotOwners[0];
                }
              }

              const controllingPlayer = controllingOwnerId
                ? stateRef.current.players[controllingOwnerId]
                : null;
              const colonizedCount = sys.slots.filter(
                (s) => stateRef.current.planets[s.planetId]?.ownerId
              ).length;
              const openSlotsCount = sys.slots.length - colonizedCount;

              let subtitle = `${sys.slots.length} Gezegen`;
              if (isHomeworld) subtitle = 'ANA DÜNYA';
              else if (isRelay) subtitle = 'NEXUS RÖLESİ';

              labels.push({
                id: sys.id,
                type: 'system',
                title: sys.name,
                subtitle,
                color: isHomeworld ? '#10b981' : starColor,
                systemId: sys.id,
                x: screenX,
                y: screenY,
                visible: true,
                ownerName: controllingPlayer?.name,
                ownerColor: controllingPlayer?.color,
                colonizedCount,
                openSlotsCount,
                hasPoi: !!sys.poi && !sys.poi.explored,
                hasDebris: !!sys.hasDebris && ((sys.hasDebris.ore || 0) > 0 || (sys.hasDebris.crystal || 0) > 0),
                isRelay,
              });
            }
          });
        } else if (currentOrrery) {
          // In-System Orrery Labels: Central Star + Planets + Perimeter Jump Gates
          const activeSys = stateRef.current.map.systems[focusedSystemIdRef.current];

          // 1. Central Star Label
          if (activeSys) {
            tempProjVec.set(500, 400 - 32, 0);
            tempProjVec.project(camera);
            labels.push({
              id: `star_${activeSys.id}`,
              type: 'star',
              title: activeSys.name,
              subtitle: activeSys.hasRelay ? 'NEXUS RÖLE MERKEZİ' : 'YILDIZ ÇEKİRDEĞİ',
              color: activeSys.hasRelay ? '#c084fc' : '#f59e0b',
              systemId: activeSys.id,
              x: ((tempProjVec.x + 1) * width) / 2,
              y: ((-tempProjVec.y + 1) * height) / 2,
              visible: true,
            });
          }

          // 2. Planet Labels
          if (activeSys) {
            currentOrrery.planetMeshes.forEach((pVis) => {
              tempProjVec.copy(pVis.planetMesh.position);
              tempProjVec.y -= 14;
              tempProjVec.project(camera);

              const slot = activeSys.slots.find((s) => s.planetId === pVis.planetId);
              labels.push({
                id: pVis.planetId,
                type: 'planet',
                title: slot ? slot.name : 'Gezegen',
                subtitle: slot ? slot.type.toUpperCase() : undefined,
                color: '#38bdf8',
                systemId: activeSys.id,
                planetId: pVis.planetId,
                x: ((tempProjVec.x + 1) * width) / 2,
                y: ((-tempProjVec.y + 1) * height) / 2,
                visible: true,
              });
            });
          }

          // 3. Perimeter Hyperlane Jump Gate Labels (Warp Exit Arrows)
          currentOrrery.warpBuoys.forEach((wb) => {
            tempProjVec.copy(wb.position);
            tempProjVec.y -= 18;
            tempProjVec.project(camera);

            labels.push({
              id: `gate_${wb.targetSystemId}`,
              type: 'jump_gate',
              title: wb.targetSystemName,
              color: '#00f3ff',
              systemId: activeSys?.id || '',
              targetSystemId: wb.targetSystemId,
              x: ((tempProjVec.x + 1) * width) / 2,
              y: ((-tempProjVec.y + 1) * height) / 2,
              visible: true,
            });
          });

          // 4. In-System Active Fleets Labels
          if (currentOrrery.systemFleetVisuals) {
            currentOrrery.systemFleetVisuals.forEach((vis, fId) => {
              const fl = stateRef.current.fleets[fId];
              if (!fl) return;
              tempProjVec.copy(vis.group.position);
              tempProjVec.y -= 14;
              tempProjVec.project(camera);
              const isVisible = tempProjVec.z < 1 && tempProjVec.z > -1;
              if (isVisible) {
                const isOwn = fl.ownerId === activePlayerIdRef.current;
                const owner = stateRef.current.players[fl.ownerId];
                const totalShips = Object.values(fl.ships).reduce((a, b) => a + b, 0);
                const remainingMs = Math.max(0, fl.arrivalTime - currentTimeMs);
                labels.push({
                  id: `fleet_${fl.id}`,
                  type: 'fleet',
                  title: isOwn ? (fl.name || 'Filo') : 'Düşman Filo',
                  subtitle:
                    fl.status === 'orbiting'
                      ? `${totalShips}G • Yörüngede`
                      : `${totalShips}G • ${formatDuration(remainingMs)}`,
                  color: owner?.color || (isOwn ? '#00f3ff' : '#f43f5e'),
                  systemId: activeSys?.id || '',
                  fleetId: fl.id,
                  x: ((tempProjVec.x + 1) * width) / 2,
                  y: ((-tempProjVec.y + 1) * height) / 2,
                  visible: true,
                });
              }
            });
          }
        }

        setHudLabels(labels);
      }

      renderer.render(scene, camera);
    };

    animate();

    // =========================================================================
    // 7. Cleanup
    // =========================================================================
    return () => {
      cancelAnimationFrame(animationFrameId);
      resizeObserver.disconnect();
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);
      container.removeEventListener('dblclick', onDoubleClick);
      window.removeEventListener('keydown', onKeyDown);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
      spiralGeo.dispose();
      spiralMat.dispose();
      pulseSpriteMat.dispose();
      shipHullGeo.dispose();
      thrusterConeGeo.dispose();
      reticleGeo.dispose();
      reticleMat.dispose();
      hoverReticleGeo.dispose();
      hoverReticleMat.dispose();
      warpGeo.dispose();
      warpMat.dispose();
    };
  }, []);

  return (
    <div className="relative w-full h-full overflow-hidden select-none">
      {/* 2.5D WebGL Canvas Mount Container */}
      <div
        ref={mountRef}
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      {/* Floating 2.5D Sci-Fi HUD Billboard Labels */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {hudLabels.map((lbl) => (
          <div
            key={`hud_${lbl.type}_${lbl.id}`}
            style={{
              position: 'absolute',
              left: `${lbl.x}px`,
              top: `${lbl.y}px`,
              transform: 'translate(-50%, 0)',
            }}
            className="pointer-events-auto cursor-pointer transition-opacity duration-150 hover:scale-105"
            onClick={(e) => {
              e.stopPropagation();
              sound.playClick();
              if (lbl.type === 'jump_gate' && lbl.targetSystemId) {
                sound.playWarp();
                if (onEnterSystemView) onEnterSystemView(lbl.targetSystemId);
                else onSelectSystem(lbl.targetSystemId);
              } else if (lbl.type === 'star' || lbl.type === 'system') {
                onSelectSystem(lbl.systemId);
              } else if (lbl.type === 'planet' && onSelectPlanet && lbl.planetId) {
                onSelectPlanet(lbl.systemId, lbl.planetId);
              } else if (lbl.type === 'fleet' && lbl.fleetId) {
                onSelectFleet(lbl.fleetId);
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              if (lbl.type === 'jump_gate' && lbl.targetSystemId) {
                sound.playWarp();
                if (onEnterSystemView) onEnterSystemView(lbl.targetSystemId);
                else onSelectSystem(lbl.targetSystemId);
              } else if (lbl.type === 'star') {
                sound.playClick();
                onSelectSystem(lbl.systemId);
              } else if (lbl.type === 'system') {
                sound.playWarp();
                if (onEnterSystemView) onEnterSystemView(lbl.systemId);
                else onSelectSystem(lbl.systemId);
              }
            }}
          >
            {lbl.type === 'system' ? (
              <div className="flex flex-col items-center group">
                <div
                  className="px-2.5 py-0.5 rounded-md bg-[#070d1d]/90 border border-slate-700/80 shadow-xl text-[11px] font-mono font-bold text-white flex items-center gap-1.5 backdrop-blur-md hover:border-cyber-cyan transition-all"
                  style={{
                    borderTop: lbl.ownerColor ? `2px solid ${lbl.ownerColor}` : undefined,
                  }}
                >
                  <span
                    className="w-2 h-2 rounded-full inline-block shadow-sm"
                    style={{ backgroundColor: lbl.color }}
                  />
                  <span>{lbl.title}</span>
                  {lbl.ownerName && (
                    <span
                      className="text-[9px] font-mono px-1 py-0.2 rounded border"
                      style={{
                        backgroundColor: `${lbl.ownerColor}20`,
                        borderColor: `${lbl.ownerColor}60`,
                        color: lbl.ownerColor,
                      }}
                    >
                      {lbl.ownerName.slice(0, 8)}
                    </span>
                  )}
                </div>

                {/* Subtitle & Stellaris Badges Row */}
                <div className="flex items-center gap-1 mt-0.5">
                  {lbl.isRelay ? (
                    <span className="text-[9px] font-mono font-bold px-1.5 py-0.2 rounded bg-purple-950/80 border border-purple-600/70 text-purple-300 shadow-sm">
                      ⚡ RÖLE
                    </span>
                  ) : (
                    <>
                      {lbl.colonizedCount ? (
                        <span className="text-[9px] font-mono font-bold px-1 rounded bg-emerald-950/80 border border-emerald-600/60 text-emerald-300 shadow-sm">
                          🏛️ {lbl.colonizedCount}
                        </span>
                      ) : null}
                      {lbl.openSlotsCount ? (
                        <span className="text-[9px] font-mono px-1 rounded bg-slate-900/80 border border-slate-700/60 text-slate-300 shadow-sm">
                          🪐 {lbl.openSlotsCount}
                        </span>
                      ) : null}
                    </>
                  )}
                  {lbl.hasPoi && (
                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-amber-950/80 border border-amber-600/70 text-amber-300 animate-pulse shadow-sm">
                      ★ KEŞİF
                    </span>
                  )}
                  {lbl.hasDebris && (
                    <span className="text-[9px] font-mono font-bold px-1 rounded bg-rose-950/80 border border-rose-600/70 text-rose-300 shadow-sm">
                      ⚙️ ENKAZ
                    </span>
                  )}
                </div>
              </div>
            ) : lbl.type === 'jump_gate' ? (
              <div className="px-2 py-0.5 rounded-full bg-space-950/90 border border-cyber-cyan/60 text-[10px] font-mono font-bold text-cyber-cyan shadow-lg shadow-cyan-950/50 backdrop-blur-md hover:bg-cyber-cyan hover:text-space-950 transition-all flex items-center gap-1">
                <span>➔ {lbl.title}</span>
              </div>
            ) : lbl.type === 'star' ? (
              <div className="flex flex-col items-center">
                <div className="px-2.5 py-0.5 rounded-md bg-space-950/90 border border-amber-500/60 text-xs font-mono font-bold text-amber-300 shadow-xl backdrop-blur-md">
                  {lbl.title}
                </div>
                {lbl.subtitle && (
                  <span className="text-[8.5px] font-mono text-amber-400/80 mt-0.5 tracking-wider">
                    {lbl.subtitle}
                  </span>
                )}
              </div>
            ) : lbl.type === 'fleet' ? (
              <div
                className="px-2 py-0.5 rounded bg-space-950/90 border shadow-md backdrop-blur-md flex items-center gap-1.5 transition-all hover:scale-105"
                style={{
                  borderColor: `${lbl.color}80`,
                  boxShadow: `0 0 8px ${lbl.color}30`,
                }}
              >
                <span className="text-[10px]">🛸</span>
                <span className="text-[9.5px] font-mono font-bold text-white">{lbl.title}</span>
                {lbl.subtitle && (
                  <span
                    className="text-[8.5px] font-mono font-bold px-1 rounded"
                    style={{ backgroundColor: `${lbl.color}25`, color: lbl.color }}
                  >
                    {lbl.subtitle}
                  </span>
                )}
              </div>
            ) : (
              <div className="px-1.5 py-0.5 rounded bg-space-950/80 border border-slate-700/60 text-[10px] font-mono text-slate-200 shadow-md backdrop-blur-sm hover:border-cyber-cyan transition-colors flex items-center gap-1">
                <span>{lbl.title}</span>
                {lbl.subtitle && (
                  <span className="text-[8.5px] text-cyber-cyan/90 uppercase">{lbl.subtitle}</span>
                )}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
