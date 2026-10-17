"""SI mesh measurements. World-oriented faces; recentered volume for large coordinates."""
import numpy as np
import ifcopenshell.geom
import ifcopenshell.util.shape as us

def measure_mesh(vertices, faces, method):
    v=np.asarray(vertices,dtype=float);f=np.asarray(faces,dtype=int)
    if v.ndim!=2 or v.shape[1]!=3 or not np.isfinite(v).all() or f.ndim!=2 or f.shape[1]!=3:
        raise ValueError('Invalid triangular mesh')
    centered=v-v.mean(axis=0);tri=v[f];cross=np.cross(centered[f[:,1]]-centered[f[:,0]],centered[f[:,2]]-centered[f[:,0]])
    length=np.linalg.norm(cross,axis=1);valid=length>1e-12
    normals=np.zeros_like(cross);normals[valid]=cross[valid]/length[valid,None];area=length/2
    # Weld coincident vertices for topological closure, preserving holes in actual faces.
    _,indices=np.unique(np.round(centered,7),axis=0,return_inverse=True);edges={}
    for a,b,c in indices[f]:
        for x,y in [(a,b),(b,c),(c,a)]:
            key=tuple(sorted((int(x),int(y))));edges[key]=edges.get(key,0)+1
    closed=bool(len(edges)) and all(n==2 for n in edges.values()) and bool(valid.all())
    nz=normals[:,2];lower=nz<-.02;side=np.abs(nz)<=.02
    chosen=np.zeros(len(f),dtype=bool)
    if method in ('suspended','bottom-sides'):
        chosen=lower|side
        if method=='bottom-sides':
            _,axes=np.linalg.eigh(centered.T@centered);long_axis=axes[:,-1]
            chosen&=np.abs(normals@long_axis)<.999
    elif method=='sides':chosen=side
    elif method in ('wall-one-face','wall-two-faces') and side.any():
        # Principal wall faces: maximum-area orientation, explicit one/two-side method.
        normal=normals[np.argmax(np.where(side,area,0))]
        dot=normals@normal
        chosen=(dot>.999) if method=='wall-one-face' else (np.abs(dot)>.999)
    volume=float(abs(np.einsum('ij,ij->i',centered[f[:,0]],np.cross(centered[f[:,1]],centered[f[:,2]])).sum())/6)
    return {'totalArea':float(area.sum()),'lowerArea':float(area[lower].sum()),'sideArea':float(area[side].sum()),'slopeArea':float(area[(np.abs(nz)>.02)&(np.abs(nz)<.999)].sum()),'candidateArea':float(area[chosen].sum()) if method and closed else None,'volume':volume if closed else None,'closed':closed,'method':method,'unit':'m²','failures':[] if closed else ['Malha aberta, degenerada ou não manifold.'],'_triangles':tri,'_normals':normals,'_selected':chosen,'_bbox':(v.min(axis=0),v.max(axis=0))}

def measure_surfaces(element,method=None):
    settings=ifcopenshell.geom.settings();settings.set('use-world-coords',True)
    shape=ifcopenshell.geom.create_shape(settings,element)
    return measure_mesh(us.get_vertices(shape.geometry),us.get_faces(shape.geometry),method)
