import type { MapItem } from './EventsMapExplorer';

/** Bounded, server-rendered map: no application JavaScript is needed. */
export function StaticEventsMap({items, hrefPrefix}: {items: MapItem[]; hrefPrefix: string}) {
  const points = items.filter(item => Number.isFinite(item.lat) && Number.isFinite(item.lng));
  const project = (lat: number, lng: number) => {
    const sin = Math.sin(Math.max(-85.0511, Math.min(85.0511, lat)) * Math.PI / 180);
    return [(lng + 180) / 360, .5 - Math.log((1 + sin) / (1 - sin)) / (4 * Math.PI)];
  };
  const coords = (points.length ? points : [{lat:46.8,lng:8.23}]).map(p => project(p.lat,p.lng));
  const minX = Math.min(...coords.map(p=>p[0])), maxX = Math.max(...coords.map(p=>p[0]));
  const minY = Math.min(...coords.map(p=>p[1])), maxY = Math.max(...coords.map(p=>p[1]));
  const zoom = Math.max(0, Math.min(12, Math.floor(Math.log2(Math.min(448 / Math.max(maxX-minX, .00001), 320 / Math.max(maxY-minY,.00001)) / 256))));
  const scale = 256 * 2 ** zoom;
  const left = (minX+maxX)/2*scale-256, top = (minY+maxY)/2*scale-192;
  const tiles = [];
  for(let y=Math.floor(top/256); y<=Math.floor((top+384)/256); y++) {
    for(let x=Math.floor(left/256); x<=Math.floor((left+512)/256); x++) {
      if(y<0 || y>=2**zoom) continue;
      const wrappedX = ((x % 2**zoom)+2**zoom)%2**zoom;
      tiles.push(<image key={`${x}-${y}`} href={`https://tile.openstreetmap.org/${zoom}/${wrappedX}/${y}.png`} x={x*256-left} y={y*256-top} width="256" height="256" />);
    }
  }
  return <div data-testid="static-map" className="relative h-full min-h-64 overflow-hidden bg-soul-sand">
    <svg viewBox="0 0 512 384" className="h-full w-full" role="img" aria-label="OpenStreetMap" preserveAspectRatio="xMidYMid meet">
      {tiles}
      {points.map(item => {const [x,y]=project(item.lat,item.lng);return <a key={item.id} href={`${hrefPrefix}/experiences/${encodeURIComponent(item.slug)}`} aria-label={item.title}><circle cx={x*scale-left} cy={y*scale-top} r="12" fill="#604ca0" stroke="white" strokeWidth="3"/><title>{item.title}</title></a>;})}
    </svg>
    <a className="absolute bottom-0 right-0 bg-white px-2 text-xs text-soul-brown" href="https://www.openstreetmap.org/copyright">© OpenStreetMap contributors</a>
  </div>;
}
