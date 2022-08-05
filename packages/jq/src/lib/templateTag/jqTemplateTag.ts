import { parse } from '../parser/Parser';
import { evaluate } from '../evaluate/evaluate';
import { EvaluateInput, Output } from '../evaluate/utils';

type JqFilterFunc<In = any, Out = unknown> = (
  input: EvaluateInput<In>
) => Output<Out>;

export function jqTemplateTag<In = any, Out = unknown>(
  strings: TemplateStringsArray
): JqFilterFunc<In, Out> {
  const code = strings.join('');
  const ast = parse(code);
  return (input: any) => evaluate(ast, input);
}
