import '@testing-library/jest-dom/vitest';
import { afterEach, vi } from 'vitest';
import type { ComponentType, ReactNode } from 'react';
import type { AnimatePresenceProps } from 'framer-motion';

vi.mock('framer-motion', async () => {
  const ReactActual = await import('react');
  const actual = await vi.importActual('framer-motion');

  const { useRef: useRefActual, useEffect: useEffectActual, Fragment } = ReactActual;
  const createElement = ReactActual.createElement;

  type PropsWithChildren = AnimatePresenceProps & { children?: ReactNode };
  type AnimatePresenceType = ComponentType<PropsWithChildren>;

  const AnimatePresenceSync: AnimatePresenceType = (propsIn) => {
    const props = propsIn;
    const { children } = props;
    const prevChildrenRef = useRefActual<ReactNode>(undefined);

    useEffectActual(() => {
      const wasDefined = prevChildrenRef.current !== undefined;
      const prevEmpty = prevChildrenRef.current === null || prevChildrenRef.current === false || prevChildrenRef.current === undefined;
      const currEmpty = children === null || children === false || children === undefined;
      const transitionedOut = wasDefined && !prevEmpty && currEmpty;
      prevChildrenRef.current = children;
      if (transitionedOut && typeof props.onExitComplete === 'function') {
        try {
          props.onExitComplete();
        } catch {
          // ignore
        }
      }
    });

    return createElement(Fragment, null, children);
  };

  return {
    ...actual,
    AnimatePresence: AnimatePresenceSync,
    useReducedMotion: () => true,
  };
});

interface MediaQueryListLike {
  matches: boolean;
  media: string;
  onchange: null;
  addListener: () => undefined;
  removeListener: () => undefined;
  addEventListener: () => undefined;
  removeEventListener: () => undefined;
  dispatchEvent: () => boolean;
}

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query: string): MediaQueryListLike => ({
      matches: query.includes('prefers-reduced-motion'),
      media: query,
      onchange: null,
      addListener: () => undefined,
      removeListener: () => undefined,
      addEventListener: () => undefined,
      removeEventListener: () => undefined,
      dispatchEvent: () => false,
    }),
  });
}

if (typeof HTMLElement !== 'undefined') {
  const proto = HTMLElement.prototype as HTMLElement & {
    inert?: boolean;
  };
  if (!Object.prototype.hasOwnProperty.call(proto, 'inert')) {
    Object.defineProperty(proto, 'inert', {
      get(this: HTMLElement) {
        return this.hasAttribute('inert');
      },
      set(this: HTMLElement, value: boolean) {
        if (value) {
          this.setAttribute('inert', '');
        } else {
          this.removeAttribute('inert');
        }
      },
    });
  }
}

afterEach(() => {
  document.body.innerHTML = '';
  const ae = document.activeElement as HTMLElement | null;
  if (ae && typeof ae.blur === 'function') {
    ae.blur();
  }
});
