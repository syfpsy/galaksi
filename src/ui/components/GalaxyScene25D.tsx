import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { calculatePlanetOrbit } from '../../engine/orbital';
import { getFleetCurrentPosition } from '../../engine/flight';
import { Fleet, GameState, StarSystem } from '../../engine/types';
import { SelectedTarget } from '../types';
import {
  getCloudTexture,
  getDesertTexture,
  getIceTexture,
  getOceanTexture,
  getSunTexture,
  getTerranTexture,
  getVolcanicTexture,
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
  onSelectSystem: (systemId: string) => void;
  onSelectPlanet?: (systemId: string, planetId: string) => void;
  onSelectFleet: (fleetId: string) => void;
}

export const GalaxyScene25D: React.FC<GalaxyScene25DProps> = ({
  state,
  activePlayerId,
  selectedTarget,
  godMode,
  focusedSystemId,
  viewMode,
  showProjections,
  onSelectSystem,
  onSelectPlanet,
  onSelectFleet,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  // References for render loop state
  const stateRef = useRef(state);
  stateRef.current = state;

  const viewModeRef = useRef(viewMode);
  viewModeRef.current = viewMode;

  const focusedSystemIdRef = useRef(focusedSystemId);
  focusedSystemIdRef.current = focusedSystemId;

  const showProjectionsRef = useRef(showProjections);
  showProjectionsRef.current = showProjections;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    let width = container.clientWidth || window.innerWidth;
    let height = container.clientHeight || window.innerHeight;

    // 1. Scene & Camera Setup (2.5D Isometric Inclined Perspective)
    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x030712);

    const camera = new THREE.PerspectiveCamera(45, width / height, 1, 4000);
    // 2.5D Tilted View: camera positioned at an isometric slant
    const targetCameraPos = new THREE.Vector3(500, 100, 750);
    const targetLookAt = new THREE.Vector3(500, 400, 0);

    camera.position.set(500, 100, 750);
    camera.lookAt(targetLookAt);

    // 2. WebGL Renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true, powerPreference: 'high-performance' });
    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    container.appendChild(renderer.domElement);

    // 3. Lighting (Atmospheric Space Ambience)
    const ambientLight = new THREE.AmbientLight(0x38bdf8, 0.45);
    scene.add(ambientLight);

    // 4. Distant 3D Starfield Particles
    const starCount = 1200;
    const starGeo = new THREE.BufferGeometry();
    const starPositions = new Float32Array(starCount * 3);
    const starColors = new Float32Array(starCount * 3);

    for (let i = 0; i < starCount; i++) {
      starPositions[i * 3] = (Math.random() - 0.5) * 2200 + 500;
      starPositions[i * 3 + 1] = (Math.random() - 0.5) * 1800 + 400;
      starPositions[i * 3 + 2] = -50 - Math.random() * 400;

      const shade = 0.6 + Math.random() * 0.4;
      starColors[i * 3] = shade * (0.8 + Math.random() * 0.2);
      starColors[i * 3 + 1] = shade * 0.9;
      starColors[i * 3 + 2] = shade;
    }

    starGeo.setAttribute('position', new THREE.BufferAttribute(starPositions, 3));
    starGeo.setAttribute('color', new THREE.BufferAttribute(starColors, 3));

    const starMat = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
    });
    const starField = new THREE.Points(starGeo, starMat);
    scene.add(starField);

    // 5. Star Mesh Objects & Point Lights
    const starMeshes = new Map<string, { group: THREE.Group; mesh: THREE.Mesh; light: THREE.PointLight }>();
    const systemPositions = new Map<string, THREE.Vector3>();

    Object.values(stateRef.current.map.systems).forEach((sys, idx) => {
      const pos = new THREE.Vector3(sys.x, sys.y, 0);
      systemPositions.set(sys.id, pos);

      const group = new THREE.Group();
      group.position.copy(pos);

      // Star Color & Texture
      const isRelay = sys.hasRelay;
      const starColor = isRelay ? 0xa855f7 : idx % 3 === 0 ? 0xf59e0b : idx % 3 === 1 ? 0x06b6d4 : 0xef4444;
      const starRadius = isRelay ? 18 : 13;

      const starGeometry = new THREE.SphereGeometry(starRadius, 24, 24);
      const starMaterial = new THREE.MeshBasicMaterial({
        color: starColor,
        map: getSunTexture(isRelay ? '#c084fc' : idx % 3 === 0 ? '#f59e0b' : '#06b6d4'),
      });
      const starMesh = new THREE.Mesh(starGeometry, starMaterial);
      (starMesh as any).userData = { type: 'system', systemId: sys.id };
      group.add(starMesh);

      // Dedicated Point Light illuminating surrounding planets
      const pointLight = new THREE.PointLight(starColor, isRelay ? 2.5 : 1.8, 650);
      pointLight.position.set(0, 0, 10);
      group.add(pointLight);

      // Pulsing Corona Halo Sprite
      const spriteMat = new THREE.SpriteMaterial({
        color: starColor,
        transparent: true,
        opacity: 0.45,
        blending: THREE.AdditiveBlending,
      });
      const sprite = new THREE.Sprite(spriteMat);
      sprite.scale.set(starRadius * 4.5, starRadius * 4.5, 1);
      group.add(sprite);

      scene.add(group);
      starMeshes.set(sys.id, { group, mesh: starMesh, light: pointLight });
    });

    // 6. Hyperlanes in 3D
    const laneLines = new THREE.Group();
    stateRef.current.map.lanes.forEach((lane) => {
      const from = systemPositions.get(lane.fromSystemId);
      const to = systemPositions.get(lane.toSystemId);
      if (!from || !to) return;

      const points = [from.clone(), to.clone()];
      const laneGeo = new THREE.BufferGeometry().setFromPoints(points);
      const laneMat = new THREE.LineBasicMaterial({
        color: 0x1e293b,
        linewidth: 1.5,
        transparent: true,
        opacity: 0.65,
      });
      const line = new THREE.Line(laneGeo, laneMat);
      laneLines.add(line);
    });
    scene.add(laneLines);

    // 7. Dynamic Planetary System Group (Orrery 3D Meshes)
    const orreryGroup = new THREE.Group();
    scene.add(orreryGroup);

    // 8. Mouse Controls (Pan & Zoom)
    let isDragging = false;
    let previousMousePosition = { x: 0, y: 0 };
    const raycaster = new THREE.Raycaster();
    const mouse = new THREE.Vector2();

    const onMouseDown = (e: MouseEvent) => {
      isDragging = true;
      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      if (!isDragging) return;

      const deltaX = e.clientX - previousMousePosition.x;
      const deltaY = e.clientY - previousMousePosition.y;

      // Pan camera target
      targetLookAt.x -= deltaX * (targetCameraPos.z / 1000);
      targetLookAt.y += deltaY * (targetCameraPos.z / 1000);

      previousMousePosition = { x: e.clientX, y: e.clientY };
    };

    const onMouseUp = () => {
      isDragging = false;
    };

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomDelta = e.deltaY * 0.8;
      targetCameraPos.z = Math.max(120, Math.min(1100, targetCameraPos.z + zoomDelta));
    };

    const onClick = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      mouse.x = ((e.clientX - rect.left) / width) * 2 - 1;
      mouse.y = -((e.clientY - rect.top) / height) * 2 + 1;

      raycaster.setFromCamera(mouse, camera);
      const intersects = raycaster.intersectObjects(scene.children, true);

      for (const hit of intersects) {
        const udata = (hit.object as any).userData;
        if (udata) {
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

    container.addEventListener('mousedown', onMouseDown);
    window.addEventListener('mousemove', onMouseMove);
    window.addEventListener('mouseup', onMouseUp);
    container.addEventListener('wheel', onWheel, { passive: false });
    container.addEventListener('click', onClick);

    // 9. Resize Observer
    const onResize = () => {
      if (!container) return;
      width = container.clientWidth;
      height = container.clientHeight;
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };
    window.addEventListener('resize', onResize);

    // 10. Main Animation & Render Loop
    let animationFrameId: number;
    let clock = new THREE.Clock();

    const animate = () => {
      animationFrameId = requestAnimationFrame(animate);
      const delta = clock.getDelta();
      const currentTimeMs = stateRef.current.timeMs;

      // Camera smooth damping towards target
      if (viewModeRef.current === 'system') {
        const focusedSys = stateRef.current.map.systems[focusedSystemIdRef.current];
        if (focusedSys) {
          targetLookAt.lerp(new THREE.Vector3(focusedSys.x, focusedSys.y, 0), 0.08);
          targetCameraPos.set(targetLookAt.x, targetLookAt.y - 180, Math.min(targetCameraPos.z, 340));
        }
      } else {
        targetCameraPos.y = targetLookAt.y - 300;
      }

      camera.position.lerp(targetCameraPos, 0.08);
      camera.lookAt(targetLookAt);

      // Rotate starfield gently
      starField.rotation.z += 0.0001;

      // Update 2.5D In-System Planets & Orbits
      // Clear previous orrery frame
      while (orreryGroup.children.length > 0) {
        const obj = orreryGroup.children[0];
        orreryGroup.remove(obj);
      }

      // If in System View (or close zoom), render real-time Keplerian 3D planets
      const activeSysId = focusedSystemIdRef.current;
      const currentSystem = stateRef.current.map.systems[activeSysId];

      if (currentSystem && (viewModeRef.current === 'system' || camera.position.z < 450)) {
        currentSystem.slots.forEach((slot) => {
          const orbit = calculatePlanetOrbit(
            currentSystem.id,
            slot.slotIndex,
            slot.planetId,
            currentTimeMs
          );

          // 1. 3D Orbit Track Loop
          const orbitPoints: THREE.Vector3[] = [];
          const segments = 64;
          for (let s = 0; s <= segments; s++) {
            const theta = (s / segments) * Math.PI * 2;
            const ox = currentSystem.x + Math.cos(theta) * orbit.orbitalRadius;
            const oy = currentSystem.y + Math.sin(theta) * orbit.orbitalRadius * 0.85;
            orbitPoints.push(new THREE.Vector3(ox, oy, 0));
          }

          const orbitGeo = new THREE.BufferGeometry().setFromPoints(orbitPoints);
          const orbitMat = new THREE.LineBasicMaterial({
            color: 0x38bdf8,
            transparent: true,
            opacity: 0.35,
          });
          const orbitLine = new THREE.Line(orbitGeo, orbitMat);
          orreryGroup.add(orbitLine);

          // 2. 3D Planet Sphere Mesh
          const planetRadius = 7 + (slot.size % 4);
          const planetGeo = new THREE.SphereGeometry(planetRadius, 24, 24);

          let planetTexture = getTerranTexture();
          if (slot.type === 'ocean') planetTexture = getOceanTexture();
          else if (slot.type === 'desert') planetTexture = getDesertTexture();
          else if (slot.type === 'ice') planetTexture = getIceTexture();
          else if (slot.type === 'volcanic') planetTexture = getVolcanicTexture();

          const planetMat = new THREE.MeshStandardMaterial({
            map: planetTexture,
            roughness: 0.6,
            metalness: 0.1,
          });

          const planetMesh = new THREE.Mesh(planetGeo, planetMat);
          const px = currentSystem.x + orbit.x;
          const py = currentSystem.y + orbit.y;
          planetMesh.position.set(px, py, 5);
          planetMesh.rotation.y += currentTimeMs * 0.0005; // Axial rotation

          (planetMesh as any).userData = {
            type: 'planet',
            systemId: currentSystem.id,
            planetId: slot.planetId,
          };
          orreryGroup.add(planetMesh);

          // 3. Tilted 3D Ring for Desert Worlds
          if (slot.type === 'desert') {
            const ringGeo = new THREE.RingGeometry(planetRadius * 1.4, planetRadius * 2.1, 32);
            const ringMat = new THREE.MeshBasicMaterial({
              color: 0xf59e0b,
              side: THREE.DoubleSide,
              transparent: true,
              opacity: 0.6,
            });
            const ringMesh = new THREE.Mesh(ringGeo, ringMat);
            ringMesh.position.set(px, py, 5);
            ringMesh.rotation.x = Math.PI / 3;
            orreryGroup.add(ringMesh);
          }

          // 4. Terran Cloud Layer Sphere
          if (slot.type === 'terran') {
            const cloudGeo = new THREE.SphereGeometry(planetRadius * 1.04, 20, 20);
            const cloudMat = new THREE.MeshStandardMaterial({
              map: getCloudTexture(),
              transparent: true,
              opacity: 0.5,
            });
            const cloudMesh = new THREE.Mesh(cloudGeo, cloudMat);
            cloudMesh.position.set(px, py, 5);
            cloudMesh.rotation.y += currentTimeMs * 0.0008;
            orreryGroup.add(cloudMesh);
          }

          // 5. Future Forecast Projection Arc ("bunun projeksiyonunu görebiliyoruz")
          if (showProjectionsRef.current) {
            orbit.projections.forEach((p) => {
              const fpx = currentSystem.x + p.x;
              const fpy = currentSystem.y + p.y;

              const ghostGeo = new THREE.SphereGeometry(planetRadius * 0.6, 12, 12);
              const ghostMat = new THREE.MeshBasicMaterial({
                color: 0x00f3ff,
                wireframe: true,
                transparent: true,
                opacity: 0.35,
              });
              const ghostMesh = new THREE.Mesh(ghostGeo, ghostMat);
              ghostMesh.position.set(fpx, fpy, 5);
              orreryGroup.add(ghostMesh);
            });
          }
        });
      }

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', onResize);
      container.removeEventListener('mousedown', onMouseDown);
      window.removeEventListener('mousemove', onMouseMove);
      window.removeEventListener('mouseup', onMouseUp);
      container.removeEventListener('wheel', onWheel);
      container.removeEventListener('click', onClick);

      if (container && renderer.domElement) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      starGeo.dispose();
      starMat.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      className="relative w-full h-full overflow-hidden cursor-grab active:cursor-grabbing select-none"
    />
  );
};
