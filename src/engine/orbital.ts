/**
 * CANLI GALAKSİ - Astronomical Planetary Orbital Mechanics
 * Calculates real-time Keplerian orbital motions, angular positions,
 * and future trajectory projections for star system planets.
 */

export interface ProjectedPosition {
  hoursAhead: number;
  x: number;
  y: number;
  angleDeg: number;
}

export interface PlanetOrbitState {
  planetId: string;
  slotIndex: number;
  orbitalRadius: number; // in screen units
  auDistance: number;    // in AU (Astronomical Units)
  orbitalPeriodMs: number; // Real-world calibrated period (12h to 72h)
  speedDegPerHour: number;
  initialAngle: number;  // radians
  currentAngle: number;  // radians (0 to 2*PI)
  currentAngleDeg: number; // 0 to 360
  x: number;             // Offset from star center
  y: number;             // Offset from star center (with 0.85 isometric tilt)
  projections: ProjectedPosition[];
}

/**
 * Computes deterministic initial angle for a planet based on its identifiers
 */
export function getInitialOrbitAngle(systemId: string, slotIndex: number): number {
  let hash = 0;
  for (let i = 0; i < systemId.length; i++) {
    hash = (hash << 5) - hash + systemId.charCodeAt(i);
    hash |= 0;
  }
  const normalized = Math.abs(hash % 1000) / 1000;
  // Distribute planets evenly with golden ratio jitter
  return (normalized * Math.PI * 2 + slotIndex * 1.61803398875) % (Math.PI * 2);
}

/**
 * Calculates current orbital state and future trajectory projections for a planet slot
 */
export function calculatePlanetOrbit(
  systemId: string,
  slotIndex: number,
  planetId: string,
  timeMs: number
): PlanetOrbitState {
  // Calibrated slow persistent orbital periods (12h, 24h, 48h, 72h)
  const basePeriodsHours = [14, 24, 46, 76];
  const periodHours = basePeriodsHours[slotIndex % basePeriodsHours.length];
  const orbitalPeriodMs = periodHours * 3600 * 1000;

  // Orbital radius in system view coordinates
  const baseRadii = [90, 160, 235, 315];
  const orbitalRadius = baseRadii[slotIndex % baseRadii.length];
  const auDistance = +(0.4 + slotIndex * 0.7).toFixed(1);

  const initialAngle = getInitialOrbitAngle(systemId, slotIndex);
  const totalRotations = timeMs / orbitalPeriodMs;
  const currentAngle = (initialAngle + totalRotations * Math.PI * 2) % (Math.PI * 2);
  const currentAngleDeg = Math.round((currentAngle * 180) / Math.PI);
  const speedDegPerHour = +(360 / periodHours).toFixed(2);

  // Elliptical coordinate projection (0.85 isometric perspective)
  const x = Math.round(Math.cos(currentAngle) * orbitalRadius);
  const y = Math.round(Math.sin(currentAngle) * orbitalRadius * 0.85);

  // Calculate future projections (+2h, +6h, +12h)
  const forecastHours = [2, 6, 12];
  const projections: ProjectedPosition[] = forecastHours.map((h) => {
    const futureTime = timeMs + h * 3600 * 1000;
    const futureAngle =
      (initialAngle + (futureTime / orbitalPeriodMs) * Math.PI * 2) % (Math.PI * 2);
    return {
      hoursAhead: h,
      x: Math.round(Math.cos(futureAngle) * orbitalRadius),
      y: Math.round(Math.sin(futureAngle) * orbitalRadius * 0.85),
      angleDeg: Math.round((futureAngle * 180) / Math.PI),
    };
  });

  return {
    planetId,
    slotIndex,
    orbitalRadius,
    auDistance,
    orbitalPeriodMs,
    speedDegPerHour,
    initialAngle,
    currentAngle,
    currentAngleDeg,
    x,
    y,
    projections,
  };
}
