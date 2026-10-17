import unittest
import numpy as np
from tools.quantification.tests.test_geometry import box
from tools.quantification.geometry import measure_mesh
from tools.quantification.contacts import deduct_contacts

class ContactTests(unittest.TestCase):
    def test_full_shared_face_and_partial_contact(self):
        a=measure_mesh(*box(2,2,1),'sides')
        b=measure_mesh(*box(2,2,1,(2,0,0)),'sides')
        self.assertAlmostEqual(deduct_contacts(a,[b],'sides')['deductedArea'],2)
        b=measure_mesh(*box(2,1,1,(2,0,0)),'sides')
        self.assertAlmostEqual(deduct_contacts(a,[b],'sides')['effectiveCandidateArea'],7)
    def test_wall_faces_and_pile_unknown(self):
        a=measure_mesh(*box(4,.2,3),'wall-two-faces')
        self.assertAlmostEqual(a['candidateArea'],24)
        a=measure_mesh(*box(4,.2,3),'wall-one-face')
        self.assertAlmostEqual(a['candidateArea'],12)
        self.assertIsNone(deduct_contacts(measure_mesh(*box(1,1,5),None),[],None)['effectiveCandidateArea'])
    def test_overlap_is_unresolved_not_false_zero_deduction(self):
        a=measure_mesh(*box(2,2,1),'sides');b=measure_mesh(*box(2,2,1,(1,0,0)),'sides')
        self.assertFalse(deduct_contacts(a,[b],'sides')['contactsResolved'])
    def test_partial_contact_translation_invariant(self):
        a=measure_mesh(*box(2,2,1,(700000,7800000,0)),'sides');b=measure_mesh(*box(2,1,1,(700002,7800000,0)),'sides')
        self.assertAlmostEqual(deduct_contacts(a,[b],'sides')['deductedArea'],1)
