import { parse } from '../parser/Parser';
import { evaluate } from '../evaluate/evaluate';
import { EvaluateInput, EvaluateOutput } from '../evaluate/utils/utils';

type JqFilterFunc<In = any, Out = unknown> = (
  input: EvaluateInput<In>
) => EvaluateOutput<Out>;

export function jqTemplateTag<In = any, Out = unknown>(
  strings: TemplateStringsArray
): JqFilterFunc<In, Out> {
  const code = strings.join('');
  const ast = parse(code);
  return (input: any) => evaluate(ast, input);
}
