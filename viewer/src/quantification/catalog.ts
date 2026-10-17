import type {QuantRule} from './types.ts';
const source='Cenário didático proposto; Jablonski/UNIPAMPA (2013), tabela 2. Não é taxa NBR nem dimensionamento.';
const rule=(id:string,label:string,ifcClass:string,steelRate:number|null,formMethod:string|null,extra:Partial<QuantRule>={}):QuantRule=>({id,label,ifcClass,steelRate,formMethod,version:'1.0.0',priority:10,source,status:'draft',...extra});
export const catalog:QuantRule[]=[
 rule('base-slab','Laje de fundação','IFCSLAB',null,null,{predefinedType:'BASESLAB',priority:100}),
 rule('slab','Laje suspensa','IFCSLAB',60,'suspended',{predefinedType:'FLOOR',priority:50}),
 rule('beam','Viga','IFCBEAM',85,'bottom-sides'),
 rule('column','Pilar','IFCCOLUMN',120,'sides'),
 rule('block','Bloco de fundação','IFCFOOTING',null,null,{typePattern:'^Bloco',priority:100}),
 rule('pile','Estaca','IFCFOOTING',null,null,{typePattern:'^Estaca de concreto',priority:100}),
 rule('pile-native','Estaca','IFCPILE',null,null),
 rule('retaining-wall','Parede de contenção','IFCWALL',null,null),
];
