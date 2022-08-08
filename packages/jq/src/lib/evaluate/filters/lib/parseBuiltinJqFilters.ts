import { DefAst } from '../../../parser/AST';
import { parse } from '../../../parser/Parser';
import { JqEvaluateError } from '../../../errors';

export function parseBuiltinJqFilters(code: string): Record<string, DefAst> {
  const out: Record<string, DefAst> = {};
  let ast = parse(code).expr;
  while (ast) {
    if (ast.type !== 'def') {
      throw new JqEvaluateError('Could not parse the built-in jq filters');
    }
    out[ast.name] = ast;

    ast = ast.next;
  }

  return out;
}
