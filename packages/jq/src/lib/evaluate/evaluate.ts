import {
  DefAst,
  DestructuringAst,
  ExpressionAst,
  ForeachAst,
  ProgAst,
} from '../parser/AST';
import { combineIterators, evaluateBooleanOperator } from './applyBinary';
import {
  access,
  EvaluateInput,
  Input,
  isAtom,
  isTrue,
  many,
  Output,
  recursiveDescent,
  single,
  toString,
  Type,
  typeIsOneOf,
  typeOf,
} from './utils';
import { generateObjects } from './generateObjects';
import { generateCombinations } from './generateCombinations';
import { JqEvaluateError } from '../errors';
import { applyFormat } from './applyFormat';
import { builtinNativeFilters } from './filters/builtinNativeFilters';
import { Parser } from '../parser/Parser';
import { isNativeFilter, NativeFilter } from './filters/lib/nativeFilter';
import { notDefinedError, notImplementedError } from './evaluateErrors';
import { builtinJqFilters } from './filters/builtinJqFilters';

interface Var<T = any> {
  scope: Environment | null;
  value: T;
}

function cannotIterateError(value: any) {
  const preview = isAtom(value) ? ` "${value}"` : '';
  return new JqEvaluateError(`${typeOf(value)}${preview} is not iterable`);
}

function cannotSliceError(val: any) {
  return new JqEvaluateError(`Cannot slice ${typeOf(val)}`);
}

function invalidSliceIndicesError() {
  return new JqEvaluateError('Array slice indices must be numbers');
}

class BreakError extends JqEvaluateError {
  constructor(public readonly value: string) {
    super(`Label ${value} is not defined`);
  }
}

export function* evaluate(ast: ProgAst, input: EvaluateInput): Output {
  const env = new Environment();
  yield* env.evaluate(ast.expr, Array.isArray(input) ? many(input) : input);
}

class Environment {
  private readonly vars: Record<string, Var>;

  constructor(private parent: Environment | null = null) {
    this.vars = Object.create(this.parent ? this.parent.vars : null);
  }

  extend() {
    return new Environment(this);
  }

  getVar(name: string): Var {
    if (name in this.vars) return this.vars[name];
    if (name in builtinJqFilters)
      return { scope: null, value: builtinJqFilters[name] };
    if (name in builtinNativeFilters)
      return { scope: null, value: builtinNativeFilters[name] };
    throw notDefinedError(name);
  }

  setVar(name: string, value: any, scope: Environment = this) {
    this.vars[name] = { scope, value };
  }

  getVarValue(name: string) {
    return this.getVar(name).value;
  }

  evaluateConditions(ast: ExpressionAst, input: Input) {
    return Array.from(this.evaluate(ast, input)).map(isTrue);
  }

  *evaluateForeach(ast: ForeachAst, input: Input, reduceMode = false): Output {
    for (const inputItem of input) {
      let first = true;
      const memorizedStepItems: Output[] = [];
      for (const initialValue of this.evaluate(ast.init, single(inputItem))) {
        let res = initialValue;
        const stepItems = first
          ? this.evaluate(ast.expr, single(inputItem))
          : memorizedStepItems;
        for (const stepItem of stepItems) {
          const scope = this.extend();
          scope.setVar(ast.var, stepItem);
          let empty = true;
          for (const update of scope.evaluate(ast.update, single(res))) {
            empty = false;
            res = update;
            if (!reduceMode) {
              if (ast.extract) {
                yield* scope.evaluate(ast.extract, single(update));
              } else {
                yield update;
              }
            }
          }
          if (empty) res = null;

          if (first) memorizedStepItems.push(stepItem);
        }
        first = false;
        if (reduceMode) yield res;
      }
    }
  }

  *evaluate(ast: ExpressionAst | undefined, input: Input): Output {
    if (ast === undefined) {
      yield* input;
      return;
    }

    switch (ast.type) {
      case 'identity':
        yield* input;
        break;
      case 'binary':
        if (ast.type === 'binary' && ast.operator === '|') {
          yield* this.evaluate(ast.right, this.evaluate(ast.left, input));
          break;
        }
        for (const item of input) {
          const left = this.evaluate(ast.left, single(item));
          const right = this.evaluate(ast.right, single(item));
          if (ast.operator === ',') {
            yield* left;
            yield* right;
          } else if (ast.operator === 'or' || ast.operator === 'and') {
            yield* evaluateBooleanOperator(ast.operator, left, right);
          } else {
            yield* combineIterators(ast.operator, left, right);
          }
        }
        break;
      case 'def': {
        const scope = this.extend();
        scope.setVar(ast.name, ast);
        yield* scope.evaluate(ast.next, input);
        break;
      }
      case 'str':
        for (const item of input) {
          if (ast.interpolated) {
            const parts = ast.parts
              .map((part) =>
                typeof part === 'string'
                  ? [part]
                  : Array.from(this.evaluate(part, single(item))).map((val) =>
                      applyFormat(ast.format, toString(val))
                    )
              )
              .reverse();
            for (const combination of generateCombinations(parts)) {
              yield combination.reverse().join('');
            }
          } else {
            yield ast.value;
          }
        }
        break;
      case 'num':
      case 'bool':
      case 'null':
        for (const item of input) {
          yield ast.value;
        }
        break;
      case 'format':
        for (const item of input) {
          yield applyFormat(ast, toString(item));
        }
        break;
      case 'filter':
        for (const item of input) {
          const arity = Parser.getFilterArity(ast.name);
          const def: Var<DefAst | NativeFilter> = this.getVar(ast.name);

          if (isNativeFilter(def.value)) {
            const argSets: any[][] = [];
            for (let i = 0; i < arity; i++) {
              const argExprAst = ast.args[i];
              argSets.push(Array.from(this.evaluate(argExprAst, single(item))));
            }
            for (const combination of generateCombinations(argSets)) {
              yield* def.value(item, ...combination);
            }
          } else {
            const argSets: ([ExpressionAst] | any[])[] = [];
            for (let i = 0; i < arity; i++) {
              const argDefAst = def.value.args[i];
              const argExprAst = ast.args[i];
              switch (argDefAst.type) {
                case 'varArg':
                  argSets.push(
                    Array.from(this.evaluate(argExprAst, single(item)))
                  );
                  break;
                case 'filterArg':
                  const def: DefAst = {
                    type: 'def',
                    name: argDefAst.name,
                    args: [],
                    body: argExprAst,
                  };
                  argSets.push([def]);
                  break;
              }
            }
            for (const combination of generateCombinations(argSets)) {
              const scope = def.scope?.extend() ?? new Environment();
              for (let i = 0; i < arity; i++) {
                const argDefAst = def.value.args[i];
                scope.setVar(argDefAst.name, combination[i], this);
              }
              yield* scope.evaluate(def.value.body, single(item));
            }
          }
        }
        break;
      case 'if':
        for (const item of input) {
          const condResults: boolean[][] = [
            this.evaluateConditions(ast.cond, single(item)),
          ];
          const expressions = [ast.then];

          if (condResults[0].includes(false) && ast.elifs) {
            for (const elif of ast.elifs) {
              condResults.push(
                this.evaluateConditions(elif.cond, single(item))
              );
              expressions.push(elif.then);
              if (!condResults[condResults.length - 1].includes(false)) break;
            }
          }
          if (ast.else) expressions.push(ast.else);

          const exprResults: any[][] = [];
          const getExprResult = (i: number) => {
            if (!expressions[i]) return [];
            if (!exprResults[i]) {
              exprResults[i] = Array.from(
                this.evaluate(expressions[i], single(item))
              );
            }
            return exprResults[i];
          };

          function* generateBlock(i: number): IterableIterator<any> {
            if (condResults[i]) {
              for (const condRes of condResults[i]) {
                if (condRes) {
                  yield* getExprResult(i);
                } else {
                  yield* generateBlock(i + 1);
                }
              }
            } else {
              yield* getExprResult(i);
            }
          }

          yield* generateBlock(0);
        }
        break;
      case 'try':
        for (const item of input) {
          try {
            for (const val of this.evaluate(ast.body, single(item))) {
              yield val;
            }
          } catch (e: any) {
            if (e instanceof BreakError) throw e;
            if (ast.catch) yield* this.evaluate(ast.catch, single(e.message));
          }
        }
        break;
      case 'reduce':
        yield* this.evaluateForeach({ ...ast, type: 'foreach' }, input, true);
        break;
      case 'var':
        for (const item of input) {
          yield this.getVarValue(ast.name);
        }
        break;
      case 'varDeclaration':
        for (const item of input) {
          for (const val of this.evaluate(ast.expr, single(item))) {
            const allVarNames = new Set(
              Environment.extractVariableNames(ast.destructuring)
            );
            for (let i = 0; i < ast.destructuring.length; i++) {
              const destructuring = ast.destructuring[i];
              try {
                for (const vars of this.destructureValue(val, destructuring)) {
                  const scope = this.extend();
                  for (const varName of allVarNames) {
                    scope.setVar(varName, null);
                  }
                  for (const [varName, varValue] of Object.entries(vars)) {
                    scope.setVar(varName, varValue);
                  }
                  yield* scope.evaluate(ast.next, single(item));
                }
                break;
              } catch (e) {
                if (i + 1 >= ast.destructuring.length) {
                  throw e;
                }
              }
            }
          }
        }
        break;
      case 'foreach':
        yield* this.evaluateForeach(ast, input);
        break;
      case 'label':
        try {
          yield* this.evaluate(ast.next, input);
        } catch (e) {
          if (e instanceof BreakError) {
            if (e.value !== ast.value) throw e;
            break;
          } else {
            throw e;
          }
        }
        break;
      case 'break':
        throw new BreakError(ast.value);
      case 'unary':
        const { operator, type } = ast;
        if (ast.operator === '-') {
          for (const item of input) {
            for (const val of this.evaluate(ast.expr, single(item))) {
              yield -val;
            }
          }
          break;
        }

        throw notImplementedError(`${type}:${operator}`);
      case 'index':
        for (const item of input) {
          for (const val of this.evaluate(ast.expr, single(item))) {
            if (typeof ast.index === 'string') {
              yield access(val, ast.index);
            } else {
              for (const index of this.evaluate(ast.index, single(item))) {
                yield access(val, index);
              }
            }
          }
        }
        break;
      case 'slice':
        for (const item of input) {
          const fromItems = ast.from
            ? Array.from(this.evaluate(ast.from, single(item)))
            : [undefined];
          const toItems = ast.to
            ? Array.from(this.evaluate(ast.to, single(item)))
            : [undefined];
          for (const val of this.evaluate(ast.expr, single(item))) {
            if (!typeIsOneOf(val, Type.array, Type.string)) {
              throw cannotSliceError(val);
            }
            for (const from of fromItems) {
              if (from !== undefined && typeOf(from) !== Type.number) {
                throw invalidSliceIndicesError();
              }
              for (const to of toItems) {
                if (to !== undefined && typeOf(to) !== Type.number) {
                  throw invalidSliceIndicesError();
                }
                yield val.slice(from, to);
              }
            }
          }
        }
        break;
      case 'iterator':
        for (const item of input) {
          for (const val of this.evaluate(ast.expr, single(item))) {
            switch (typeOf(val)) {
              case 'array':
                yield* val;
                break;
              case 'object':
                yield* Object.values(val);
                break;
              default:
                throw cannotIterateError(val);
            }
          }
        }
        break;
      case 'array':
        for (const item of input) {
          if (ast.expr) {
            yield Array.from(this.evaluate(ast.expr, single(item)));
          } else {
            yield [];
          }
        }
        break;
      case 'object':
        for (const item of input) {
          yield* generateObjects(
            ast.entries.map(({ key, value }) => {
              return [
                typeof key === 'string'
                  ? [key]
                  : Array.from(this.evaluate(key, single(item))),
                value === undefined
                  ? [item[key]]
                  : Array.from(this.evaluate(value, single(item))),
              ];
            })
          );
        }
        break;
      case 'recursiveDescent':
        for (const item of input) {
          yield* recursiveDescent(item);
        }
        break;
    }
  }

  static *extractVariableNames(
    destructurings: DestructuringAst[]
  ): IterableIterator<string> {
    for (const destructuring of destructurings) {
      switch (destructuring.type) {
        case 'var':
          yield destructuring.name;
          break;
        case 'arrayDestructuring': {
          for (const item of destructuring.destructuring) {
            yield* Environment.extractVariableNames([item]);
          }
          break;
        }
        case 'objectDestructuring':
          for (const entry of destructuring.entries) {
            if (entry.destructuring) {
              yield* Environment.extractVariableNames([entry.destructuring]);
            } else {
              yield entry.key.name;
            }
          }
          break;
      }
    }
  }

  *destructureValue(
    val: any,
    destructuring: DestructuringAst
  ): IterableIterator<Record<string, any>> {
    switch (destructuring.type) {
      case 'var':
        yield { [destructuring.name]: val };
        break;
      case 'arrayDestructuring': {
        if (typeOf(val) !== 'array') {
          throw new JqEvaluateError(
            `${typeOf(val)} cannot be destructured as an array`
          );
        }
        const results = destructuring.destructuring.map((item, i) =>
          Array.from(
            this.destructureValue(val[i], destructuring.destructuring[i])
          )
        );
        for (const combination of generateCombinations(results)) {
          yield Object.assign({}, ...combination);
        }
        break;
      }
      case 'objectDestructuring':
        if (typeOf(val) !== 'object') {
          throw new JqEvaluateError(
            `${typeOf(val)} cannot be destructured as an object`
          );
        }

        const results = destructuring.entries.map((entry) => {
          if (entry.destructuring) {
            if (typeof entry.key === 'string') {
              return Array.from(
                this.destructureValue(val[entry.key], entry.destructuring)
              );
            } else {
              const keys = Array.from(this.evaluate(entry.key, single(val)));
              return keys
                .map((key) =>
                  Array.from(
                    this.destructureValue(val[key], entry.destructuring)
                  )
                )
                .flat();
            }
          } else {
            const varName = entry.key.name;
            // Remove the initial $ sign to get the key
            const key = entry.key.name.substring(1);
            const varValue = val[key];

            return [{ [varName]: varValue }];
          }
        });

        for (const combination of generateCombinations(results)) {
          yield Object.assign({}, ...combination.reverse());
        }
        break;
    }
  }
}
