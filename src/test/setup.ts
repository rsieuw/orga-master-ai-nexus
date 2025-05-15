/**
 * @fileoverview Test setup file for Vitest.
 * This file is automatically executed before running tests and sets up the testing environment.
 * It includes:
 * - Automatic cleanup of the testing DOM after each test using `@testing-library/react`.
 * - Mocking of `ResizeObserver` to prevent issues in test environments where it might not be available or behave as expected.
 */
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';
import '@testing-library/jest-dom';

// Perform cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock for ResizeObserver, which often causes issues in test environments
class ResizeObserverMock {
  observe() { /* do nothing */ }
  unobserve() { /* do nothing */ }
  disconnect() { /* do nothing */ }
}

globalThis.ResizeObserver = ResizeObserverMock; 