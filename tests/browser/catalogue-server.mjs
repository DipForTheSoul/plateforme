import {createServer} from 'node:http';
const practitioner = {id:'qa-practitioner', slug:'qa-practitioner', name:'Atelier synthétique', status:'approved'};
const category = {id:'qa-category',slug:'meditation',name:'Méditation',position:1};
const events = ['fr','de'].map((language,index)=>({
  id:`qa-${index}`,slug:`qa-${index}`,title:`Expérience synthétique ${language}`,description:'Données exclusivement synthétiques pour recette locale.',
  status:'approved',start_date:'2030-10-20T10:00:00Z',end_date:'2030-10-20T11:00:00Z',duration_minutes:60,
  price:20,currency:'CHF',languages:[language],images:[],is_top:false,practitioner,
  venue:{id:`qa-venue-${index}`,name:'Lieu synthétique',country:'CH',canton:'VD',lat:46.52+index*.08,lng:6.63+index*.08},
  event_categories:[{category}],
}));
createServer((req,res)=>{
  if(req.method!=='GET'){res.writeHead(405);res.end();return;}
  const table=new URL(req.url,'http://localhost').pathname.split('/').at(-1);
  const data=({events,practitioners:[practitioner],categories:[category],settings:[],venues:events.map(e=>e.venue)})[table]??[];
  res.writeHead(200,{'Content-Type':'application/json'});res.end(JSON.stringify(data));
}).listen(54321,'127.0.0.1',()=>console.log('Synthetic read-only catalogue http://127.0.0.1:54321'));
