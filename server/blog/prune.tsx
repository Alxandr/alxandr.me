// taken from: https://github.com/esamattis/underscore.string/blob/master/prune.js
export const prune = (str: string, length: number, pruneStr: string = '...') => {
  length = ~~length;
  if (str.length <= length) return str;

  const tmpl = (c: string) => (c.toUpperCase() !== c.toLowerCase() ? 'A' : ' ');
  let template = str.slice(0, length + 1).replace(/.(?=\W*\w*$)/g, tmpl); // 'Hello, world' -> 'HellAA AAAAA'

  if (template.slice(template.length - 2).match(/\w\w/)) template = template.replace(/\s*\S+$/, '');
  else template = template.slice(0, template.length - 1).trimRight();

  return (template + pruneStr).length > str.length ? str : str.slice(0, template.length) + pruneStr;
};
