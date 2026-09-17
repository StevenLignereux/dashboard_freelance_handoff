import { describe, it, expect, vi, type Mock } from 'vitest';
import { render, screen, fireEvent, act, waitFor } from '@testing-library/react';
import { AppStoreProvider, useAppStore } from '../../store/AppStore';
import { RequestActionCreateModal } from './RequestActionCreateModal';
import type { ReactElement } from 'react';
import type {
    Request,
    NextAction,
} from '../../types';
import { seedMissions, seedExchanges } from '../../data/seedData';
import type { CreateContactInput, IRepository, UpdateContactInput, UpdateRequestInput, CreateRequestActionInput } from '../../data/repositories/interface';

type RepositorySpy = IRepository & {
    createRequestActionSpy: Mock<(input: CreateRequestActionInput) => Promise<NextAction>>;
};

const TEST_REQUEST: Request = {
    id: 'r-action-test',
    contactId: 'c-1',
    title: 'Refonte du site vitrine',
    status: 'nouveau',
    archived: false,
    createdAt: new Date().toISOString(),
    lastActivityAt: new Date().toISOString(),
};

function buildRepository(overrides?: Partial<IRepository>, customRequests?: Request[]): RepositorySpy {
    const sr = customRequests ?? [TEST_REQUEST];
    const sm = seedMissions;
    const se = seedExchanges;

    const createRequestActionSpy = vi
        .fn<(input: CreateRequestActionInput) => Promise<NextAction>>()
        .mockImplementation(
            overrides?.createRequestAction ??
            ((input) => {
                const created: NextAction = {
                    id: 'a-created',
                    type: input.type,
                    label: input.label,
                    dueDate: input.dueDate,
                };
                return Promise.resolve(created);
            })
        );

    return {
        loadContacts: () => Promise.resolve([]),
        loadRequests: () => Promise.resolve(sr),
        loadMissions: () => Promise.resolve(sm),
        loadExchanges: () => Promise.resolve(se),
        createContact: (_input: CreateContactInput) =>
            Promise.reject(new Error('not implemented')),
        updateContact: (_id: string, _in: UpdateContactInput) =>
            Promise.reject(new Error('not implemented')),
        archiveContact: overrides?.archiveContact ?? (() => Promise.resolve()),
        updateRequest: vi.fn<(requestId: string, input: UpdateRequestInput) => Promise<Request>>(),
        archiveRequest: vi.fn<(requestId: string) => Promise<void>>(),
        createRequest: vi.fn(),
        createRequestAction: createRequestActionSpy,
        ...overrides,
        createRequestActionSpy,
    };
}

function withWrapper(ui: ReactElement, repository?: IRepository) {
    const repo = repository ?? buildRepository();
    return <AppStoreProvider repository={repo}>{ui}</AppStoreProvider>;
}

async function waitForDataLoaded() {
    await waitFor(() => {
        expect(screen.queryByTestId('appstore-not-ready')).not.toBeInTheDocument();
    });
}

function DataReady() {
    const store = useAppStore();
    if (store.data.loading || store.data.error) {
        return <div data-testid="appstore-not-ready" />;
    }
    return null;
}

describe('RequestActionCreateModal', () => {
    it('1. valid requestId → modal is visible and displays Refonte du site vitrine', async () => {
        const onClose = vi.fn();
        render(
            withWrapper(
                <>
                    <DataReady />
                    <RequestActionCreateModal requestId={TEST_REQUEST.id} onClose={onClose} />
                </>
            )
        );

        await waitForDataLoaded();

        const dialog = screen.getByRole('dialog', { name: /Planifier une action/i });
        expect(dialog).toBeInTheDocument();
        expect(dialog).toHaveTextContent('Refonte du site vitrine');
    });

    it('2. requestId={null} → no dialog rendered', async () => {
        const onClose = vi.fn();
        render(
            withWrapper(
                <>
                    <DataReady />
                    <RequestActionCreateModal requestId={null} onClose={onClose} />
                </>
            )
        );

        await waitForDataLoaded();

        const dialog = screen.queryByRole('dialog');
        expect(dialog).not.toBeInTheDocument();
    });

    it('3. archived request → no dialog rendered', async () => {
        const onClose = vi.fn();
        const archivedRequest: Request = { ...TEST_REQUEST, archived: true };
        const repo = buildRepository({}, [archivedRequest]);

        render(
            withWrapper(
                <>
                    <DataReady />
                    <RequestActionCreateModal requestId={TEST_REQUEST.id} onClose={onClose} />
                </>,
                repo
            )
        );

        await waitForDataLoaded();

        const dialog = screen.queryByRole('dialog');
        expect(dialog).not.toBeInTheDocument();
    });

    it('4. request with existing nextAction → no dialog rendered', async () => {
        const onClose = vi.fn();
        const requestWithAction: Request = {
            ...TEST_REQUEST,
            nextAction: { id: 'a-existing', type: 'appel', label: 'Appeler le client', dueDate: new Date().toISOString() }
        };
        const repo = buildRepository({}, [requestWithAction]);

        render(
            withWrapper(
                <>
                    <DataReady />
                    <RequestActionCreateModal requestId={TEST_REQUEST.id} onClose={onClose} />
                </>,
                repo
            )
        );

        await waitForDataLoaded();

        const dialog = screen.queryByRole('dialog');
        expect(dialog).not.toBeInTheDocument();
    });

    it('5. valid submission → createRequestAction called with correct data and onClose is called', async () => {
        const onClose = vi.fn();
        const repo = buildRepository();

        render(
            withWrapper(
                <>
                    <DataReady />
                    <RequestActionCreateModal requestId={TEST_REQUEST.id} onClose={onClose} />
                </>,
                repo
            )
        );

        await waitForDataLoaded();

        const typeSelect = screen.getByRole('combobox', { name: /Type/i });
        fireEvent.change(typeSelect, { target: { value: 'devis' } });

        const labelInput = screen.getByRole('textbox', { name: /Action/i });
        fireEvent.change(labelInput, { target: { value: 'Préparer le devis' } });

        const dateInput = screen.getByLabelText(/Date prévue/i);
        fireEvent.change(dateInput, { target: { value: '2024-06-20T10:30' } });

        const submitButton = screen.getByRole('button', { name: /Planifier l'action/i });
        // eslint-disable-next-line @typescript-eslint/require-await
        await act(async () => {
            fireEvent.click(submitButton);
        });

        expect(repo.createRequestActionSpy).toHaveBeenCalledTimes(1);
        expect(repo.createRequestActionSpy).toHaveBeenCalledWith({
            requestId: TEST_REQUEST.id,
            type: 'devis',
            label: 'Préparer le devis',
            dueDate: new Date('2024-06-20T10:30').toISOString(),
        });

        await waitFor(() => {
            expect(onClose).toHaveBeenCalledTimes(1);
        });
    });

    it('6. repository error → displays role="alert" with message and does not call onClose', async () => {
        const onClose = vi.fn();
        const repo = buildRepository({
            createRequestAction: () => Promise.reject(new Error('create action failed')),
        });

        render(
            withWrapper(
                <>
                    <DataReady />
                    <RequestActionCreateModal requestId={TEST_REQUEST.id} onClose={onClose} />
                </>,
                repo
            )
        );

        await waitForDataLoaded();

        const typeSelect = screen.getByRole('combobox', { name: /Type/i });
        fireEvent.change(typeSelect, { target: { value: 'devis' } });

        const labelInput = screen.getByRole('textbox', { name: /Action/i });
        fireEvent.change(labelInput, { target: { value: 'Préparer le devis' } });

        const dateInput = screen.getByLabelText(/Date prévue/i);
        fireEvent.change(dateInput, { target: { value: '2024-06-20T10:30' } });

        const submitButton = screen.getByRole('button', { name: /Planifier l'action/i });
        // eslint-disable-next-line @typescript-eslint/require-await
        await act(async () => {
            fireEvent.click(submitButton);
        });

        await waitFor(() => {
            const alert = screen.getByRole('alert');
            expect(alert).toBeInTheDocument();
            expect(alert.textContent).toMatch(/create action failed/);
        });

        expect(onClose).not.toHaveBeenCalled();
    });

    it('7. empty label → createRequestAction is never called', async () => {
        const onClose = vi.fn();
        const repo = buildRepository();

        render(
            withWrapper(
                <>
                    <DataReady />
                    <RequestActionCreateModal requestId={TEST_REQUEST.id} onClose={onClose} />
                </>,
                repo
            )
        );

        await waitForDataLoaded();

        const typeSelect = screen.getByRole('combobox', { name: /Type/i });
        fireEvent.change(typeSelect, { target: { value: 'devis' } });

        const dateInput = screen.getByLabelText(/Date prévue/i);
        fireEvent.change(dateInput, { target: { value: '2024-06-20T10:30' } });

        const submitButton = screen.getByRole('button', { name: /Planifier l'action/i });
        // eslint-disable-next-line @typescript-eslint/require-await
        await act(async () => {
            fireEvent.click(submitButton);
        });

        expect(repo.createRequestActionSpy).not.toHaveBeenCalled();
        expect(onClose).not.toHaveBeenCalled();
    });
});
