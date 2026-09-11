import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';

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
      matches: false,
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
