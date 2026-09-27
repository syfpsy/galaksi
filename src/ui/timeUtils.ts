/**
 * Time and Clock formatting utilities for Canlı Galaksi
 * Handles persistent slow strategy game durations, ETA clock, and day cycles.
 */

export function formatDuration(durationMs: number): string {
  const totalSec = Math.max(0, Math.floor(durationMs / 1000));
  const hours = Math.floor(totalSec / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  if (hours > 0) {
    return `${hours} sa ${minutes.toString().padStart(2, '0')} dk`;
  }
  if (minutes > 0) {
    return `${minutes} dk ${seconds.toString().padStart(2, '0')} sn`;
  }
  return `${seconds} sn`;
}

export function formatSimClock(gameTimeMs: number): string {
  const totalSec = Math.floor(gameTimeMs / 1000);
  const days = Math.floor(totalSec / 86400) + 1; // Day 1, Day 2...
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;

  const clock = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  return `Gün ${days} • ${clock}`;
}

export function formatClockTime(gameTimeMs: number): string {
  const totalSec = Math.floor(gameTimeMs / 1000);
  const hours = Math.floor((totalSec % 86400) / 3600);
  const minutes = Math.floor((totalSec % 3600) / 60);
  const seconds = totalSec % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}
