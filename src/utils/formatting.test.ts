import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { clock } from '../config/clock';
import { formatDueDate, formatScheduleLabel, pluralize, withCount } from './formatting';

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

describe('formatScheduleLabel', () => {
  it("Aujourd'hui avec heure — pas de date dupliquée", () => {
    const s = formatScheduleLabel('2026-09-10T14:00:00Z');
    expect(s).toBe("Aujourd'hui · 16h");
  });

  it('Demain avec heure', () => {
    const s = formatScheduleLabel('2026-09-11T10:00:00Z');
    expect(s).toBe('Demain · 12h');
  });

  it('+5 jours : Mar 15 sept. · 12h', () => {
    const s = formatScheduleLabel('2026-09-15T10:00:00Z');
    expect(s).toBe('Mar 15 sept. · 12h');
    // Pas de double date
    expect(s.split('sept.').length).toBe(2);
  });

  it('Date lointaine : Ven 25 déc. · 11h', () => {
    const s = formatScheduleLabel('2026-12-25T10:00:00Z');
    expect(s).toBe('Ven 25 déc. · 11h');
    expect(s.split('déc.').length).toBe(2);
  });

  it("n'affiche jamais seulement l'heure", () => {
    const today = formatScheduleLabel('2026-09-10T08:00:00Z');
    const upcoming = formatScheduleLabel('2026-09-15T09:30:00Z');
    expect(today.length).toBeGreaterThan(5);
    expect(upcoming.length).toBeGreaterThan(5);
    expect(today).not.toBe('10h');
    expect(upcoming).not.toBe('11h30');
  });
});

describe('pluralize / withCount', () => {
  it('pluralize 0 → singulier', () => { expect(pluralize(0, 'demande')).toBe('demande'); });
  it('pluralize 1 → singulier', () => { expect(pluralize(1, 'demande')).toBe('demande'); });
  it('pluralize 2 → pluriel par défaut', () => { expect(pluralize(2, 'demande')).toBe('demandes'); });
  it('withCount 1 mission', () => { expect(withCount(1, 'mission')).toBe('1 mission'); });
  it('withCount 2 missions', () => { expect(withCount(2, 'mission')).toBe('2 missions'); });
});
