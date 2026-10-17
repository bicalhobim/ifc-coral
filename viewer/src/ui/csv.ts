export function csvCell(value:string):string{
 const safe=/^[\s\u0000-\u001f]*[=+@-]/.test(value)?`'${value}`:value;
 return `"${safe.replace(/"/g,'""')}"`;
}
