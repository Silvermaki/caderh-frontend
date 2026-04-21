import '@testing-library/jest-dom/vitest';

if (typeof window !== 'undefined') {
  window.matchMedia = window.matchMedia || ((query: string) => ({
    matches: false,
    media: query,
    addListener: () => {},
    removeListener: () => {},
    addEventListener: () => {},
    removeEventListener: () => {},
    dispatchEvent: () => false,
    onchange: null,
  })) as any;
}
