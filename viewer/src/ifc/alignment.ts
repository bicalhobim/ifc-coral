import * as THREE from 'three';

export type Point3=[number,number,number];
export type ThreePointAlignment={source:[Point3,Point3,Point3];target:[Point3,Point3,Point3];matrix:number[]};

function frame(points:[Point3,Point3,Point3]){
 const [a,b,c]=points.map(p=>new THREE.Vector3(...p));
 const x=b.clone().sub(a);if(x.length()<0.001)throw new Error('Os pontos 1 e 2 precisam ser distintos.');x.normalize();
 const z=new THREE.Vector3().crossVectors(x,c.clone().sub(a));if(z.length()<0.001)throw new Error('Os três pontos não podem estar alinhados.');z.normalize();
 const y=new THREE.Vector3().crossVectors(z,x).normalize();
 const matrix=new THREE.Matrix4().makeBasis(x,y,z);matrix.setPosition(a);
 return matrix;
}

/** Alinhamento rígido: conserva dimensões, volumes e a identidade dos elementos. */
export function alignThreePoints(source:[Point3,Point3,Point3],target:[Point3,Point3,Point3]):ThreePointAlignment{
 for(const point of [...source,...target])if(point.length!==3||point.some(value=>!Number.isFinite(value)||Math.abs(value)>1_000_000))throw new Error('Informe seis pontos com coordenadas válidas.');
 const s=frame(source),t=frame(target),matrix=t.clone().multiply(s.clone().invert());
 const residual=Math.max(...source.map((point,i)=>new THREE.Vector3(...point).applyMatrix4(matrix).distanceTo(new THREE.Vector3(...target[i]))));
 if(residual>0.01)throw new Error(`Os três pares não definem um deslocamento rígido (diferença de ${residual.toFixed(3)} m). Confira distâncias e unidades.`);
 return {source,target,matrix:matrix.toArray()};
}
