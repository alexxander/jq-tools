import { FormatAst } from '../parser/AST';
import { notDefinedError, notImplementedError } from './evaluateErrors';

const formats: Record<string, (val: string) => string> = {
  '@text'(val: string) {
    throw notImplementedError('@text');
  },
  '@json'(val: string) {
    throw notImplementedError('@json');
  },
  '@html'(val: string) {
    throw notImplementedError('@html');
  },
  '@uri'(val: string) {
    throw notImplementedError('@uri');
  },
  '@csv'(val: string) {
    throw notImplementedError('@csv');
  },
  '@tsv'(val: string) {
    throw notImplementedError('@tsv');
  },
  '@sh'(val: string) {
    throw notImplementedError('@sh');
  },
  '@base64'(val: string) {
    return btoa(val);
  },
  '@base64d'(val: string) {
    return atob(val);
  },
};

export function applyFormat(format: FormatAst | undefined, val: string) {
  if (format === undefined) return val;
  if (!formats[format.name]) throw notDefinedError(format.name);
  return formats[format.name](val);
}
