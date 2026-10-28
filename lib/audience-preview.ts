// Presentation fixtures only. Never returned by the real administration RPC.
export function audiencePreviewData(days:7|30|90){
 const to='2026-10-28';const end=new Date(to+'T12:00:00Z');
 const daily=Array.from({length:days},(_,i)=>{const d=new Date(end);d.setUTCDate(d.getUTCDate()-days+1+i);return {day:d.toISOString().slice(0,10),visitors:i===days-1?13:i===days-15?3:0,views:i===days-1?36:0};});
 const older=days>7?3:0;
 return {days,from:daily[0].day,to,started_at:'2026-10-28T08:00:00Z',visitors:13+older,measured_visitors:13,page_views:36,signups:3,conversion_rate:23.1,paid:5,google:3,
 sources:[{name:'paid_social',count:5},{name:'google',count:3},{name:'social',count:2},{name:'direct',count:2},{name:'unknown',count:1+older}],
 countries:[{name:'CH',count:10},{name:'FR',count:2},{name:'ZZ',count:1+older}],devices:[{name:'mobile',count:8},{name:'desktop',count:4},{name:'unknown',count:1+older}],
 pages:[{name:'/',count:12},{name:'/experiences',count:12},{name:'/lieux',count:12}],daily};
}
