import assert from 'node:assert/strict';
import test from 'node:test';
import { schemas } from '../lib/schema.ts';

const offer = { address: '12 Test Drive', city: 'Jacksonville', state: 'fl', zip: '32218', propertyType: 'Townhomes', condition: 'Good', occupancy: 'Vacant', timeline: 'Exploring options', name: ' Sample Seller ', phone: '904-555-0100', preferred: 'Phone' };

test('normalizes valid offers and validates conditional email', () => {
  const parsed = schemas.offer.parse(offer);
  assert.equal(parsed.state, 'FL');
  assert.equal(parsed.name, 'Sample Seller');
  assert.equal(parsed.email, '');
  assert.equal(schemas.offer.safeParse({ ...offer, preferred: 'Email' }).success, false);
});

test('rejects invalid ZIP, phone and condition', () => {
  assert.equal(schemas.offer.safeParse({ ...offer, zip: 'xyz' }).success, false);
  assert.equal(schemas.offer.safeParse({ ...offer, phone: '123' }).success, false);
  assert.equal(schemas.offer.safeParse({ ...offer, condition: 'Misleading' }).success, false);
});

test('records only explicit newsletter consent and normalizes email case', () => {
  assert.equal(schemas.newsletter.parse({ email: 'Test@Example.com', consent: true }).email, 'test@example.com');
  assert.equal(schemas.newsletter.safeParse({ email: 'test@example.com', consent: false }).success, false);
});
