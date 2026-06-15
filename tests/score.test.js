import { describe, it, expect } from 'vitest';
import { sampleCurve, movementAt, sampleScore, movementWindows, progressFor } from '../src/score.js';

describe('sampleCurve', () => {
  const pts = [{ t: 0, v: 0 }, { t: 10, v: 1 }, { t: 20, v: 0 }];
  it('clamps before first and after last point', () => {
    expect(sampleCurve(pts, -1)).toBe(0);
    expect(sampleCurve(pts, 99)).toBe(0);
  });
  it('linearly interpolates between points', () => {
    expect(sampleCurve(pts, 5)).toBeCloseTo(0.5);
    expect(sampleCurve(pts, 15)).toBeCloseTo(0.5);
  });
  it('returns exact value at a knot', () => {
    expect(sampleCurve(pts, 10)).toBe(1);
  });
});

describe('movementAt', () => {
  const order = ['colossus', 'maw', 'gate'];
  const transitions = [{ at: 100, dur: 4 }, { at: 240, dur: 6 }];
  it('returns a single movement with blend 0 outside transition windows', () => {
    expect(movementAt(10, order, transitions)).toEqual({ from: 'colossus', to: 'colossus', blend: 0 });
    expect(movementAt(150, order, transitions)).toEqual({ from: 'maw', to: 'maw', blend: 0 });
    expect(movementAt(300, order, transitions)).toEqual({ from: 'gate', to: 'gate', blend: 0 });
  });
  it('crossfades across a transition window', () => {
    const m = movementAt(102, order, transitions); // 2s into a 4s fade at t=100
    expect(m.from).toBe('colossus'); expect(m.to).toBe('maw');
    expect(m.blend).toBeCloseTo(0.5);
  });
});

describe('movementWindows / progressFor', () => {
  const order = ['colossus', 'maw', 'gate'];
  const transitions = [{ at: 100, dur: 4 }, { at: 240, dur: 6 }];
  const windows = movementWindows(order, transitions, 325);
  it('spans each movement including its entering crossfade', () => {
    expect(windows[0]).toEqual({ name: 'colossus', start: 0, end: 104 });
    expect(windows[1]).toEqual({ name: 'maw', start: 100, end: 246 });
    expect(windows[2]).toEqual({ name: 'gate', start: 240, end: 325 });
  });
  it('reports normalized 0..1 progress through a movement, clamped', () => {
    expect(progressFor(0, 'colossus', windows)).toBe(0);
    expect(progressFor(52, 'colossus', windows)).toBeCloseTo(0.5);
    expect(progressFor(999, 'gate', windows)).toBe(1);
  });
});

describe('sampleScore', () => {
  it('bundles movement + corruption + ui at a time', () => {
    const score = {
      order: ['colossus', 'maw', 'gate'],
      transitions: [{ at: 100, dur: 4 }, { at: 240, dur: 6 }],
      corruption: [{ t: 0, v: 0.1 }, { t: 100, v: 1.2 }, { t: 246, v: 0 }],
      ui: [{ id: 'title', show: 0, hide: 8 }],
    };
    const s = sampleScore(score, 2);
    expect(s.from).toBe('colossus');
    expect(s.corruption).toBeCloseTo(0.1 + (1.2 - 0.1) * (2 / 100), 3);
    expect(s.ui).toContain('title');
  });
});
