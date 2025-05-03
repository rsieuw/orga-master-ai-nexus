import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Voer cleanup uit na elke test
afterEach(() => {
  cleanup();
});

// Mock voor de ResizeObserver, die vaak problemen veroorzaakt in test omgevingen
class ResizeObserverMock {
  observe() { /* doe niets */ }
  unobserve() { /* doe niets */ }
  disconnect() { /* doe niets */ }
}

window.ResizeObserver = ResizeObserverMock; 