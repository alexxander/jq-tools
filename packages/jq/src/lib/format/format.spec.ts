import { format } from './format';

describe('format', () => {
  it('format', () => {
    expect(
      format('[.[] | {\n"firstName" : .firstName ,\nlastName: .surname\n}]')
    ).toEqual(
      '[.[] | {\n' +
        '  "firstName": .firstName,\n' +
        '  lastName: .surname,\n' +
        '}]'
    );
  });
});
