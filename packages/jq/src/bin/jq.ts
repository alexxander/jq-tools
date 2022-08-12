#!/usr/bin/env node
import * as readline from 'readline';
import { parse } from '../lib/parser/Parser';
import { evaluate } from '../lib/evaluate/evaluate';
import { single } from '../lib/evaluate/utils/utils';

const code = process.argv[2];
const ast = parse(code);

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

async function main() {
  for await (const line of rl) {
    if (line === '') continue;
    const inputItem = JSON.parse(line);
    for (const outputItem of evaluate(ast, single(inputItem))) {
      console.log(JSON.stringify(outputItem, null, 2));
    }
  }
}

main();
