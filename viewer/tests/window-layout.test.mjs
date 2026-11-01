import {test} from 'node:test';
import assert from 'node:assert/strict';
import {fitWindow,dockWidths} from '../src/ui/window-layout.ts';
test('floating windows remain recoverable after viewport shrinks or invalid stored values',()=>{
 const r=fitWindow({x:900,y:800,width:900,height:900},400,300);
 assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=400&&r.y+r.height<=300);
 assert.ok(Object.values(fitWindow({x:NaN,y:Infinity,width:-1,height:NaN},400,300)).every(Number.isFinite));
});
test('two dock columns preserve usable canvas and clamp widths',()=>{
 const {left,right}=dockWidths(700,300,300);assert.ok(left+right<=480);assert.ok(left>=0&&right>=0);
 assert.deepEqual(dockWidths(180,300,300),{left:0,right:0});
});
