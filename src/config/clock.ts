let clockImpl: () => Date = () => new Date();

export const clock = {
  now: (): Date => clockImpl(),
  nowIso: (): string => clockImpl().toISOString(),
  setImplementation: (fn: () => Date): void => {
    clockImpl = fn;
  },
  reset: (): void => {
    clockImpl = () => new Date();
  },
};
