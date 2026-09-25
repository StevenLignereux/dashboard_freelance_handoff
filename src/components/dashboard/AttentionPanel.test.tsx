import { fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import type { DashboardItem } from '../../selectors/dashboard';
import { AttentionPanel } from './AttentionPanel';
import { TodayPanel } from './TodayPanel';

const autoReminder: DashboardItem = {
  id: 'dash-r-1-auto-relance-r-1',
  requestId: 'r-1',
  contactId: 'c-1',
  label: 'Ada Lovelace',
  sub: 'Relancer Lovelace — Site vitrine',
  action: {
    id: 'auto-relance-r-1',
    type: 'relance',
    label: 'Relancer Lovelace — Site vitrine',
    dueDate: '2026-09-20T10:00:00.000Z',
    isOverdue: true,
  },
  tone: 'danger',
};

describe('AttentionPanel', () => {
  it('allows an automatic reminder to be marked done', () => {
    const onCompleteAutoReminder = vi.fn().mockResolvedValue(undefined);
    const onOpenContact = vi.fn();
    render(
      <AttentionPanel
        items={[autoReminder]}
        onOpenContact={onOpenContact}
        onCompleteAutoReminder={onCompleteAutoReminder}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Marquer la relance comme faite/i }));

    expect(onCompleteAutoReminder).toHaveBeenCalledWith(autoReminder);
    expect(onOpenContact).not.toHaveBeenCalled();
  });

  it('does not offer completion for a manually planned action', () => {
    render(
      <AttentionPanel
        items={[{ ...autoReminder, action: { ...autoReminder.action, id: 'action-1' } }]}
        onOpenContact={vi.fn()}
        onCompleteAutoReminder={vi.fn().mockResolvedValue(undefined)}
      />
    );

    expect(screen.queryByRole('button', { name: /Marquer la relance comme faite/i })).not.toBeInTheDocument();
  });

  it('also allows an automatic reminder due today to be marked done', () => {
    const onCompleteAutoReminder = vi.fn().mockResolvedValue(undefined);
    render(
      <TodayPanel
        items={[{ ...autoReminder, action: { ...autoReminder.action, isOverdue: false, isToday: true } }]}
        onOpenContact={vi.fn()}
        onCompleteAutoReminder={onCompleteAutoReminder}
      />
    );

    fireEvent.click(screen.getByRole('button', { name: /Marquer la relance comme faite/i }));

    expect(onCompleteAutoReminder).toHaveBeenCalledWith(expect.objectContaining({ requestId: 'r-1' }));
  });
});
