export type WindowRect={x:number;y:number;width:number;height:number};
const finite=(n:number,fallback:number)=>Number.isFinite(n)?n:fallback;
export function fitWindow(r:WindowRect,w:number,h:number):WindowRect {
 w=Math.max(1,finite(w,800));h=Math.max(1,finite(h,600));
 const width=Math.min(w,Math.max(Math.min(220,w),finite(r.width,320))),height=Math.min(h,Math.max(Math.min(160,h),finite(r.height,360)));
 return {width,height,x:Math.max(0,Math.min(w-width,finite(r.x,20))),y:Math.max(0,Math.min(h-height,finite(r.y,20)))};
}
export function dockWidths(width:number,left:number,right:number){
 const available=Math.max(0,width-220),total=Math.max(0,left)+Math.max(0,right),ratio=total>available?available/total:1;
 return {left:Math.floor(Math.max(0,left)*ratio),right:Math.floor(Math.max(0,right)*ratio)};
}
export function overlaps(a:WindowRect,b:WindowRect){return a.x<b.x+b.width&&a.x+a.width>b.x&&a.y<b.y+b.height&&a.y+a.height>b.y;}
/** Preserve requested size; if it cannot fit beside peers, the caller docks it. */
export function placeWithoutOverlap(rect:WindowRect,others:WindowRect[],w:number,h:number):WindowRect|null{
 const r=fitWindow(rect,w,h),free=(candidate:WindowRect)=>!others.some(o=>overlaps(candidate,o));if(free(r))return r;
 const xs=[0,...others.flatMap(o=>[o.x+o.width+6,o.x-r.width-6])],ys=[0,...others.flatMap(o=>[o.y+o.height+6,o.y-r.height-6])];
 const candidates=xs.flatMap(x=>ys.map(y=>({...r,x,y}))).filter(c=>c.x>=0&&c.y>=0&&c.x+c.width<=w&&c.y+c.height<=h&&free(c));
 candidates.sort((a,b)=>Math.hypot(a.x-r.x,a.y-r.y)-Math.hypot(b.x-r.x,b.y-r.y));return candidates[0]??null;
}
