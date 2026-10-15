import {it,expect} from 'vitest';
import {render} from '@testing-library/react';
import {StaticEventsMap} from '@/components/StaticEventsMap';
import type {MapItem} from '@/components/EventsMapExplorer';

it('garde les marqueurs éloignés dans le cadre et borne les tuiles SSR',()=>{
  const items=[{id:'west',slug:'west',lat:46.2,lng:6.1},{id:'east',slug:'east',lat:47.4,lng:9.5},{id:'invalid',lat:NaN,lng:8}].map(item=>({...item,title:'Synthétique',priceLabel:'CHF 20',dateLabel:'Test'})) as MapItem[];
  const {container}=render(<StaticEventsMap items={items} hrefPrefix="/de"/>);
  expect(container.querySelectorAll('image').length).toBeLessThanOrEqual(9);
  const markers=container.querySelectorAll('circle');expect(markers).toHaveLength(2);
  for(const marker of markers){
    expect(Number(marker.getAttribute('cx'))).toBeGreaterThanOrEqual(12);
    expect(Number(marker.getAttribute('cx'))).toBeLessThanOrEqual(500);
    expect(Number(marker.getAttribute('cy'))).toBeGreaterThanOrEqual(12);
    expect(Number(marker.getAttribute('cy'))).toBeLessThanOrEqual(372);
  }
  expect(container.querySelector('svg')).toHaveAttribute('preserveAspectRatio','xMidYMid meet');
  expect(container.querySelector('svg a')).toHaveAttribute('href','/de/experiences/west');
});
