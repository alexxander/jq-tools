import {
  ArgAst,
  ArrayAst,
  ArrayDestructuringAst,
  AtomAst,
  BinaryAst,
  BoolAst,
  BreakAst,
  DefAst,
  DestructuringAst,
  ExpressionAst,
  FilterArgAst,
  FilterAst,
  ForeachAst,
  FormatAst,
  IdentityAst,
  IfAst,
  IndexAst,
  IteratorAst,
  LabelAst,
  NullAst,
  NumAst,
  ObjectAst,
  ObjectDestructuringAst,
  ObjectDestructuringEntryAst,
  ObjectEntryAst,
  ProgAst,
  RecursiveDescentAst,
  ReduceAst,
  SliceAst,
  StrAst,
  TryAst,
  UnaryAst,
  VarArgAst,
  VarAst,
  VarDeclarationAst,
} from '../parser/AST';
import { Parser } from '../parser/Parser';

export function print(ast: ProgAst): string {
  return new Print().root(ast);
}

class Print {
  root(ast: ProgAst) {
    if (!ast.expr) return '';
    return this.expression(ast.expr);
  }
  def(ast: DefAst) {
    return `def ${ast.name}${
      ast.args.length > 0
        ? this.delimited(
            '(',
            ')',
            '; ',
            ast.args,
            (item) => this.arg(item),
            false
          )
        : ''
    }: ${this.expression(ast.body)}; ${this.expression(ast.next)}`;
  }
  filterArg(ast: FilterArgAst) {
    return ast.name;
  }
  varArg(ast: VarArgAst) {
    return ast.name;
  }
  identity(ast: IdentityAst) {
    return '.';
  }
  num(ast: NumAst) {
    return JSON.stringify(ast.value);
  }
  str(ast: StrAst): string {
    if (ast.interpolated) {
      return (
        '"' +
        ast.parts
          .map((item) => {
            if (typeof item === 'string') {
              const str = JSON.stringify(item);
              return str.substring(1, str.length - 1);
            } else {
              return `\\(${this.expression(item)})`;
            }
          })
          .join('') +
        '"'
      );
    } else {
      return JSON.stringify(ast.value);
    }
  }
  bool(ast: BoolAst) {
    return JSON.stringify(ast.value);
  }
  null(ast: NullAst) {
    return JSON.stringify(ast.value);
  }
  format(ast: FormatAst) {
    if (ast.str !== undefined) {
      return `${ast.name} ${this.str(ast.str)}`;
    } else {
      return ast.name;
    }
  }
  filter(ast: FilterAst) {
    return `${ast.name}${
      ast.args.length > 0
        ? this.delimited('(', ')', ';', ast.args, (item) =>
            this.expression(item)
          )
        : ''
    }`;
  }
  if(ast: IfAst) {
    return `if ${this.expression(ast.cond)} then ${this.expression(ast.then)}${(
      ast.elifs ?? []
    )
      .map((item) => {
        return ` elif ${this.expression(item.cond)} then ${this.expression(
          item.then
        )}`;
      })
      .join('')}${ast.else ? ` else ${this.expression(ast.else)}` : ''} end`;
  }
  try(ast: TryAst): string {
    if (ast.short) {
      return `${this.expression(ast.body)}?`;
    } else {
      return `try ${this.expression(ast.body)}${
        ast.catch ? ` catch ${this.expression(ast.catch)}` : ''
      }`;
    }
  }
  label(ast: LabelAst) {
    return `label ${ast.value}`;
  }
  break(ast: BreakAst) {
    return `break ${ast.value}`;
  }
  reduce(ast: ReduceAst) {
    return `reduce ${this.expression(ast.expr)} as ${
      ast.var
    } (${this.expression(ast.init)}; ${this.expression(ast.update)})`;
  }
  foreach(ast: ForeachAst) {
    return `foreach ${this.expression(ast.expr)} as ${
      ast.var
    } (${this.expression(ast.init)}; ${this.expression(ast.update)}${
      ast.extract ? '; ' + this.expression(ast.extract) : ''
    })`;
  }
  binary(ast: BinaryAst, brackets = false): string {
    const left =
      ast.left.type === 'binary' &&
      Parser.getPrecedence(ast.left.operator) <
        Parser.getPrecedence(ast.operator)
        ? this.binary(ast.left, true)
        : ast.left.type === 'varDeclaration'
        ? `(${this.varDeclaration(ast.left)})`
        : this.expression(ast.left);
    const right =
      ast.right.type === 'binary' &&
      Parser.getPrecedence(ast.right.operator) <
        Parser.getPrecedence(ast.operator)
        ? this.binary(ast.right, true)
        : ast.right.type === 'varDeclaration'
        ? `(${this.varDeclaration(ast.right)})`
        : this.expression(ast.right);
    const out = `${left}${ast.operator === ',' ? '' : ' '}${
      ast.operator
    } ${right}`;

    return brackets ? `(${out})` : out;
  }
  unary(ast: UnaryAst) {
    return `${ast.operator}${
      ast.expr.type !== 'num' ? ' ' : ''
    }${this.expression(ast.expr)}`;
  }
  index(ast: IndexAst) {
    return `${this.expression(ast.expr)}${
      typeof ast.index === 'string'
        ? `${ast.expr.type === 'identity' ? '' : '.'}${ast.index}`
        : `[${this.expression(ast.index)}]`
    }`;
  }
  slice(ast: SliceAst) {
    return `${this.expression(ast.expr)}[${
      ast.from ? this.expression(ast.from) : ''
    }:${ast.to ? this.expression(ast.to) : ''}]`;
  }
  iterator(ast: IteratorAst) {
    return `${this.expression(ast.expr)}[]`;
  }
  array(ast: ArrayAst) {
    return `[${ast.expr ? this.expression(ast.expr) : ''}]`;
  }
  object(ast: ObjectAst) {
    return this.delimited(
      '{ ',
      '}',
      ', ',
      ast.entries,
      (item) => this.objectEntry(item),
      true
    );
  }
  var(ast: VarAst) {
    return `${ast.name}`;
  }
  varDeclaration(ast: VarDeclarationAst) {
    return `(${this.expression(ast.expr)}) as ${this.destructuring(
      ast.destructuring
    )} | ${this.expression(ast.next)}`;
  }
  arrayDestructuring(ast: ArrayDestructuringAst): string {
    return this.delimited('[ ', ' ]', ', ', ast.destructuring, (item) =>
      this.destructuring(item)
    );
  }
  objectDestructuring(ast: ObjectDestructuringAst) {
    return this.delimited(
      '{ ',
      ' }',
      ', ',
      ast.entries,
      (item) => this.objectDestructuringEntry(item),
      false
    );
  }
  recursiveDescent(ast: RecursiveDescentAst) {
    return '..';
  }

  expression(ast: ExpressionAst): string {
    switch (ast.type) {
      case 'binary':
        return this.binary(ast);
      default:
        return this.atom(ast);
    }
  }
  atom(ast: AtomAst): string {
    switch (ast.type) {
      case 'def':
        return this.def(ast);
      case 'identity':
        return this.identity(ast);
      case 'num':
        return this.num(ast);
      case 'str':
        return this.str(ast);
      case 'bool':
        return this.bool(ast);
      case 'null':
        return this.null(ast);
      case 'format':
        return this.format(ast);
      case 'filter':
        return this.filter(ast);
      case 'if':
        return this.if(ast);
      case 'try':
        return this.try(ast);
      case 'reduce':
        return this.reduce(ast);
      case 'var':
        return this.var(ast);
      case 'varDeclaration':
        return this.varDeclaration(ast);
      case 'foreach':
        return this.foreach(ast);
      case 'label':
        return this.label(ast);
      case 'break':
        return this.break(ast);
      case 'unary':
        return this.unary(ast);
      case 'index':
        return this.index(ast);
      case 'slice':
        return this.slice(ast);
      case 'iterator':
        return this.iterator(ast);
      case 'array':
        return this.array(ast);
      case 'object':
        return this.object(ast);
      case 'recursiveDescent':
        return this.recursiveDescent(ast);

      default:
        throw new Error(`Unknown ast node: ${(ast as any).type}`);
    }
  }

  delimited<T>(
    start: string,
    stop: string,
    separator: string,
    items: T[],
    cb: (item: T) => string,
    trailingSeparator?: boolean
  ) {
    return `${start}${items.map(cb).join(separator)}${
      trailingSeparator && items.length > 0 ? separator : ''
    }${stop}`;
  }

  arg(ast: ArgAst): string {
    switch (ast.type) {
      case 'filterArg':
        return this.filterArg(ast);
      case 'varArg':
        return this.varArg(ast);
    }
  }
  objectEntry(ast: ObjectEntryAst) {
    return `${this.objectEntryKey(ast.key)}${
      ast.value ? `: ${this.expression(ast.value)}` : ''
    }`;
  }
  objectDestructuringEntry(ast: ObjectDestructuringEntryAst) {
    if (ast.destructuring === undefined) {
      return this.var(ast.key);
    } else {
      return `${this.objectEntryKey(ast.key)}: ${this.destructuring(
        ast.destructuring
      )}`;
    }
  }
  objectEntryKey(ast: string | ExpressionAst | string) {
    return typeof ast === 'string'
      ? ast
      : ast.type === 'str'
      ? this.expression(ast)
      : `(${this.expression(ast)})`;
  }
  destructuring(ast: DestructuringAst): string {
    switch (ast.type) {
      case 'var':
        return this.var(ast);
      case 'arrayDestructuring':
        return this.arrayDestructuring(ast);
      case 'objectDestructuring':
        return this.objectDestructuring(ast);
    }
  }
}
