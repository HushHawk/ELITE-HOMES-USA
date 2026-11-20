export const business = {
  name: 'Elite Homes USA',
  founder: 'Darren Richardson',
  phone: '904-990-6760',
  legalPhone: '904-515-5092',
  email: 'team@elitehomes1.com',
  mailingAddress: '1036 Dunn Ave., Suite 4-295, Jacksonville, FL 32218',
  source: 'https://darrenrichardson26.wixsite.com/elite-home-usa-gro-2',
  socials: [
    { name: 'Facebook', href: 'https://facebook.com/elitehomesusa' },
    { name: 'Instagram', href: 'https://instagram.com/elitehomesusa' },
    { name: 'LinkedIn', href: 'https://linkedin.com/company/elitehomesusa' },
    { name: 'YouTube', href: 'https://youtube.com/@elitehomesusa' },
    { name: 'X', href: 'https://x.com/elitehomesusa' },
  ],
};

export const navigation = [
  ['Home', '/'], ['Sell', '/sell'], ['Buy', '/buy'], ['About', '/about'], ['Services', '/services'],
  ['Reviews', '/reviews'], ['Contact', '/contact'],
];

export const slides = [
  { image: 'dusk', position: 'center 56%', label: 'Welcome home', lines: ['Let’s talk about', 'your home.'], detail: 'A friendly, local conversation about your Jacksonville-area property. No pressure and no rush, just people who take the time to listen.' },
  { image: 'villa', position: 'center 53%', label: 'See it in person', lines: ['We’d love to', 'see it first.'], detail: 'We view every property in person, or through photos and video from the homeowner, and prepare an offer only after a walk-through.' },
  { image: 'film-poster', position: 'center 52%', label: 'Your pace', lines: ['Make your move.', 'At your pace.'], detail: 'Take the time you need. We’ll work around your schedule and walk you through each step.', video: true },
];

export const services = [
  {
    slug: 'walk-through-offers',
    title: 'A Thoughtful Offer After a Walk-Through',
    image: 'villa',
    caption: 'We see the home before we talk numbers.',
    detail: 'We view every property in person, or start with photos and video from the homeowner when a visit isn’t possible yet. Once we’ve completed a walk-through, we prepare an offer that reflects the home and your situation, and you can take all the time you need to consider it.',
    points: ['In-person visit or homeowner video and photos', 'Offer prepared after a walk-through', 'Take the time you need to decide'],
  },
  {
    slug: 'sell-as-is',
    title: 'Sell As-Is, Without the Repair List',
    image: 'suburban',
    caption: 'Leave the renovation checklist behind.',
    detail: 'You don’t need to fix, clean or stage before we visit. Whether the home needs small updates or larger repairs, we’re happy to take a look and talk through what makes sense.',
    points: ['Share the home as it is today', 'No need to prepare or stage', 'We’ll talk through any repairs together'],
  },
  {
    slug: 'flexible-closings',
    title: 'Close on Your Schedule',
    image: 'interior',
    caption: 'Plan the move at your pace.',
    detail: 'Every family’s situation is different. Some homeowners want a quick transition and others want more time to plan. We’ll talk about the closing date that feels right for you.',
    points: ['A timeline that works for you', 'Room to plan your next move', 'No pressure, no rush'],
  },
  {
    slug: 'guided-process',
    title: 'A Caring, Guided Process',
    image: 'keys',
    caption: 'Know what comes next.',
    detail: 'From the first conversation through closing, we explain each step in plain language and help with the paperwork. You won’t have to host open houses or manage showings, and you’re always free to ask questions.',
    points: ['Plain-language guidance', 'Help with paperwork and closing', 'No open houses or repeated showings'],
  },
  {
    slug: 'local-expertise',
    title: 'Local Neighbors You Can Trust',
    image: 'jacksonville',
    caption: 'A Jacksonville perspective.',
    detail: 'We know the Jacksonville area and the neighborhoods we serve. Our team gives personal attention to each home and each family, and we value honest conversation over a quick sale.',
    points: ['Local market knowledge', 'Personal attention to every home', 'Honest, respectful conversation'],
  },
];

export const benefits = [
  ['We See Every Home First', 'We view every property in person, or through photos and video the homeowner shares. After a walk-through, we prepare an offer that reflects the home you actually have.'],
  ['No Repairs or Upgrades Needed', 'You don’t have to fix up the house before we visit. Whether it needs small touch-ups or larger repairs, we’re glad to take a look and talk it through.'],
  ['Clear and Honest Communication', 'We explain what we see, how we arrived at our offer and what each step involves. Your offer and its terms are provided in writing so you can review them with family or an advisor.'],
  ['Flexible Closing Dates', 'We work around your schedule. Whether you’d like to move soon or need more time, we’ll find a closing date that feels comfortable for you.'],
  ['Local Knowledge', 'We understand the Jacksonville-area market and the needs of homeowners in the neighborhoods we serve. We’re happy to share what we know.'],
  ['A Calmer Experience', 'Selling a home can feel like a lot. We handle the details with patience, and there are no open houses or constant showings to manage.'],
  ['Trusted by Homeowners', 'Homeowners tell us they appreciate our responsiveness, patience and respect. We’re grateful for the trust families place in us.'],
];

export const properties = [
  { title: 'Single-family homes', image: 'family', detail: 'We’re glad to visit detached homes in a range of conditions. Share the address and a little about the home and your plans.' },
  { title: 'Townhomes', image: 'townhome', detail: 'Let us know about any association dues or rules that apply. We’ll go over the details with you during our visit.' },
  { title: 'Condominiums', image: 'condo', detail: 'Association documents, assessments and occupancy can matter. Share what you have on hand and we’ll take it from there.' },
  { title: 'Multifamily properties', image: 'multi', detail: 'Tell us the number of units and whether they are occupied. We’ll ask for anything else we need to see.' },
  { title: 'Homes needing repairs', image: 'suburban', detail: 'Share the repairs or updates you already know about. We can visit the home just as it is today.' },
];

export const steps = [
  { title: 'Tell us about your home', detail: 'Share the address, the condition and the timeline you have in mind. We’ll reach out to say hello and answer questions.' },
  { title: 'We view the property', detail: 'We visit in person, or begin with photos and video from you. Then we schedule a walk-through so we can see the home for ourselves.' },
  { title: 'Review your offer together', detail: 'After the walk-through, we prepare an offer and walk you through it. Take your time. You decide whether it’s right for you.' },
  { title: 'Agree on a closing date', detail: 'If you’d like to move forward, we’ll coordinate the closing steps with you and choose a date that fits your plans.' },
];

export const faqs = [
  ['How does the process work?', 'You tell us about your home. We view the property in person, or start with photos and video from you, and complete a walk-through. After that, we prepare an offer and walk you through it. Timing depends on the property, title and your schedule.'],
  ['Do I need to make repairs first?', 'No. Tell us about any repairs or updates the home needs, and we’ll take them into account during our walk-through.'],
  ['What about fees and commissions?', 'Elite Homes USA buys directly, so there is no listing agent commission. We’ll explain any closing costs that apply and provide the terms in writing so you know what to expect.'],
  ['What types of properties do you consider?', 'We consider single-family homes, townhomes, condominiums and multifamily properties, including homes that need work. Each property is considered individually.'],
  ['What happens at closing?', 'The closing team coordinates title review and documents. We’ll agree on a date and explain the steps and terms before you decide to move forward.'],
  ['What if I can’t be there for a visit?', 'That’s okay. You can share photos and video of the home to get started, and we can arrange a walk-through when it’s convenient for you.'],
];

export const comparison = [
  ['Preparation', 'Repairs, cleaning or staging may be recommended.', 'Begin with the home in its current condition.'],
  ['Showings', 'Potential buyers may tour the home over several days or weeks.', 'One walk-through with our team.'],
  ['Financing', 'An offer may depend on mortgage approval and an appraisal.', 'A direct purchase with the terms in writing.'],
  ['Timeline', 'Timing may depend on listing activity and buyer contingencies.', 'A closing date we choose together.'],
  ['Costs', 'Commissions and closing expenses depend on the agreement.', 'Costs are listed in the written offer.'],
];


export const sellerReviews = [
  { name: 'John M.', title: 'A sale without the prep', detail: 'John described avoiding repairs and showings and closing on a schedule that worked for him.' },
  { name: 'David R.', title: 'Questions answered at every step', detail: 'David was initially unsure about selling directly. He said the team walked him through each step, answered his questions and made the process easier.' },
  { name: 'Michael B.', title: 'Support when timing mattered', detail: 'Michael had a tight timeline and highlighted the team’s professionalism, responsiveness and attention to his situation.' },
];
