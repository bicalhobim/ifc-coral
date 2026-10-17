import unittest
import ifcopenshell
from tools.quantification.model_audit import declared_volume

class AuditTests(unittest.TestCase):
    def test_explicit_units_conflicts_and_unknown_project_units(self):
        f=ifcopenshell.file(schema='IFC4');slab=f.create_entity('IfcSlab',GlobalId=ifcopenshell.guid.new())
        mm=f.create_entity('IfcSIUnit',UnitType='VOLUMEUNIT',Prefix='MILLI',Name='CUBIC_METRE')
        a=f.create_entity('IfcQuantityVolume',Name='NetVolume',VolumeValue=1000000000.,Unit=mm)
        q=f.create_entity('IfcElementQuantity',GlobalId=ifcopenshell.guid.new(),Name='Qto',Quantities=[a])
        f.create_entity('IfcRelDefinesByProperties',GlobalId=ifcopenshell.guid.new(),RelatedObjects=[slab],RelatingPropertyDefinition=q)
        self.assertEqual(declared_volume(slab,None),1.)
        a.Unit=None;self.assertIsNone(declared_volume(slab,None))
        a.Unit=mm;b=f.create_entity('IfcQuantityVolume',Name='NetVolume',VolumeValue=2.,Unit=f.create_entity('IfcSIUnit',UnitType='VOLUMEUNIT',Name='CUBIC_METRE'));q.Quantities=[a,b]
        self.assertIsNone(declared_volume(slab,None))
