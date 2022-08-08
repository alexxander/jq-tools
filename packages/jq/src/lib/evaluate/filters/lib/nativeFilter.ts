import { DefAst } from '../../../parser/AST';
import { Output } from '../../utils';

export type NativeFilter = (input: any, ...args: any[]) => Output;

export function isNativeFilter(
  val: DefAst | NativeFilter
): val is NativeFilter {
  return typeof val === 'function';
}
