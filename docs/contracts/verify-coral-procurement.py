"""Usage: python verify-coral-procurement.py exported.json [--schema]. Standard library hash check; optional jsonschema validation."""
import hashlib, json, math, struct, sys
from pathlib import Path

def canonical(value):
    def tree(v):
        if v is None: return ['null']
        if isinstance(v, str): return ['string', v]
        if isinstance(v, bool): return ['boolean', v]
        if isinstance(v, (int, float)):
            n=float(v)
            if not math.isfinite(n): raise ValueError('Non-finite number')
            return ['number', struct.pack('>d', 0.0 if n == 0 else n).hex()]
        if isinstance(v, list): return ['array', [tree(x) for x in v]]
        if isinstance(v, dict): return ['object', [[k, tree(v[k])] for k in sorted(v, key=lambda k:k.encode('utf-16-be', 'surrogatepass'))]]
        raise ValueError('Non-JSON type')
    return json.dumps(tree(value), ensure_ascii=True, separators=(',', ':'))

def digest(value): return hashlib.sha256(canonical(value).encode('ascii')).hexdigest()
def verify(bundle):
    assert bundle['format']=='ifc-coral-procurement' and bundle['schema_version']==1
    fingerprint=bundle['export']['payload_fingerprint']['value']
    payload=json.loads(json.dumps(bundle)); del payload['export']['payload_fingerprint']
    assert digest(payload)==fingerprint, 'Payload fingerprint mismatch'
    for row in bundle['demands']:
        body={k:v for k,v in row.items() if k!='fingerprint'}
        assert digest(body)==row['fingerprint']['value'], 'Demand fingerprint mismatch: '+row['id']
    return True
if __name__=='__main__':
    source=Path(sys.argv[1]); data=json.loads(source.read_text(encoding='utf-8-sig'))
    if '--schema' in sys.argv:
        import jsonschema
        schema=json.loads(Path(__file__).with_name('coral-procurement-1.schema.json').read_text(encoding='utf-8'))
        jsonschema.Draft202012Validator(schema,format_checker=jsonschema.FormatChecker()).validate(data)
    verify(data); print('OK: schema/hash' if '--schema' in sys.argv else 'OK: payload + demand hashes')
