import type {ElementMetadata,QuantRule,ClassificationResult} from './types.ts';
export function classifyElement(metadata:ElementMetadata,rules:QuantRule[],override?:{ruleId:string;author:string;reason:string}):ClassificationResult{
 const pending=(reason:string):ClassificationResult=>({status:'pending',rule:null,reason});
 if(!metadata.globalId||/TYPE$/i.test(metadata.ifcClass))return pending('Não é ocorrência física identificada.');
 if(override){const rule=rules.find(r=>r.id===override.ruleId);if(!rule||!override.author.trim()||!override.reason.trim())throw new Error('Substituição exige regra, autor e motivo.');return {status:'matched',rule:structuredClone(rule),reason:'Substituição explícita',override:{author:override.author,reason:override.reason}};}
 const matches=rules.filter(r=>r.ifcClass.toUpperCase()===metadata.ifcClass.toUpperCase()&&(!r.predefinedType||r.predefinedType.toUpperCase()===metadata.predefinedType.toUpperCase())&&(!r.typePattern||new RegExp(r.typePattern,'i').test(metadata.typeName))).sort((a,b)=>b.priority-a.priority);
 if(!matches.length)return pending('Função construtiva sem regra confirmada.');
 if(matches[1]?.priority===matches[0].priority)return pending('Conflito entre regras de mesma precedência.');
 return {status:'matched',rule:structuredClone(matches[0]),reason:'Regra candidata do catálogo'};
}
