import {defineConfig, devices} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({
  ...base, testDir:'./tests/catalogue-e2e', retries:0, workers:3,
  outputDir:'output/catalogue-20261015/results',
  reporter:[['list'],['html',{outputFolder:'output/catalogue-20261015/report',open:'never'}]],
  use:{...base.use,baseURL:'http://localhost:3102',locale:'fr-FR'},
  projects:[...base.projects!,{name:'Desktop-Chromium',use:{...devices['Desktop Chrome']}}],
});
