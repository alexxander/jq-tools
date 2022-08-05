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
  static INDENT = '  ';
  private indent = 0;

  root(ast: ProgAst) {
    if (!ast.expr) return '';
    return this.expression(ast.expr, false);
  }
  def(ast: DefAst) {
    return `def ${Parser.getFilterIdent(ast.name)}${
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
    }: ${this.expression(ast.body, false)};${
      ast.next ? ' ' + this.expression(ast.next, false) : ''
    }`;
  }
  filterArg(ast: FilterArgAst) {
    return Parser.getFilterIdent(ast.name);
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
    const formatStr = ast.format ? this.format(ast.format) + ' ' : '';
    if (ast.interpolated) {
      return (
        formatStr +
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
      return formatStr + JSON.stringify(ast.value);
    }
  }
  bool(ast: BoolAst) {
    return JSON.stringify(ast.value);
  }
  null(ast: NullAst) {
    return JSON.stringify(ast.value);
  }
  format(ast: FormatAst) {
    return ast.name;
  }
  filter(ast: FilterAst) {
    return `${Parser.getFilterIdent(ast.name)}${
      ast.args.length > 0
        ? this.delimited('(', ')', ';', ast.args, (item) =>
            this.expression(item, false)
          )
        : ''
    }`;
  }
  if(ast: IfAst) {
    return `if ${this.expression(ast.cond)}${this.tab()}then ${this.expression(
      ast.then
    )}${(ast.elifs ?? [])
      .map((item) => {
        const out = `${this.br()}elif ${this.expression(
          item.cond
        )}${this.tab()}then ${this.expression(item.then)}`;
        this.shiftTab();
        return out;
      })
      .join('')}${
      ast.else ? `${this.br()}else ${this.expression(ast.else)}` : ''
    }${this.shiftTab()}end`;
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
    return `label ${ast.value} | ${this.expression(ast.next, false)}`;
  }
  break(ast: BreakAst) {
    return `break ${ast.value}`;
  }
  reduce(ast: ReduceAst) {
    return `reduce ${this.expression(ast.expr)} as ${
      ast.var
    } (${this.tab()}${this.expression(
      ast.init,
      false
    )};${this.br()}${this.expression(ast.update, false)}${this.shiftTab()})`;
  }
  foreach(ast: ForeachAst) {
    return `foreach ${this.expression(ast.expr)} as ${
      ast.var
    } (${this.tab()}${this.expression(
      ast.init,
      false
    )};${this.br()}${this.expression(ast.update, false)}${
      ast.extract ? `;${this.br()}` + this.expression(ast.extract, false) : ''
    }${this.shiftTab()})`;
  }
  binary(ast: BinaryAst): string {
    const left = this.expression(
      ast.left,
      ast.left.type === 'binary'
        ? Parser.getPrecedence(ast.left.operator) <
            Parser.getPrecedence(ast.operator)
        : this.needsBrackets(ast.left)
    );
    const right = this.expression(
      ast.right,
      ast.right.type === 'binary'
        ? Parser.getPrecedence(ast.right.operator) <
            Parser.getPrecedence(ast.operator)
        : this.needsBrackets(ast.right)
    );

    return `${left}${ast.operator === ',' ? '' : ' '}${ast.operator} ${right}`;
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
        : `[${this.expression(ast.index, false)}]`
    }`;
  }
  slice(ast: SliceAst) {
    return `${this.expression(ast.expr)}[${
      ast.from ? this.expression(ast.from, false) : ''
    }:${ast.to ? this.expression(ast.to, false) : ''}]`;
  }
  iterator(ast: IteratorAst) {
    return `${this.expression(ast.expr)}[]`;
  }
  array(ast: ArrayAst) {
    return `[${ast.expr ? this.expression(ast.expr, false) : ''}]`;
  }
  object(ast: ObjectAst) {
    if (ast.entries.length === 0) return '{}';
    return `{${this.tab()}${this.delimited(
      '',
      '',
      `,${this.br()}`,
      ast.entries,
      (item) => this.objectEntry(item)
    )},${this.shiftTab()}}`;
  }
  var(ast: VarAst) {
    return `${ast.name}`;
  }
  varDeclaration(ast: VarDeclarationAst) {
    return `${this.expression(
      ast.expr,
      this.varDeclarationNeedsBrackets(ast.expr)
    )} as ${ast.destructuring
      .map((destructuring) => this.destructuring(destructuring))
      .join(' ?// ')} | ${this.expression(ast.next, false)}`;
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

  expression(ast: ExpressionAst, brackets = this.needsBrackets(ast)): string {
    switch (ast.type) {
      case 'binary':
        return this.brackets(this.binary(ast), brackets);
      default:
        return this.brackets(this.atom(ast), brackets);
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
      ast.value
        ? `: ${this.expression(
            ast.value,
            this.objectValueNeedsBrackets(ast.value)
          )}`
        : ''
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
      : this.expression(ast, ast.type !== 'str');
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

  brackets(val: string, brackets: boolean) {
    if (brackets) return `(${val})`;
    return val;
  }

  needsBrackets(ast: ExpressionAst) {
    const typesWithNoNeedForBrackets: ExpressionAst['type'][] = [
      'identity',
      'num',
      'str',
      'bool',
      'null',
      'format',
      'filter',
      'var',
      'index',
      'slice',
      'iterator',
      'array',
      'object',
      'recursiveDescent',
      'unary',
      'label',
      'break',
      'if',
      'reduce',
      'foreach',
    ];
    const noNeedForBrackets =
      (ast.type === 'try' && ast.short) ||
      typesWithNoNeedForBrackets.includes(ast.type);
    return !noNeedForBrackets;
  }

  objectValueNeedsBrackets(ast: ExpressionAst) {
    const typesWithNoNeedForBrackets: ExpressionAst['type'][] = [
      'identity',
      'num',
      'str',
      'bool',
      'null',
      'format',
      'filter',
      'var',
      'index',
      'slice',
      'iterator',
      'array',
      'object',
      'recursiveDescent',
    ];
    const noNeedForBrackets =
      (ast.type === 'try' && ast.short) ||
      (ast.type === 'unary'
        ? ast.expr.type === 'num'
        : typesWithNoNeedForBrackets.includes(ast.type));
    return !noNeedForBrackets;
  }

  varDeclarationNeedsBrackets(ast: ExpressionAst) {
    const typesWithNoNeedForBrackets: ExpressionAst['type'][] = [
      'identity',
      'num',
      'str',
      'bool',
      'null',
      'format',
      'filter',
      'var',
      'index',
      'slice',
      'iterator',
      'array',
      'object',
      'recursiveDescent',
    ];
    const noNeedForBrackets =
      (ast.type === 'try' && ast.short) ||
      typesWithNoNeedForBrackets.includes(ast.type);
    return !noNeedForBrackets;
  }

  br() {
    let out = '\n';
    for (let i = 0; i < this.indent; i++) {
      out += Print.INDENT;
    }
    return out;
  }

  tab() {
    this.indent++;
    return this.br();
  }

  shiftTab() {
    this.indent--;
    return this.br();
  }
}
