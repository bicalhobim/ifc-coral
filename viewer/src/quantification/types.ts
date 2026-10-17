export type ServiceCode='concrete'|'reinforcement'|'formwork';
export type MeasureUnit='m³'|'kg'|'m²';
export type ElementMetadata={modelId:string;modelHash:string;globalId:string;ifcClass:string;predefinedType:string;typeName:string;properties:Record<string,unknown>};
export type QuantRule={id:string;version:string;label:string;ifcClass:string;predefinedType?:string;typePattern?:string;priority:number;steelRate:number|null;formMethod:string|null;source:string;status:'draft'};
export type ClassificationResult={status:'matched'|'pending';rule:QuantRule|null;reason:string;override?:{author:string;reason:string}};
export type MeasureResult={id:string;elementRef:ElementMetadata;serviceCode:ServiceCode;ruleId:string;ruleVersion:string;ruleSnapshot:QuantRule;inputs:Record<string,unknown>;amount:number|null;unit:MeasureUnit;origin:'declared'|'geometric'|'estimated';status:'draft'|'pending';pendingReasons:string[];evidence:string[]};
export type MeasureInput={element:ElementMetadata;volume?:{amount:number|null;unit:string;source:string};geometry?:{candidateArea:number|null;deductedArea:number|null;contactsResolved:boolean;source:string;method:string}};
