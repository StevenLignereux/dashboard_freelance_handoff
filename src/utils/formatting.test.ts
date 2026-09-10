import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { clock } from '../config/clock';
import { formatDueDate } from './formatting';

beforeEach(() => {
  clock.setImplementation(() => new Date('2026-09-10T10:00:00Z'));
});
afterEach(() => {
  clock.reset();
});

describe('formatDueDate', () => {
  it('indique un retard de 3 jours', () => {
    const out = formatDueDate('2026-09-07T09:00:00Z');
    expect(out.when).toBe('En retard de 3 jours');
  });

  it("indique Aujourd'hui pour le jour J", () => {
    const out = formatDueDate('2026-09-10T14:30:00Z');
    expect(out.when).toBe("Aujourd'hui");
    expect(out.hour).toBe('16h30');
  });

  it('indique Demain pour J+1', () => {
    const out = formatDueDate('2026-09-11T10:00:00Z');
    expect(out.when).toBe('Demain');
  });

  it('indique Dans 4 jours pour J+4', () => {
    const out = formatDueDate('2026-09-14T10:00:00Z');
    expect(out.when).toBe('Dans 4 jours');
  });

  it('formate une date lointaine avec jour et mois', () => {
    const out = formatDueDate('2026-12-25T10:00:00Z');
    expect(out.when).toBe('Le Ven 25 déc.');
    expect(out.weekday).toBe('Ven');
  });
});
