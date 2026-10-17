import unittest
import numpy as np
from tools.quantification.geometry import measure_mesh, measure_surfaces

def box(x,y,z,offset=(0,0,0)):
    vertices=np.array([[0,0,0],[x,0,0],[x,y,0],[0,y,0],[0,0,z],[x,0,z],[x,y,z],[0,y,z]],float)+offset
    faces=np.array([[0,2,1],[0,3,2],[4,5,6],[4,6,7],[0,1,5],[0,5,4],[1,2,6],[1,6,5],[2,3,7],[2,7,6],[3,0,4],[3,4,7]])
    return vertices,faces

class GeometryTests(unittest.TestCase):
    def test_analytic_service_faces(self):
        for dims,method,expected in [((4,5,.1),'suspended',21.8),((4,.3,.6),'bottom-sides',6),((.4,.6,3),'sides',6)]:
            r=measure_mesh(*box(*dims),method)
            self.assertAlmostEqual(r['candidateArea'],expected)
            self.assertTrue(r['closed'])
        r=measure_mesh(*box(4,5,.1),'suspended');self.assertAlmostEqual(r['lowerArea'],20);self.assertAlmostEqual(r['sideArea'],1.8)
    def test_translation_rotation_and_incline(self):
        v,f=box(4,5,.1);a=.2;rot=np.array([[1,0,0],[0,np.cos(a),-np.sin(a)],[0,np.sin(a),np.cos(a)]])
        for move in [(0,0,0),(700000,7800000,900)]:
            r=measure_mesh(v@rot.T+move,f,'suspended')
            self.assertAlmostEqual(r['volume'],2,places=5)
            self.assertGreater(r['lowerArea'],19.99) # real 20m² underside, not its XY projection
    def test_open_mesh_and_missing_method_are_pending(self):
        v,f=box(1,1,1)
        self.assertFalse(measure_mesh(v,f[:-1],'suspended')['closed'])
        self.assertIsNone(measure_mesh(v,f,None)['candidateArea'])
    def test_hole_not_filled_by_bounding_box(self):
        # Four bars form a 4x4 annulus with a 2x2 opening; face area is 12, not 16.
        rows=[measure_mesh(*box(*d),'suspended') for d in [(4,1,.1),(4,1,.1),(1,2,.1),(1,2,.1)]]
        self.assertAlmostEqual(sum(r['lowerArea'] for r in rows),12)
