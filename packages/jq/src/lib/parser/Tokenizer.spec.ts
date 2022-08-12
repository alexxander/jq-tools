import { Tokenizer } from './Tokenizer';
import { InputStream } from './InputStream';

describe('Tokenizer', () => {
  it('simple', () => {
    const tokenizer = new Tokenizer(
      new InputStream('. | [1, .a, .b, "hello"] | map(. * 2)')
    );

    expect(tokenizer.toArray()).toEqual([
      { type: 'op', value: '.' },
      { type: 'op', value: '|' },
      { type: 'punc', value: '[' },
      { type: 'num', value: 1 },
      { type: 'op', value: ',' },
      { type: 'op', value: '.' },
      { type: 'ident', value: 'a' },
      { type: 'op', value: ',' },
      { type: 'op', value: '.' },
      { type: 'ident', value: 'b' },
      { type: 'op', value: ',' },
      { type: 'str', value: 'hello' },
      { type: 'punc', value: ']' },
      { type: 'op', value: '|' },
      { type: 'ident', value: 'map' },
      { type: 'punc', value: '(' },
      { type: 'op', value: '.' },
      { type: 'op', value: '*' },
      { type: 'num', value: 2 },
      { type: 'punc', value: ')' },
    ]);
  });

  it('no spaces', () => {
    const tokenizer = new Tokenizer(
      new InputStream('.|[1,.a,.b,"hello"]|map(.*2)')
    );

    expect(tokenizer.toArray()).toEqual([
      { type: 'op', value: '.' },
      { type: 'op', value: '|' },
      { type: 'punc', value: '[' },
      { type: 'num', value: 1 },
      { type: 'op', value: ',' },
      { type: 'op', value: '.' },
      { type: 'ident', value: 'a' },
      { type: 'op', value: ',' },
      { type: 'op', value: '.' },
      { type: 'ident', value: 'b' },
      { type: 'op', value: ',' },
      { type: 'str', value: 'hello' },
      { type: 'punc', value: ']' },
      { type: 'op', value: '|' },
      { type: 'ident', value: 'map' },
      { type: 'punc', value: '(' },
      { type: 'op', value: '.' },
      { type: 'op', value: '*' },
      { type: 'num', value: 2 },
      { type: 'punc', value: ')' },
    ]);
  });

  it('comments', () => {
    const tokenizer = new Tokenizer(
      new InputStream(
        `. # This is identity
        | . # Another identity
        | .a # Access some value
        `
      )
    );

    expect(tokenizer.toArray()).toEqual([
      { type: 'op', value: '.' },
      { type: 'op', value: '|' },
      { type: 'op', value: '.' },
      { type: 'op', value: '|' },
      { type: 'op', value: '.' },
      { type: 'ident', value: 'a' },
    ]);
  });

  it('vars', () => {
    const tokenizer = new Tokenizer(new InputStream(`. as $var | .a | $var`));

    expect(tokenizer.toArray()).toEqual([
      { type: 'op', value: '.' },
      { type: 'kw', value: 'as' },
      { type: 'var', value: '$var' },
      { type: 'op', value: '|' },
      { type: 'op', value: '.' },
      { type: 'ident', value: 'a' },
      { type: 'op', value: '|' },
      { type: 'var', value: '$var' },
    ]);
  });

  describe('interpolation', () => {
    it('simple', () => {
      const tokenizer = new Tokenizer(new InputStream(`"\\(.):\\(.)"`));

      expect(tokenizer.toArray()).toEqual([
        { type: 'str', value: '' },
        { type: 'punc', value: '\\(' },
        { type: 'op', value: '.' },
        { type: 'punc', value: ')' },
        { type: 'str', value: ':' },
        { type: 'punc', value: '\\(' },
        { type: 'op', value: '.' },
        { type: 'punc', value: ')' },
        { type: 'str', value: '' },
      ]);
    });
    it('complex', () => {
      const tokenizer = new Tokenizer(
        new InputStream(
          `"\\("a")\\("a\\((58+(5)))\\((((null))))xxx)))" + "\\(.)")"`
        )
      );

      expect(tokenizer.toArray()).toEqual([
        { type: 'str', value: '' },
        { type: 'punc', value: '\\(' },
        { type: 'str', value: 'a' },
        { type: 'punc', value: ')' },
        { type: 'str', value: '' },
        { type: 'punc', value: '\\(' },
        { type: 'str', value: 'a' },
        { type: 'punc', value: '\\(' },
        { type: 'punc', value: '(' },
        { type: 'num', value: 58 },
        { type: 'op', value: '+' },
        { type: 'punc', value: '(' },
        { type: 'num', value: 5 },
        { type: 'punc', value: ')' },
        { type: 'punc', value: ')' },
        { type: 'punc', value: ')' },
        { type: 'str', value: '' },
        { type: 'punc', value: '\\(' },
        { type: 'punc', value: '(' },
        { type: 'punc', value: '(' },
        { type: 'punc', value: '(' },
        { type: 'null', value: null },
        { type: 'punc', value: ')' },
        { type: 'punc', value: ')' },
        { type: 'punc', value: ')' },
        { type: 'punc', value: ')' },
        { type: 'str', value: 'xxx)))' },
        { type: 'op', value: '+' },
        { type: 'str', value: '' },
        { type: 'punc', value: '\\(' },
        { type: 'op', value: '.' },
        { type: 'punc', value: ')' },
        { type: 'str', value: '' },
        { type: 'punc', value: ')' },
        { type: 'str', value: '' },
      ]);
    });
  });

  it('operators', () => {
    const tokenizer = new Tokenizer(
      new InputStream(
        `.|., .//., .=., .|=., .+=., .-=., .*=., ./=., .%=., .//=., .or., .and., .==., .!=., .<., .>., .<=., .>=., .+., .-., .*., ./., .%., .as[$a]?//$b`
      )
    );

    expect(tokenizer.toArray()).toEqual([
      { type: 'op', value: '.' },
      { type: 'op', value: '|' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '//' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '=' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '|=' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '+=' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '-=' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '*=' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '/=' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '%=' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '//=' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'kw', value: 'or' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'kw', value: 'and' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '==' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '!=' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '<' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '>' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '<=' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '>=' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '+' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '-' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '*' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '/' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'op', value: '%' },
      { type: 'op', value: '.' },
      { type: 'op', value: ',' },

      { type: 'op', value: '.' },
      { type: 'kw', value: 'as' },
      { type: 'punc', value: '[' },
      { type: 'var', value: '$a' },
      { type: 'punc', value: ']' },
      { type: 'op', value: '?//' },
      { type: 'var', value: '$b' },
    ]);
  });
});
