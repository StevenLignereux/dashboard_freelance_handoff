import { clock } from '../config/clock';
import { useMemo } from 'react';

export function getInitials(firstName: string, lastName: string): string {
  return (
    firstName.charAt(0) + lastName.charAt(0)
  ).toUpperCase();
}

const palette = [
  ['#7C5CFF', '#22D3EE'],
  ['#FF7A59', '#FBBF24'],
  ['#34D399', '#22D3EE'],
  ['#60A5FA', '#7C5CFF'],
  ['#FBBF24', '#FF7A59'],
  ['#22D3EE', '#34D399'],
  ['#A78BFA', '#F472B6'],
  ['#FB923C', '#FBBF24'],
];

export function hashStringToIndex(str: string, len: number): number {
  let h = 0;
  for (let i = 0; i < str.length; i++) {
    h = (h * 31 + str.charCodeAt(i)) >>> 0;
  }
  return h % len;
}

export function useAvatarGradient(seed: string) {
  return useMemo(() => {
    const idx = hashStringToIndex(seed, palette.length);
    const [from, to] = palette[idx];
    const angle = 130 + (hashStringToIndex(seed + 'a', 60));
    return {
      background: `linear-gradient(${angle}deg, ${from} 0%, ${to} 100%)`,
      from,
      to,
    };
  }, [seed]);
}

export function formatDueDate(iso: string): {
  when: string;
  dateLabel: string;
  weekday?: string;
  hour?: string;
} {
  const date = new Date(iso);
  const now = clock.now();
  const dayStart = new Date(now);
  dayStart.setHours(0, 0, 0, 0);
  const targetStart = new Date(date);
  targetStart.setHours(0, 0, 0, 0);
  const diffDays = Math.round(
    (targetStart.getTime() - dayStart.getTime()) / (1000 * 60 * 60 * 24)
  );

  const weekdays = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
  const months = [
    'janv.',
    'févr.',
    'mars',
    'avr.',
    'mai',
    'juin',
    'juil.',
    'août',
    'sept.',
    'oct.',
    'nov.',
    'déc.',
  ];

  const hour = `${date.getHours().toString().padStart(2, '0')}h${
    date.getMinutes() === 0 ? '' : date.getMinutes().toString().padStart(2, '0')
  }`;

  let when: string;
  if (diffDays < 0) when = `En retard de ${Math.abs(diffDays)} jour${Math.abs(diffDays) > 1 ? 's' : ''}`;
  else if (diffDays === 0) when = `Aujourd'hui`;
  else if (diffDays === 1) when = 'Demain';
  else if (diffDays <= 6) when = `Dans ${diffDays} jours`;
  else when = `Le ${weekdays[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;

  const dateLabel = `${weekdays[date.getDay()]} ${date.getDate()} ${months[date.getMonth()]}`;

  return { when, dateLabel, weekday: weekdays[date.getDay()], hour };
}
