import '@testing-library/jest-dom/vitest';
import { cleanup } from '@testing-library/react';
import { afterEach, vi } from 'vitest';
import { JSDOM } from 'jsdom';
const storageWindow = new JSDOM('', { url: 'http://localhost:3100' }).window;
vi.stubGlobal('localStorage', storageWindow.localStorage);
vi.stubGlobal('sessionStorage', storageWindow.sessionStorage);
afterEach(() => { cleanup(); vi.restoreAllMocks(); localStorage.clear(); sessionStorage.clear(); });
