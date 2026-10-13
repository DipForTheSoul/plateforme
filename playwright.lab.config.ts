import {defineConfig} from '@playwright/test';
import base from './playwright.config';
export default defineConfig({
  ...base,
  testDir:'./tests/lab-e2e',
  outputDir:'output/lab-results',
  retries:0,
  use:{...base.use,baseURL:'http://127.0.0.1:3101'},
  webServer:{command:'npm run test:lab',url:'http://127.0.0.1:3101',reuseExistingServer:true},
  reporter:[['list'],['html',{outputFolder:'output/lab-report',open:'never'}]],
});
