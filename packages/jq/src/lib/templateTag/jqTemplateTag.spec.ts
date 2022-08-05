import { jqTemplateTag } from './jqTemplateTag';

describe('jq-template-tag', () => {
  it('identity', () => {
    const identity = jqTemplateTag`.`;
    expect(Array.from(identity([5, 10, 15]))).toEqual([5, 10, 15]);
  });
  it('add5', () => {
    const add5 = jqTemplateTag`.+5`;
    expect(Array.from(add5([10, 20, 30]))).toEqual([15, 25, 35]);
  });
});
