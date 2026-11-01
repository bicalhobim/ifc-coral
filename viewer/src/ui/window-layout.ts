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
