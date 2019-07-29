import { expect } from 'chai';

import * as utils from '../../utils/strings';

describe('utils lib', () => {
  it('isMac', () => {
    expect(utils.isMac('hello')).to.be.false;
    expect(utils.isMac('ab:ac:ef:01:23:45')).to.be.true;
    expect(utils.isMac('AB:ac:ef01:23:45')).to.be.true;
  });

  it('standardizeMac', () => {
    expect(utils.standardizeMac('112233445566')).to.equal('11:22:33:44:55:66');
    expect(utils.standardizeMac('AB:ac:ef01:23:45')).to.equal('ab:ac:ef:01:23:45');
  });

  it('isNumeric', () => {
    expect(utils.isNumeric('a')).to.be.false;
    expect(utils.isNumeric('10.1.5')).to.be.false;
    expect(utils.isNumeric('-8')).to.be.true;
    expect(utils.isNumeric('10.5')).to.be.true;
    expect(utils.isNumeric(123)).to.be.true;
  });
});
