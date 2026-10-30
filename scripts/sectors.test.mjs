import { test } from 'node:test';
import assert from 'node:assert/strict';
import { sectorOf, isAgency } from '../src/sectors.js';

test('banks, trading firms and agencies are tagged by name', () => {
  for (const name of ['Barclays', 'Deutsche Bank', 'Eurobank Limited', 'BNP Paribas', 'Revolut']) assert.equal(sectorOf(name), 'bank', name);
  for (const name of ['XM', 'Pepperstone', 'IG Group', 'TP ICAP Group Services Ltd', 'CFI Financial Group']) assert.equal(sectorOf(name), 'trading', name);
  for (const name of ['Sage', 'Bookingham', 'Tradeshift Engineering', 'CBSbutler Holdings Limited trading as CBSbutler']) assert.equal(sectorOf(name), 'other', name);
  for (const name of ['Consortium Professional Recruitment', 'Hays', 'Hackajob Ltd', 'Klient portalu Praca.pl', 'RADAS Jobbörse & Personalvermittlung GmbH']) assert.ok(isAgency(name), name);
  assert.ok(!isAgency('Visa'));
});
