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
  onSelectPlanet?: (systemId: string, planetId: string) => void;
  onSelectFleet: (fleetId: string) => void;
}

interface ScreenLabel {
  id: string;
  type: 'system' | 'planet';
  title: string;
  subtitle?: string;
  color: string;
  systemId: string;
  planetId?: string;
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
  onSelectPlanet,
  onSelectFleet,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const [hudLabels, setHudLabels] = useState<ScreenLabel[]>([]);

  // Live references for requestAnimationFrame render loop
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

  const zoomRef = useRef(zoom);
  zoomRef.current = zoom;

  // Track external zoom prop changes from HUD buttons (+ / - / 100%)
  const targetCameraPosRef = useRef<THREE.Vector3>(new THREE.Vector3(500, 120, 750));
  const targetLookAtRef = useRef<THREE.Vector3>(new THREE.Vector3(500, 400, 0));

  useEffect(() => {
    // When external HUD zoom prop changes, sync camera distance
    const desiredZ = Math.max(45, Math.min(1350, 750 / (zoom || 1)));
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

    // =========================================================================
    // 2. Macro Galaxy Layer: Spiral Arms & Cosmic Dust Cloud
    // =========================================================================
    const spiralGroup = new THREE.Group();
    spiralGroup.position.set(500, 400, -25);
    scene.add(spiralGroup);

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

    // Sector Boundary Rings
    const boundaryGroup = new THREE.Group();
    scene.add(boundaryGroup);

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

    // =========================================================================
    // 3. Background Deep Starfield
    // =========================================================================
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
    // 4. Star Systems, Incandescent Suns & Circular Corona Flares
    // =========================================================================
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

      // 4.1 Star Core Sphere: Incandescent glowing solar plasma across 360 degrees (No black sides!)
      const starSphereGeo = new THREE.SphereGeometry(starRadius, 32, 32);
      const starSphereMat = new THREE.MeshBasicMaterial({
        map: getSunTexture(starColorHex),
      });
      const starMesh = new THREE.Mesh(starSphereGeo, starSphereMat);
      (starMesh as any).userData = { type: 'system', systemId: sys.id };
      group.add(starMesh);

      // 4.2 Dedicated Physical Point Light illuminating planets & ships
      const pointLight = new THREE.PointLight(starColor, isRelay ? 3.0 : 2.2, 850);
      pointLight.position.set(0, 0, 12);
      group.add(pointLight);

      // 4.3 Corona Halo Flare Sprite: Guaranteed smooth radial glow with ZERO square clipping!
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

      // 4.4 Clean Tactical System Boundary Line
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

      scene.add(group);
      starMeshes.set(sys.id, { group, mesh: starMesh, light: pointLight, corona: coronaSprite });
    });

    // =========================================================================
    // 5. Sleek Subspace Hyperlanes (Clean lines, zero clutter)
    // =========================================================================
    const hyperlaneGroup = new THREE.Group();
    scene.add(hyperlaneGroup);

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

    // =========================================================================
    // 6. Fleets Layer (3D Ships with Plasma Thruster Cones & Engine Glow)
    // =========================================================================
    const fleetGroup = new THREE.Group();
    scene.add(fleetGroup);

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

      fleetGroup.add(group);

      const fv: FleetVisual = { group, hullMesh, thrusterMesh, glowSprite, fleetId: fleet.id };
      fleetVisuals.set(fleet.id, fv);
      return fv;
    };

    // =========================================================================
    // 7. Dynamic Planetary Orrery (High-Detail 3D Planets, Moons & Warp Gates)
    // =========================================================================
    const orreryGroup = new THREE.Group();
    scene.add(orreryGroup);

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
        ghostMeshes: THREE.Mesh[];
      }[];
      warpBuoys: THREE.Sprite[];
    }
    let currentOrrery: PlanetVisualObjects | null = null;

    const buildOrreryForSystem = (system: StarSystem) => {
      while (orreryGroup.children.length > 0) {
        const obj = orreryGroup.children[0];
        orreryGroup.remove(obj);
      }

      const orbitLines: THREE.Line[] = [];
      const planetMeshes: PlanetVisualObjects['planetMeshes'] = [];
      const warpBuoys: THREE.Sprite[] = [];

      // Jump Gate Warp Buoys positioned at the outer perimeter of this system
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

        const dir = new THREE.Vector3(otherSys.x - system.x, otherSys.y - system.y, 0).normalize();
        const buoyDist = 220;

        const buoy = new THREE.Sprite(warpSpriteMat);
        buoy.position.set(system.x + dir.x * buoyDist, system.y + dir.y * buoyDist * 0.85, 4);
        buoy.scale.set(16, 16, 1);
        orreryGroup.add(buoy);
        warpBuoys.push(buoy);
      });

      // Planets & Orbits
      system.slots.forEach((slot) => {
        const orbit = calculatePlanetOrbit(system.id, slot.slotIndex, slot.planetId, stateRef.current.timeMs);

        const orbitPoints: THREE.Vector3[] = [];
        const segments = 64;
        for (let s = 0; s <= segments; s++) {
          const theta = (s / segments) * Math.PI * 2;
          const ox = system.x + Math.cos(theta) * orbit.orbitalRadius;
          const oy = system.y + Math.sin(theta) * orbit.orbitalRadius * 0.85;
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
        orreryGroup.add(orbitLine);
        orbitLines.push(orbitLine);

        const planetRadius = 7 + (slot.size % 4);
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
        orreryGroup.add(planetMesh);

        const atmoMat = new THREE.SpriteMaterial({
          map: getAtmosphereTexture(atmoColor),
          transparent: true,
          opacity: 0.55,
          blending: THREE.AdditiveBlending,
          depthWrite: false,
        });
        const atmoSprite = new THREE.Sprite(atmoMat);
        atmoSprite.scale.set(planetRadius * 2.8, planetRadius * 2.8, 1);
        orreryGroup.add(atmoSprite);

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
          orreryGroup.add(cloudMesh);
        }

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
          orreryGroup.add(ringMesh);
        }

        let moonMesh: THREE.Mesh | undefined;
        if (slot.slotIndex === 1 || slot.type === 'terran') {
          const moonGeo = new THREE.SphereGeometry(planetRadius * 0.28, 16, 16);
          const moonMat = new THREE.MeshStandardMaterial({
            color: 0x94a3b8,
            roughness: 0.8,
          });
          moonMesh = new THREE.Mesh(moonGeo, moonMat);
          orreryGroup.add(moonMesh);
        }

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
          orreryGroup.add(stationMesh);
        }

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
          orreryGroup.add(gm);
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
    // 8. 3D Selection Reticle (High-Tech Rotating Cyan Targeting Bracket)
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
    // 9. Interactive Mouse Controls (Pan, Deep Zoom & Click-Drag Guard)
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

      // Consistent, unskewed isometric pan
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

      targetCameraPos.z = Math.max(45, Math.min(1350, targetCameraPos.z + zoomDelta));

      if (onZoomChange) {
        const computedZoom = +(750 / targetCameraPos.z).toFixed(2);
        onZoomChange(computedZoom);
      }
    };

    const onClick = (e: MouseEvent) => {
      // Guard: Ignore click event if the user was dragging/panning the map!
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
          if (udata.type === 'system') {
            sound.playWarp();
            if (onEnterSystemView) {
              onEnterSystemView(udata.systemId);
            } else {
              onSelectSystem(udata.systemId);
            }
            const sys = stateRef.current.map.systems[udata.systemId];
            if (sys) {
              targetLookAt.set(sys.x, sys.y, 0);
              targetCameraPos.set(sys.x, sys.y - 120, 220);
            }
            return;
          }
          if (udata.type === 'planet') {
            sound.playWarp();
            if (onSelectPlanet) {
              onSelectPlanet(udata.systemId, udata.planetId);
            }
            targetLookAt.set(hit.point.x, hit.point.y, hit.point.z);
            targetCameraPos.set(hit.point.x, hit.point.y - 45, 65);
            return;
          }
        }
      }
    };

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);
    container.addEventListener('dblclick', onDoubleClick);

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
    // 10. Main Animation & 60 FPS Render Loop
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

      // 10.1 Camera Positioning & Smooth Tracking (Parallel to isometric plane, no horizontal skew)
      if (viewModeRef.current === 'system') {
        const focusedSys = stateRef.current.map.systems[focusedSystemIdRef.current];
        if (focusedSys) {
          targetLookAt.lerp(new THREE.Vector3(focusedSys.x, focusedSys.y, 0), 0.08);
        }
        targetCameraPos.x = targetLookAt.x;
        targetCameraPos.y = targetLookAt.y - Math.min(200, targetCameraPos.z * 0.55);
      } else {
        targetCameraPos.x = targetLookAt.x;
        targetCameraPos.y = targetLookAt.y - Math.min(260, targetCameraPos.z * 0.5);
      }

      camera.position.lerp(targetCameraPos, 0.08);
      camera.lookAt(targetLookAt);

      // 10.2 Cosmic Rotation: Galactic Spiral Arms & Distant Starfield
      spiralGroup.rotation.z += 0.00018;
      starField.rotation.z += 0.00008;

      // 10.3 Fog of War Dimming on Unmonitored Star Systems
      const currentCoverage = sensorCoverageRef.current;
      const isGodMode = godModeRef.current;

      starMeshes.forEach(({ group, light, corona }, sysId) => {
        const isVisible = isGodMode || currentCoverage.has(sysId);
        light.intensity = isVisible ? 2.5 : 0.6;
        corona.material.opacity = isVisible ? 0.88 : 0.3;
      });

      // 10.4 Flowing Subspace Energy Pulses along Hyperlanes
      lanePulses.forEach((pulse) => {
        pulse.progress += delta * pulse.speed;
        if (pulse.progress > 1) pulse.progress = 0;

        pulse.sprite.position.lerpVectors(pulse.from, pulse.to, pulse.progress);
        pulse.sprite.position.z = 2;
      });

      // 10.5 Dynamic 3D Fleets along Hyperlanes & Planetary Orbits
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
          fleetGroup.remove(visual.group);
          fleetVisuals.delete(fleetId);
        }
      });

      // 10.6 Planetary Orrery Update (Zero GC Allocation per frame)
      const activeSysId = focusedSystemIdRef.current;
      const currentSystem = stateRef.current.map.systems[activeSysId];

      if (currentSystem && (viewModeRef.current === 'system' || camera.position.z < 480)) {
        if (!currentOrrery || currentOrrery.systemId !== currentSystem.id) {
          buildOrreryForSystem(currentSystem);
        }

        if (currentOrrery) {
          orreryGroup.visible = true;

          currentOrrery.planetMeshes.forEach((pVis) => {
            const orbit = calculatePlanetOrbit(
              currentSystem.id,
              pVis.slotIndex,
              pVis.planetId,
              currentTimeMs
            );

            const px = currentSystem.x + orbit.x;
            const py = currentSystem.y + orbit.y;
            const pz = 5;

            pVis.planetMesh.position.set(px, py, pz);
            pVis.planetMesh.rotation.y += delta * 0.4;

            if (pVis.atmoSprite) {
              pVis.atmoSprite.position.set(px, py, pz);
            }

            if (pVis.cloudMesh) {
              pVis.cloudMesh.position.set(px, py, pz);
              pVis.cloudMesh.rotation.y += delta * 0.55;
            }

            if (pVis.ringMesh) {
              pVis.ringMesh.position.set(px, py, pz);
            }

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

            pVis.ghostMeshes.forEach((gm, gIdx) => {
              if (showProjectionsRef.current && orbit.projections[gIdx]) {
                gm.visible = true;
                const proj = orbit.projections[gIdx];
                gm.position.set(currentSystem.x + proj.x, currentSystem.y + proj.y, pz);
              } else {
                gm.visible = false;
              }
            });
          });
        }
      } else {
        if (orreryGroup) {
          orreryGroup.visible = false;
        }
      }

      // 10.7 Selection Reticle Update
      const curSelected = selectedTargetRef.current;
      if (curSelected) {
        if (curSelected.type === 'system') {
          const sys = stateRef.current.map.systems[curSelected.systemId];
          if (sys) {
            reticleMesh.visible = true;
            reticleMesh.position.set(sys.x, sys.y, 8);
            reticleMesh.scale.set(1.4, 1.4, 1);
            reticleMesh.rotation.z += delta * 1.8;
          }
        } else if (curSelected.type === 'planet') {
          if (currentOrrery) {
            const pVis = currentOrrery.planetMeshes.find((p) => p.planetId === curSelected.planetId);
            if (pVis) {
              reticleMesh.visible = true;
              reticleMesh.position.copy(pVis.planetMesh.position);
              reticleMesh.position.z = 10;
              reticleMesh.scale.set(0.9, 0.9, 1);
              reticleMesh.rotation.z += delta * 2.2;
            }
          }
        } else if (curSelected.type === 'fleet') {
          const fv = fleetVisuals.get(curSelected.fleetId || '');
          if (fv) {
            reticleMesh.visible = true;
            reticleMesh.position.copy(fv.group.position);
            reticleMesh.position.z = 12;
            reticleMesh.scale.set(0.7, 0.7, 1);
            reticleMesh.rotation.z += delta * 2.5;
          }
        }
      } else {
        reticleMesh.visible = false;
      }

      // 10.8 Project 3D Positions to 2D Screen for HTML Billboard Labels (Calculated every 2 frames)
      if (frameCounter % 2 === 0) {
        const labels: ScreenLabel[] = [];

        // Project Star System Labels
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

        // Project Planet Labels (When in System View or Close Zoom)
        if (currentOrrery && (viewModeRef.current === 'system' || camera.position.z < 450)) {
          currentOrrery.planetMeshes.forEach((pVis) => {
            tempProjVec.copy(pVis.planetMesh.position);
            tempProjVec.y -= 14;
            tempProjVec.project(camera);

            const screenX = ((tempProjVec.x + 1) * width) / 2;
            const screenY = ((-tempProjVec.y + 1) * height) / 2;
            const isVisible = tempProjVec.z < 1 && tempProjVec.z > -1;

            if (isVisible) {
              const slot = currentSystem.slots.find((s) => s.planetId === pVis.planetId);
              labels.push({
                id: pVis.planetId,
                type: 'planet',
                title: slot ? slot.name : 'Gezegen',
                subtitle: slot ? slot.type.toUpperCase() : undefined,
                color: '#38bdf8',
                systemId: currentSystem.id,
                planetId: pVis.planetId,
                x: screenX,
                y: screenY,
                visible: true,
              });
            }
          });
        }

        setHudLabels(labels);
      }

      renderer.render(scene, camera);
    };

    animate();

    // =========================================================================
    // 11. Clean Cleanup on Unmount
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
              if (lbl.type === 'system') {
                onSelectSystem(lbl.systemId);
              } else if (lbl.type === 'planet' && onSelectPlanet && lbl.planetId) {
                onSelectPlanet(lbl.systemId, lbl.planetId);
              }
            }}
            onDoubleClick={(e) => {
              e.stopPropagation();
              sound.playWarp();
              if (lbl.type === 'system') {
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
