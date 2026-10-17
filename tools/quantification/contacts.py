"""Conservative contact deductions: coplanar opposing triangles; solid overlaps need review.

Tolerance 1e-5 m (0.01 mm) established by exact/translated box fixtures in SI.
Coplanar intersections are unioned per target face so triangulation never doubles deductions.
Penetrations are deliberately unresolved; no boolean-volume heuristic silently approves them.
"""
import numpy as np
from shapely.geometry import Polygon
from shapely.ops import unary_union
TOLERANCE=1e-5

def deduct_contacts(surface,neighbours,method):
    candidate=surface['candidateArea'];pending=list(surface['failures']);evidence=[];deducted=0.
    if not method:pending.append('Confirmar método executivo.')
    eligible=[]
    for n in neighbours:
        lo=np.maximum(surface['_bbox'][0],n['_bbox'][0]);hi=np.minimum(surface['_bbox'][1],n['_bbox'][1]);span=hi-lo
        if np.any(span < -TOLERANCE):continue
        eligible.append(n)
        if np.all(span>TOLERANCE):pending.append('Interpenetração ou sobreposição espacial exige conferência de faces.')
        if not n['closed']:pending.append('Vizinho com geometria não fechada.')
    for index,(tri,normal,selected) in enumerate(zip(surface['_triangles'],surface['_normals'],surface['_selected'])):
        if not selected:continue
        origin=tri[0];u=tri[1]-origin;u=u/np.linalg.norm(u);w=np.cross(normal,u)
        project=lambda pts:np.column_stack(((pts-origin)@u,(pts-origin)@w))
        target=Polygon(project(tri));cuts=[]
        for n in eligible:
            opposite=np.where((n['_normals']@normal)<-.999999)[0]
            for j in opposite:
                other=n['_triangles'][j]
                if np.max(np.abs((other-origin)@normal))>TOLERANCE:continue
                part=target.intersection(Polygon(project(other)))
                if not part.is_empty and part.area>TOLERANCE*TOLERANCE:cuts.append(part)
        if cuts:
            area=float(unary_union(cuts).area);deducted+=area;evidence.append({'face':index,'deductedArea':area})
    resolved=not pending and candidate is not None
    return {'grossArea':candidate,'deductedArea':deducted,'effectiveCandidateArea':max(0,candidate-deducted) if resolved else None,'contactsResolved':resolved,'method':method,'toleranceM':TOLERANCE,'faceEvidence':evidence,'pendingReasons':sorted(set(pending))}
