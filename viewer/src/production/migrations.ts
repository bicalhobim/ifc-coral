/** Call only after validating schema 1. The caller validates the returned clone before replacing state. */
export function migrateV1(value:Record<string,unknown>){
 const next=structuredClone(value);next.schema=2;next.measures=[];next.resources=[];next.resourceAllocations=[];return next;
}
