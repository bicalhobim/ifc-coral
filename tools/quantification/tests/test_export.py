import unittest, tempfile, hashlib
from pathlib import Path
import ifcopenshell
import ifcopenshell.util.element as ue
from tools.quantification.export_ifc import write_derivative

class ExportTests(unittest.TestCase):
    def test_real_model_guid_qto_representation_and_units_preserved(self):
        source=Path(__file__).resolve().parents[3]/'ifc_model/TORRE02_ESTRUTURA_4D.ifc'
        digest=hashlib.sha256(source.read_bytes()).hexdigest();f=ifcopenshell.open(source)
        e=f.by_type('IfcSlab')[0];row={'globalId':e.GlobalId,'steelRate':60.,'steelMass':10.,'candidateArea':1.,'effectiveCandidateArea':None,'ruleId':'slab','ruleVersion':'1.0.0'}
        with tempfile.TemporaryDirectory() as tmp:
            target=Path(tmp)/'derivative.ifc';write_derivative(source,[row],target);g=ifcopenshell.open(target)
            self.assertEqual({x.GlobalId for x in f.by_type('IfcElement')},{x.GlobalId for x in g.by_type('IfcElement')})
            self.assertEqual(len(g.by_type('IfcElement')),764)
            for before in f.by_type('IfcElement'):
                after=g.by_guid(before.GlobalId)
                self.assertEqual(ue.get_psets(before,qtos_only=True),ue.get_psets(after,qtos_only=True))
                self.assertEqual(str(before.Representation),str(after.Representation))
            p=ue.get_psets(g.by_guid(e.GlobalId))['Coral_Quantification']
            self.assertFalse(p['HumanApproved']);self.assertEqual(p['SteelMass'],10.)
            pset=next(x.RelatingPropertyDefinition for x in g.by_guid(e.GlobalId).IsDefinedBy if x.is_a('IfcRelDefinesByProperties') and x.RelatingPropertyDefinition.Name=='Coral_Quantification')
            units={x.Name:x.Unit for x in pset.HasProperties}
            self.assertEqual(units['SteelMass'].UnitType,'MASSUNIT');self.assertEqual(units['CandidateArea'].UnitType,'AREAUNIT')
            self.assertTrue(units['SteelRate'].is_a('IfcDerivedUnit'));self.assertFalse(g.by_type('IfcReinforcingBar'))
        self.assertEqual(hashlib.sha256(source.read_bytes()).hexdigest(),digest)
        self.assertEqual(digest,'885c3b3ace554f9e3091d611645cccac875a583241d5971c57703bb4a36030dc')
