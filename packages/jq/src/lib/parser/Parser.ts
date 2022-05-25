import { IdentToken, OpToken, Token, Tokenizer, TokenType } from './Tokenizer';
import {
  ArgAst,
  ArrayAst,
  ArrayDestructuringAst,
  BreakAst,
  DefAst,
  DestructuringAst,
  ExpressionAst,
  FilterAst,
  ForeachAst,
  FormatAst,
  IdentityAst,
  IfAst,
  IndexAst,
  IteratorAst,
  LabelAst,
  ObjectAst,
  ObjectDestructuringAst,
  ObjectEntryAst,
  ProgAst,
  RecursiveDescentAst,
  ReduceAst,
  SliceAst,
  StrAst,
  TryAst,
  VarAst,
  VarDeclarationAst,
} from './AST';
import { InputStream } from './InputStream';

export class Parser {
  private static precedence = {
    '|': 1,
    ',': 2,
    '//': 3,
    '=': 4,
    '|=': 4,
    '+=': 4,
    '-=': 4,
    '*=': 4,
    '/=': 4,
    '%=': 4,
    '//=': 4,
    or: 5,
    and: 6,
    '==': 7,
    '!=': 7,
    '<': 7,
    '>': 7,
    '<=': 7,
    '>=': 7,
    '+': 8,
    '-': 8,
    '*': 9,
    '/': 9,
    '%': 9,
    '?//': 10,
  };

  static getPrecedence(op: string) {
    return Parser.precedence[op as keyof typeof Parser.precedence];
  }

  constructor(private input: Tokenizer) {}

  parse() {
    return this.parseTopLevel();
  }

  private unexpected() {
    return this.input.croak(
      `Unexpected ${Tokenizer.stringifyToken(this.input.peek())}`
    );
  }

  private expected<Type extends TokenType, T extends Token<Type>>(
    type: Type,
    value?: T['value']
  ) {
    const peek = this.input.peek();
    return this.input.croak(
      `Expected ${
        value
          ? Tokenizer.stringifyToken({ type, value } as Token)
          : Tokenizer.stringifyTokenType(type)
      }, received ${Tokenizer.stringifyToken(peek)}`
    );
  }

  private is<Type extends TokenType, T extends Token<Type>>(
    type: Type,
    val?: T['value']
  ): T | null {
    const token = this.input.peek();
    return (((token && token.type === type && (!val || val === token.value)) ||
      null) &&
      token) as any;
  }

  private skip<Type extends TokenType, T extends Token<Type>>(
    type: Type,
    val?: T['value']
  ): T {
    if (this.is(type, val as any)) {
      return this.input.next() as any;
    } else {
      throw this.expected(type, val);
    }
  }

  private isKw(val?: string) {
    return this.is('kw', val);
  }

  private isVar(val?: string) {
    return this.is('var', val);
  }

  private isIdent(val?: string) {
    return this.is('ident', val);
  }

  private isFormat(val?: string) {
    return this.is('format', val);
  }

  private isPunc(val?: string) {
    return this.is('punc', val);
  }

  private isOp(val?: string) {
    return this.is('op', val);
  }

  private isBool(val?: boolean) {
    return this.is('bool', val);
  }

  private isStr(val?: string) {
    return this.is('str', val);
  }

  private isNum(val?: number) {
    return this.is('num', val);
  }

  private isNull() {
    return this.is('null');
  }

  private skipPunc(val?: string) {
    return this.skip('punc', val);
  }

  private skipKw(val?: string) {
    return this.skip('kw', val);
  }

  private skipVar(val?: string) {
    return this.skip('var', val);
  }

  private skipFormat(val?: string) {
    return this.skip('format', val);
  }

  private skipIdent(val?: string): IdentToken {
    return this.skip('ident', val);
  }

  private skipOp(val?: string): OpToken {
    return this.skip('op', val);
  }

  private skipBool(val?: boolean) {
    return this.skip('bool', val);
  }

  private skipStr(val?: string) {
    return this.skip('str', val);
  }

  private skipNum(val?: number) {
    return this.skip('num', val);
  }

  private skipNull() {
    return this.skip('null');
  }

  private parseTopLevel(): ProgAst {
    let expression;
    if (!this.input.eof()) {
      expression = this.parseExpression();
    }

    if (!this.input.eof()) {
      throw this.unexpected();
    }

    return { type: 'root', expr: expression };
  }

  private parseDef(): DefAst {
    this.skipKw('def');
    const name = this.skipIdent().value;
    const args = this.isPunc('(')
      ? this.delimited('(', ')', ';', () => this.parseArgName())
      : [];
    this.skipPunc(':');
    const body = this.parseExpression();
    this.skipPunc(';');
    return {
      type: 'def',
      name,
      args,
      body,
      next: this.parseExpression(),
    };
  }

  private delimited<T>(
    start: string,
    stop: string,
    separator: string | OpToken,
    parser: () => T,
    minCount = 0,
    maxCount?: number,
    allowTrailingSeparator?: boolean
  ) {
    this.skipPunc(start);
    const out = [];
    let first = true;
    let count = 0;
    while (
      count < minCount ||
      (!this.input.eof() &&
        !this.isPunc(stop) &&
        (!maxCount || count < maxCount))
    ) {
      if (!first) {
        if (typeof separator === 'string') this.skipPunc(separator);
        else this.skipOp(separator.value);
      }

      // Break out after skipping a trailing separator
      if (allowTrailingSeparator && this.isPunc(stop)) {
        break;
      }

      out.push(parser());
      first = false;
      count++;
    }

    // Consume the trailing separator if it was not consumed in the loop above due to maxCount
    if (allowTrailingSeparator) {
      if (typeof separator === 'string') {
        if (this.isPunc(separator)) this.skipPunc(separator);
      } else {
        if (this.isOp(separator.value)) this.skipOp(separator.value);
      }
    }

    this.skipPunc(stop);
    return out;
  }

  parseArgName(): ArgAst {
    const token = this.input.next();
    switch (token?.type) {
      case 'ident':
        return { type: 'filterArg', name: token.value };
      case 'var':
        return { type: 'varArg', name: token.value };
    }

    throw this.input.croak('Expecting argument name');
  }

  parseExpression(ignoreOp?: string[]): ExpressionAst {
    return this.maybeVariable(() =>
      this.maybeBinary(this.parseAtomOrControlStructure(), 0, ignoreOp)
    );
  }

  maybeShortTry(cb: () => ExpressionAst): ExpressionAst {
    const expr = cb();
    if (this.isOp('?')) {
      this.skipOp('?');
      const shortTry: TryAst = {
        type: 'try',
        short: true,
        body: expr,
      };
      return this.atomMaybe(() => shortTry);
    }
    return expr;
  }

  parseAtomOrControlStructure(): ExpressionAst {
    if (this.isKw('label')) return this.parseLabel();
    if (this.isKw('break')) return this.parseBreak();
    if (this.isKw('try')) return this.parseTry();
    if (this.isKw('if')) return this.parseIf();
    if (this.isKw('reduce')) return this.parseReduce();
    if (this.isKw('foreach')) return this.parseForeach();
    return this.parseAtom();
  }

  parseAtom(): ExpressionAst {
    if (this.isKw('def')) {
      return this.parseDef();
    }

    if (this.isOp('-'))
      return {
        type: 'unary',
        operator: this.skipOp('-').value,
        expr: this.parseAtomOrControlStructure(),
      };

    return this.atomMaybe(() => {
      if (this.isPunc('(')) {
        this.input.next();
        const exp = this.parseExpression();
        this.skipPunc(')');
        return exp;
      }

      if (this.isOp('.')) return this.parseIdentity();
      if (this.isOp('..')) return this.parseRecursiveDescent();
      if (this.isPunc('[')) return this.parseArray();
      if (this.isPunc('{')) return this.parseObject();
      if (this.isVar()) return this.parseVar();
      if (this.isIdent() || this.isKw('not')) return this.parseFilter();
      if (this.isFormat()) return this.parseFormat();
      if (this.isStr()) return this.parseStr();

      if (this.isNum() || this.isBool() || this.isNull()) {
        return this.input.next() as any;
      }

      throw this.unexpected();
    });
  }

  maybeBinary(
    left: ExpressionAst,
    precedence = 0,
    ignoreOp: string[] = []
  ): ExpressionAst {
    const op = this.isOp() || this.isKw('and') || this.isKw('or');
    if (op && !ignoreOp.includes(op.value)) {
      const otherPrecedence = Parser.getPrecedence(op.value);
      if (otherPrecedence > precedence) {
        this.input.next();
        return this.maybeBinary(
          {
            type: 'binary',
            operator: op.value,
            left,
            right: this.maybeBinary(
              this.parseAtomOrControlStructure(),
              otherPrecedence,
              ignoreOp
            ),
          },
          precedence,
          ignoreOp
        );
      }
    }
    return left;
  }

  parseIdentity(): IdentityAst {
    this.skipOp('.');
    return { type: 'identity' };
  }

  parseRecursiveDescent(): RecursiveDescentAst {
    this.skipOp('..');
    return { type: 'recursiveDescent' };
  }

  atomMaybe(cb: () => ExpressionAst): ExpressionAst {
    return this.maybeShortTry(() =>
      this.maybeBracketIndex(() => this.maybeSimpleIndex(cb))
    );
  }

  maybeVariable(cb: () => ExpressionAst): ExpressionAst {
    const expr = cb();
    if (this.isKw('as')) {
      this.skipKw('as');
      const destructuring = this.parseDestructuring();
      this.skipOp('|');
      const child = this.parseExpression();
      const varDeclaration: VarDeclarationAst = {
        type: 'varDeclaration',
        expr,
        destructuring,
        next: child,
      };
      return varDeclaration;
    }
    return expr;
  }

  parseDestructuring(): DestructuringAst {
    if (this.isPunc('[')) {
      return this.parseArrayDestructuring();
    } else if (this.isPunc('{')) {
      return this.parseObjectDestructuring();
    }
    return this.parseVar();
  }

  parseArrayDestructuring(): ArrayDestructuringAst {
    return {
      type: 'arrayDestructuring',
      destructuring: this.delimited('[', ']', { type: 'op', value: ',' }, () =>
        this.parseDestructuring()
      ),
    };
  }

  parseObjectDestructuring(): ObjectDestructuringAst {
    return {
      type: 'objectDestructuring',
      entries: this.delimited('{', '}', { type: 'op', value: ',' }, () => {
        if (this.isVar()) return { key: this.parseVar() };
        let key: string | ExpressionAst | StrAst;
        if (this.isIdent()) {
          key = this.skipIdent().value;
        } else if (this.isPunc('(')) {
          this.skipPunc('(');
          key = this.parseExpression();
          this.skipPunc(')');
        } else {
          key = this.parseStr();
        }
        this.skipPunc(':');
        return {
          key,
          destructuring: this.parseDestructuring(),
        };
      }),
    };
  }

  maybeBracketIndex(cb: () => ExpressionAst): ExpressionAst {
    const expr = cb();
    if (this.isPunc('[')) {
      let out: IteratorAst | SliceAst | IndexAst;
      this.skipPunc('[');
      if (this.isPunc(']')) {
        out = { type: 'iterator', expr };
      } else {
        const from = this.isPunc(':') ? undefined : this.parseExpression();
        if (this.isPunc(':')) {
          this.skipPunc(':');
          const to = this.isPunc(']') ? undefined : this.parseExpression();
          out = { type: 'slice', expr, from, to };
        } else {
          out = { type: 'index', expr, index: from! };
        }
      }
      this.skipPunc(']');
      return this.atomMaybe(() => out);
    }
    return expr;
  }

  maybeSimpleIndex(cb: () => ExpressionAst): ExpressionAst {
    const expr = cb();
    if (expr.type !== 'identity' && this.isOp('.')) {
      this.skipOp('.');
    }
    if (this.isStr() || this.isIdent()) {
      const index: IndexAst = {
        type: 'index',
        expr,
        index: this.isStr() ? this.parseStr() : this.skipIdent().value,
      };
      return this.atomMaybe(() => index);
    }
    return expr;
  }

  parseVar(): VarAst {
    return { type: 'var', name: this.skipVar().value };
  }

  parseFilter(): FilterAst {
    const name = this.isKw('not')
      ? this.skipKw().value
      : this.skipIdent().value;
    const args = this.isPunc('(')
      ? this.delimited('(', ')', ';', () => this.parseExpression())
      : [];
    return { type: 'filter', name, args };
  }

  parseFormat(): FormatAst {
    const format = this.skipFormat();
    if (this.isStr()) {
      const str = this.parseStr();
      return {
        type: 'format',
        name: format.value,
        str,
      };
    }
    return { type: 'format', name: format.value };
  }

  parseArray(): ArrayAst {
    this.skipPunc('[');
    if (this.isPunc(']')) {
      this.skipPunc(']');
      return { type: 'array' };
    }

    const expr = this.parseExpression();
    this.skipPunc(']');
    return { type: 'array', expr: expr };
  }

  parseObject(): ObjectAst {
    return {
      type: 'object',
      entries: this.delimited(
        '{',
        '}',
        { type: 'op', value: ',' },
        () => this.parseEntry(),
        undefined,
        undefined,
        true
      ),
    };
  }

  parseEntry(): ObjectEntryAst {
    let key;
    if (this.isIdent() || this.isKw()) {
      key = this.isIdent() ? this.skipIdent().value : this.skipKw().value;
      if (!this.isPunc(':')) {
        return { key };
      }
    } else if (this.isPunc('(')) {
      this.skipPunc('(');
      key = this.parseExpression();
      this.skipPunc(')');
    } else if (this.isStr()) {
      key = this.parseStr();
    } else {
      throw this.unexpected();
    }

    this.skipPunc(':');
    const value = this.parseExpression([',']);

    return { key, value };
  }

  parseStr(): StrAst {
    const start = this.skipStr();

    if (this.isPunc('\\(')) {
      const parts: (string | ExpressionAst)[] = [start.value];
      while (this.isPunc('\\(')) {
        parts.push(this.parseInterpolation());
        parts.push(this.skipStr().value);
      }

      return {
        type: 'str',
        interpolated: true,
        parts: parts.filter((x) => x !== ''),
      };
    }

    return {
      type: 'str',
      interpolated: false,
      value: start.value,
    };
  }

  parseInterpolation() {
    this.skipPunc('\\(');
    const expr = this.parseExpression();
    this.skipPunc(')');
    return expr;
  }

  parseIf(): IfAst {
    this.skipKw('if');
    const cond = this.parseExpression();
    this.skipKw('then');
    const then = this.parseExpression();
    const elifs = [];
    while (this.isKw('elif')) {
      this.skipKw('elif');
      const cond = this.parseExpression();
      this.skipKw('then');
      const then = this.parseExpression();
      elifs.push({ cond, then });
    }
    let elseExpr;
    if (this.isKw('else')) {
      this.skipKw('else');
      elseExpr = this.parseExpression();
    }
    this.skipKw('end');

    return {
      type: 'if',
      cond,
      then,
      elifs: elifs.length > 0 ? elifs : undefined,
      else: elseExpr,
    };
  }

  parseTry(): TryAst {
    this.skipKw('try');
    const body = this.parseExpression();
    let catchExpr;
    if (this.isKw('catch')) {
      this.skipKw('catch');
      catchExpr = this.parseExpression();
    }

    return { type: 'try', short: false, body, catch: catchExpr };
  }

  parseLabel(): LabelAst {
    this.skipKw('label');
    return { type: 'label', value: this.skipVar().value };
  }

  parseBreak(): BreakAst {
    this.skipKw('break');
    return { type: 'break', value: this.skipVar().value };
  }

  parseReduce(): ReduceAst {
    this.skipKw('reduce');
    const expr = this.parseAtom();
    this.skipKw('as');
    const varName = this.skipVar().value;
    const args = this.delimited(
      '(',
      ')',
      ';',
      () => this.parseExpression(),
      2,
      2
    );

    return {
      type: 'reduce',
      expr,
      var: varName,
      init: args[0],
      update: args[1],
    };
  }

  parseForeach(): ForeachAst {
    this.skipKw('foreach');
    const expr = this.parseAtom();
    this.skipKw('as');
    const varName = this.skipVar().value;
    const args = this.delimited(
      '(',
      ')',
      ';',
      () => this.parseExpression(),
      2,
      3
    );

    return {
      type: 'foreach',
      expr,
      var: varName,
      init: args[0],
      update: args[1],
      extract: args[2],
    };
  }
}

export function parse(code: string) {
  return new Parser(new Tokenizer(new InputStream(code))).parse();
}
