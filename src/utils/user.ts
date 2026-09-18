import type { User } from '@supabase/supabase-js';

export interface CurrentUser {
  id: string;
  firstName: string;
  lastName: string;
  role: string;
  avatarLabel: string;
}

function cleanSegment(part: string | undefined | null, fallback: string): string {
  const s = (part ?? '').trim();
  return s.length > 0 ? s : fallback;
}

function splitFullName(fullName: string): { first: string; last: string } {
  const parts = fullName.trim().split(/\s+/);
  if (parts.length === 0) return { first: '', last: '' };
  if (parts.length === 1) return { first: parts[0] ?? '', last: '' };
  const first = parts[0] ?? '';
  const last = parts.slice(1).join(' ');
  return { first, last };
}

function deriveFromEmail(email: string | undefined | null): { first: string; last: string } {
  const e = (email ?? '').trim();
  if (!e) return { first: 'Ami', last: 'Freelance' };
  const local = e.split('@')[0] ?? e;
  if (!local) return { first: 'Ami', last: 'Freelance' };
  const clean = local.replace(/[^a-zA-Z0-9._-]/g, ' ').replace(/[._-]+/g, ' ').trim();
  const parts = clean.split(/\s+/).filter(Boolean);
  if (parts.length === 0) return { first: local.slice(0, 1).toUpperCase() + local.slice(1), last: '' };
  if (parts.length === 1) {
    const token = parts[0] ?? '';
    const cap = token.charAt(0).toUpperCase() + token.slice(1);
    return { first: cap, last: '' };
  }
  const first = parts[0] ?? '';
  const last = parts.slice(1).join(' ');
  const capFirst = first.charAt(0).toUpperCase() + first.slice(1);
  const capLast = last.charAt(0).toUpperCase() + last.slice(1);
  return { first: capFirst, last: capLast };
}

export function buildCurrentUser(user: User | null | undefined): CurrentUser {
  const userId = user?.id ?? 'anonymous';
  const meta = (user?.user_metadata ?? {}) as Record<string, unknown> | null | undefined;

  const firstNameRaw = (meta?.first_name ?? meta?.firstName) as string | undefined | null;
  const lastNameRaw = (meta?.last_name ?? meta?.lastName) as string | undefined | null;
  const fullNameRaw = (meta?.full_name ?? meta?.fullName ?? meta?.name) as string | undefined | null;
  const roleRaw = (meta?.role ?? meta?.job_title ?? meta?.jobTitle ?? meta?.title) as string | undefined | null;

  let firstName = cleanSegment(firstNameRaw, '');
  let lastName = cleanSegment(lastNameRaw, '');

  if (firstName.length === 0 && fullNameRaw) {
    const split = splitFullName(fullNameRaw);
    firstName = cleanSegment(split.first, '');
    lastName = cleanSegment(split.last, lastName);
  }

  if (firstName.length === 0 || lastName.length === 0) {
    const fromEmail = deriveFromEmail(user?.email);
    if (firstName.length === 0) firstName = cleanSegment(fromEmail.first, 'Ami');
    if (lastName.length === 0) lastName = cleanSegment(fromEmail.last, 'Freelance');
  }

  const role = cleanSegment(roleRaw, 'Freelance');
  const initials = (firstName.charAt(0) + lastName.charAt(0)).toUpperCase();
  const avatarLabel = initials || (user?.email?.charAt(0) ?? '?').toUpperCase();

  return {
    id: userId,
    firstName,
    lastName,
    role,
    avatarLabel,
  };
}
