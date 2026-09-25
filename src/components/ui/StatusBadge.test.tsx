import { render, screen } from '@testing-library/react';
import { describe, expect, it } from 'vitest';
import { StatusBadge } from './StatusBadge';

describe('StatusBadge', () => {
  it('affiche le statut de demande terminée', () => {
    render(<StatusBadge status="terminee" />);

    expect(screen.getByText('Terminée')).toBeInTheDocument();
  });
});
