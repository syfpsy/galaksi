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
} from './proceduralTextures';
import { sound } from '../sound';

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
}

interface ScreenLabel {
  id: string;
  type: 'system' | 'planet' | 'jump_gate' | 'star';
  title: string;
  subtitle?: string;
  color: string;
  systemId: string;
  planetId?: string;
  targetSystemId?: string;
  x: number;
  y: number;
  visible: boolean;
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
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hudLabels, setHudLabels] = useState<ScreenLabel[]>([]);

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

  // Sync camera when viewMode changes externally
  useEffect(() => {
    if (viewMode === 'system') {
      targetCameraPosRef.current.set(500, 240, 260);
      targetLookAtRef.current.set(500, 400, 0);
    } else {
      targetCameraPosRef.current.set(500, 120, 750);
      targetLookAtRef.current.set(500, 400, 0);
    }
  }, [viewMode]);

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
      group.add(coronaSprite);

      // Tactical System Boundary Ring
      const ringPts: THREE.Vector3[] = [];
      const ringSegments = 64;
      const territoryRadius = starRadius * 3.2;
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
        opacity: 0.22,
        depthWrite: false,
      });
      const territoryLine = new THREE.Line(territoryGeo, territoryMat);
      group.add(territoryLine);

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
      hyperlaneGroup.add(line);

      if (lIdx % 2 === 0) {
        const pulseSprite = new THREE.Sprite(pulseSpriteMat);
        pulseSprite.position.copy(from);
        pulseSprite.scale.set(4, 4, 1);
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
      group.add(glowSprite);

      macroFleetsGroup.add(group);

      const fv: FleetVisual = { group, hullMesh, thrusterMesh, glowSprite, fleetId: fleet.id };
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
        systemOrreryGroup.add(orbitLine);
        orbitLines.push(orbitLine);

        // 2. Planet Sphere Mesh
        const planetRadius = 8 + (slot.size % 4);
        const planetGeo = new THREE.SphereGeometry(planetRadius, 28, 28);

        let planetTexture = getTerranTexture();
        let atmoColor = '#38bdf8';
        if (slot.type === 'ocean') {
          planetTexture = getOceanTexture();
          atmoColor = '#0284c7';
        } else if (slot.type === 'desert') {
          planetTexture = getDesertTexture();
          atmoColor = '#d97706';
        } else if (slot.type === 'ice') {
          planetTexture = getIceTexture();
          atmoColor = '#bae6fd';
        } else if (slot.type === 'volcanic') {
          planetTexture = getVolcanicTexture();
          atmoColor = '#ef4444';
        }

        const planetMat = new THREE.MeshStandardMaterial({
          map: planetTexture,
          roughness: 0.55,
          metalness: 0.15,
        });
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
          systemOrreryGroup.add(moonMesh);
        }

        // 7. Orbital Defense Station / Starbase
        let stationMesh: THREE.Mesh | undefined;
        const planetObj = stateRef.current.planets[slot.planetId];
        if (planetObj && planetObj.ownerId) {
          const stationGeo = new THREE.OctahedronGeometry(planetRadius * 0.35);
          const stationMat = new THREE.MeshStandardMaterial({
            color: 0x00f3ff,
            metalness: 0.9,
            roughness: 0.2,
          });
          stationMesh = new THREE.Mesh(stationGeo, stationMat);
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

      currentOrrery = {
        systemId: system.id,
        orbitLines,
        planetMeshes,
        warpBuoys,
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
    scene.add(reticleMesh);

    // =========================================================================
    // 5. Interactive Mouse Controls
    // =========================================================================
    let isDragging = false;
    let hasDragged = false;
    let dragStartPos = { x: 0, y: 0 };
    let previousMousePosition = { x: 0, y: 0 };
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

      if (!isDragging) return;

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
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = targetCameraPos.z < 250 ? 0.45 : 0.85;
      const zoomDelta = e.deltaY * zoomFactor;

      // In System View, if zooming out past threshold, seamlessly offer return to Galaxy Map
      if (viewModeRef.current === 'system' && targetCameraPos.z > 380 && zoomDelta > 0 && onExitSystemView) {
        onExitSystemView();
        return;
      }

      const minZ = viewModeRef.current === 'system' ? 45 : 450;
      const maxZ = viewModeRef.current === 'system' ? 420 : 1350;

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
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        const udata = (hit.object as any).userData;
        if (udata) {
          if (udata.type === 'jump_gate') {
            sound.playWarp();
            if (onEnterSystemView) onEnterSystemView(udata.targetSystemId);
            else onSelectSystem(udata.targetSystemId);
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
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        const udata = (hit.object as any).userData;
        if (udata) {
          if (udata.type === 'jump_gate') {
            sound.playWarp();
            if (onEnterSystemView) onEnterSystemView(udata.targetSystemId);
            else onSelectSystem(udata.targetSystemId);
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

      // If in system mode and double clicked on empty space (no hit), zoom back out to galaxy view
      if (viewModeRef.current === 'system' && onExitSystemView) {
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
        targetLookAt.set(500, 400, 0);
        targetCameraPos.x = targetLookAt.x;
        targetCameraPos.y = targetLookAt.y - Math.min(220, targetCameraPos.z * 0.55);
      } else {
        targetLookAt.set(500, 400, 0);
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
            }
            const pulseScale = 1.0 + Math.sin(currentTimeMs * 0.015) * 0.25;
            visual.thrusterMesh.scale.set(pulseScale, pulseScale, pulseScale);
            visual.glowSprite.scale.set(8 * pulseScale, 8 * pulseScale, 1);
          } else {
            visual.group.rotation.z += delta * 0.5;
            visual.thrusterMesh.scale.set(0.6, 0.6, 0.6);
          }
        });

        fleetVisuals.forEach((visual, fleetId) => {
          if (!activeFleetIds.has(fleetId)) {
            macroFleetsGroup.remove(visual.group);
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
              } else if (lbl.type === 'system') {
                onSelectSystem(lbl.systemId);
              } else if (lbl.type === 'planet' && onSelectPlanet && lbl.planetId) {
                onSelectPlanet(lbl.systemId, lbl.planetId);
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              sound.playWarp();
              if (lbl.type === 'jump_gate' && lbl.targetSystemId) {
                if (onEnterSystemView) onEnterSystemView(lbl.targetSystemId);
                else onSelectSystem(lbl.targetSystemId);
              } else if (lbl.type === 'system') {
                if (onEnterSystemView) onEnterSystemView(lbl.systemId);
                else onSelectSystem(lbl.systemId);
              }
            }}
          >
            {lbl.type === 'system' ? (
              <div className="flex flex-col items-center">
                <div className="px-2 py-0.5 rounded-md bg-space-950/85 border border-slate-700/80 shadow-lg text-[11px] font-mono font-bold text-white flex items-center gap-1.5 backdrop-blur-md hover:border-cyber-cyan transition-colors">
                  <span
                    className="w-2 h-2 rounded-full inline-block shadow-sm"
                    style={{ backgroundColor: lbl.color }}
                  />
                  <span>{lbl.title}</span>
                </div>
                {lbl.subtitle && (
                  <span
                    className={`text-[9px] font-mono font-semibold tracking-wider mt-0.5 px-1 rounded shadow-sm ${
                      lbl.subtitle === 'ANA DÜNYA'
                        ? 'text-emerald-400 bg-emerald-950/70 border border-emerald-800/60'
                        : lbl.subtitle === 'NEXUS RÖLESİ'
                        ? 'text-purple-300 bg-purple-950/70 border border-purple-800/60'
                        : 'text-slate-400 bg-space-900/60'
                    }`}
                  >
                    {lbl.subtitle}
                  </span>
                )}
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
