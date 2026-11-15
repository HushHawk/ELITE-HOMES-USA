import { z } from 'zod';

export const propertyTypes = ['Single-family homes', 'Townhomes', 'Condominiums', 'Multifamily properties', 'Homes needing repairs', 'Other'] as const;
export const conditions = ['Excellent', 'Good', 'Needs work', 'Major repairs', 'Unsure'] as const;
export const occupancies = ['Owner occupied', 'Tenant occupied', 'Vacant', 'Unsure'] as const;
export const timelines = ['As soon as possible', 'Within 30 days', '60 days or more', 'Exploring options'] as const;
export const contactMethods = ['Phone', 'Email'] as const;
export const statuses = ['New', 'Contacted', 'Qualified', 'Reviewing', 'Offer Prepared', 'Offer Sent', 'Under Contract', 'Closed', 'Archived'] as const;
const required = (max: number) => z.string().trim().min(1, 'This field is required.').max(max);
const optional = (max: number) => z.string().trim().max(max).default('');
const phone = z.string().trim().max(25).refine(value => /^\+?[\d ().-]+$/.test(value) && /^1?\d{10}$/.test(value.replace(/\D/g, '')), 'Enter a valid US phone number.');
const email = z.email().max(254).toLowerCase();
const enumField = <T extends readonly [string, ...string[]]>(values: T) => z.enum(values, { error: 'Choose an option.' });

export const offerSteps = [
  z.object({ address: required(180), city: required(90), state: z.string().trim().toUpperCase().regex(/^[A-Z]{2}$/, 'Enter a two-letter state code.'), zip: z.string().trim().regex(/^\d{5}(?:-\d{4})?$/, 'Enter a valid ZIP code.'), propertyType: enumField(propertyTypes) }),
  z.object({ condition: enumField(conditions), occupancy: enumField(occupancies), timeline: enumField(timelines), bedrooms: optional(8).refine(v => !v || /^\d{1,2}$/.test(v), 'Enter a whole number from 0 to 99.'), bathrooms: optional(8).refine(v => !v || /^\d{1,2}(?:\.5)?$/.test(v), 'Enter a number such as 2 or 2.5.'), notes: optional(1600) }),
  z.object({ name: required(100), phone, email: z.union([email, z.literal('')]).default(''), preferred: enumField(contactMethods) })
    .refine(value => value.preferred !== 'Email' || value.email, { path: ['email'], message: 'Enter your email to be contacted by email.' }),
] as const;
const offer = offerSteps[0].merge(offerSteps[1]).extend(offerSteps[2].shape)
  .refine(value => value.preferred !== 'Email' || value.email, { path: ['email'], message: 'Enter your email to be contacted by email.' });

export const newsletterDisclosure = 'I agree to receive email updates from Elite Homes USA.';
export const newsletterVersion = 'email-updates-v1';
export const channels = ['offer', 'contact', 'newsletter'] as const;
export type Channel = typeof channels[number];
export const submission = z.object({
  requestId: z.uuid(),
  website: optional(250),
  source: z.enum(['home', 'property', 'website', 'contact', 'footer']).default('website'),
  utm: z.object({ source: optional(100), medium: optional(100), campaign: optional(100) }).optional(),
  data: z.unknown(),
});
export const schemas = {
  offer,
  contact: z.object({ name: required(100), email, phone, message: required(1600) }),
  newsletter: z.object({ email, consent: z.literal(true, { error: 'Please opt in to subscribe.' }) }),
};
export const recordUpdate = z.object({ id: z.uuid(), status: enumField(statuses), note: optional(1500), followUp: z.union([z.iso.date(), z.literal('')]).default('') });
