import { parse } from '../parser/Parser';
import { print } from '../print/print';

export const format = (code: string): string => {
  return print(parse(code));
};
