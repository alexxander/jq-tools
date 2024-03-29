import {
  DefAst,
  DestructuringAst,
  ExpressionAst,
  ForeachAst,
  ProgAst,
} from '../parser/AST';
import {
  evaluateAlternativeOperator,
  evaluateArithmeticUpdateAssignment,
  evaluateBooleanOperator,
  evaluateNormalBinaryOperator,
  evaluateSimpleAssignment,
} from './applyBinary';
import {
  access,
  collectValues,
  createItem,
  createSliceAccessor,
  deepClone,
  EvaluateInput,
  EvaluateOutput,
  generateItems,
  generatePaths,
  generateValues,
  isAtom,
  isTrue,
  Item,
  ItemIterator,
  recursiveDescent,
  single,
  toString,
  Type,
  typeIsOneOf,
  typeOf,
} from './utils/utils';
import { generateObjects } from './generateObjects';
import { generateCombinations } from './generateCombinations';
import { JqEvaluateError } from '../errors';
import { applyFormat } from './applyFormat';
import { builtinNativeFilters } from './filters/builtinNativeFilters';
import { Parser } from '../parser/Parser';
import { isNativeFilter, NativeFilter } from './filters/lib/nativeFilter';
import {
  cannotSliceError,
  notDefinedError,
  notImplementedError,
} from './evaluateErrors';
import { builtinJqFilters } from './filters/builtinJqFilters';
import { setPath } from './utils/setPath';
import {
  BinaryOperatorType,
  isBinaryOperatorType,
} from './utils/binaryOperator';
import { getPath } from './utils/getPath';

interface Var<T = any> {
  scope: Environment | null;
  value: T;
}

function cannotIterateError(value: any) {
  const preview = isAtom(value) ? ` "${value}"` : '';
  return new JqEvaluateError(`${typeOf(value)}${preview} is not iterable`);
}

function invalidSliceIndicesError() {
  return new JqEvaluateError('Array slice indices must be numbers');
}

class BreakError extends JqEvaluateError {
  constructor(public readonly value: string) {
    super(`Label ${value} is not defined`);
  }
}

export function* evaluate(ast: ProgAst, input: EvaluateInput): EvaluateOutput {
  const env = new Environment();
  yield* generateValues(env.evaluate(ast.expr, generateItems(input)));
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

  evaluateConditions(ast: ExpressionAst, input: ItemIterator) {
    return Array.from(this.evaluate(ast, input)).map((item) =>
      isTrue(item.value)
    );
  }

  *evaluateForeach(
    ast: ForeachAst,
    input: ItemIterator,
    reduceMode = false
  ): ItemIterator {
    for (const inputItem of input) {
      let first = true;
      const memorizedStepItems: Item[] = [];
      for (const initialValue of this.evaluate(ast.init, single(inputItem))) {
        let res = initialValue;
        const stepItems = first
          ? this.evaluate(ast.expr, single(inputItem))
          : memorizedStepItems;
        for (const stepItem of stepItems) {
          const scope = this.extend();
          scope.setVar(ast.var, stepItem.value);
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
          if (empty) res = createItem(null);

          if (first) memorizedStepItems.push(stepItem);
        }
        first = false;
        if (reduceMode) yield res;
      }
    }
  }

  *evaluate(ast: ExpressionAst | undefined, input: ItemIterator): ItemIterator {
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
          if (isBinaryOperatorType(ast.operator, BinaryOperatorType.comma)) {
            yield* left;
            yield* right;
          } else if (
            isBinaryOperatorType(ast.operator, BinaryOperatorType.normal)
          ) {
            yield* evaluateNormalBinaryOperator(ast.operator, left, right);
          } else if (
            isBinaryOperatorType(ast.operator, BinaryOperatorType.boolean)
          ) {
            yield* evaluateBooleanOperator(ast.operator, left, right);
          } else if (
            isBinaryOperatorType(ast.operator, BinaryOperatorType.alternative)
          ) {
            yield* evaluateAlternativeOperator(left, right);
          } else if (
            isBinaryOperatorType(ast.operator, BinaryOperatorType.assignment)
          ) {
            if (ast.operator === '|=') {
              let out = item.value;
              for (const path of generatePaths(left)) {
                let newValue = undefined;
                for (const valItem of this.evaluate(
                  ast.right,
                  single(createItem(getPath(item.value, path)))
                )) {
                  newValue = deepClone(valItem.value);
                  break;
                }
                out = setPath(out, path, newValue);
              }
              yield createItem(out);
            } else if (ast.operator === '=') {
              yield* evaluateSimpleAssignment(item, left, right);
            } else {
              yield* evaluateArithmeticUpdateAssignment(
                ast.operator,
                item,
                left,
                right
              );
            }
          } else {
            throw new JqEvaluateError(`Unexpected operator ${ast.operator}`);
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
        for (const inputItem of input) {
          if (ast.interpolated) {
            const parts = ast.parts
              .map((part) =>
                typeof part === 'string'
                  ? [part]
                  : Array.from(this.evaluate(part, single(inputItem))).map(
                      (item) => applyFormat(ast.format, toString(item.value))
                    )
              )
              .reverse();
            for (const combination of generateCombinations(parts)) {
              yield createItem(combination.reverse().join(''));
            }
          } else {
            yield createItem(ast.value);
          }
        }
        break;
      case 'num':
      case 'bool':
      case 'null':
        for (const item of input) {
          yield createItem(ast.value);
        }
        break;
      case 'format':
        for (const item of input) {
          yield createItem(applyFormat(ast, toString(item.value)));
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
              argSets.push(
                Array.from(
                  this.evaluate(argExprAst, single(createItem(item.value)))
                )
              );
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
                    collectValues(this.evaluate(argExprAst, single(item)))
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

          const exprResults: Item[][] = [];
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
            if (ast.catch) {
              yield* this.evaluate(ast.catch, single(createItem(e.message)));
            }
          }
        }
        break;
      case 'reduce':
        yield* this.evaluateForeach({ ...ast, type: 'foreach' }, input, true);
        break;
      case 'var':
        for (const item of input) {
          yield createItem(this.getVarValue(ast.name));
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
                for (const vars of this.destructureValue(
                  val.value,
                  destructuring
                )) {
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
              yield createItem(-val.value);
            }
          }
          break;
        }

        throw notImplementedError(`${type}:${operator}`);
      case 'index':
        for (const item of input) {
          for (const val of this.evaluate(ast.expr, single(item))) {
            if (typeof ast.index === 'string') {
              yield createItem(access(val.value, ast.index), [
                ...val.path,
                ast.index,
              ]);
            } else {
              for (const index of this.evaluate(ast.index, single(item))) {
                yield createItem(access(val.value, index.value), [
                  ...val.path,
                  index.value,
                ]);
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
            if (!typeIsOneOf(val.value, Type.array, Type.string, Type.null)) {
              throw cannotSliceError(val.value);
            }
            for (const from of fromItems) {
              if (from !== undefined && typeOf(from.value) !== Type.number) {
                throw invalidSliceIndicesError();
              }
              for (const to of toItems) {
                if (to !== undefined && typeOf(to.value) !== Type.number) {
                  throw invalidSliceIndicesError();
                }
                const accessor = createSliceAccessor(
                  from?.value ?? null,
                  to?.value ?? null
                );
                yield createItem(access(val.value, accessor), [
                  ...val.path,
                  accessor,
                ]);
              }
            }
          }
        }
        break;
      case 'iterator':
        for (const item of input) {
          for (const val of this.evaluate(ast.expr, single(item))) {
            switch (typeOf(val.value)) {
              case 'array':
                for (let i = 0; i < val.value.length; i++) {
                  yield createItem(val.value[i], [...val.path, i]);
                }
                break;
              case 'object':
                for (const [key, value] of Object.entries(val.value)) {
                  yield createItem(value, [...val.path, key]);
                }
                break;
              default:
                throw cannotIterateError(val.value);
            }
          }
        }
        break;
      case 'array':
        for (const item of input) {
          if (ast.expr) {
            yield createItem(
              collectValues(this.evaluate(ast.expr, single(item)))
            );
          } else {
            yield createItem([]);
          }
        }
        break;
      case 'object':
        for (const item of input) {
          yield* generateItems(
            generateObjects(
              ast.entries.map(({ key, value }) => {
                return [
                  typeof key === 'string'
                    ? [key]
                    : collectValues(this.evaluate(key, single(item))),
                  value === undefined
                    ? [item.value[key]]
                    : collectValues(this.evaluate(value, single(item))),
                ];
              })
            )
          );
        }
        break;
      case 'recursiveDescent':
        for (const item of input) {
          yield* generateItems(recursiveDescent(item.value));
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
              const keys = collectValues(
                this.evaluate(entry.key, single(createItem(val)))
              );
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
