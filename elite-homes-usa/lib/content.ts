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
  { image: 'dusk', position: 'center 56%', label: 'Sell on your terms', lines: ['Sell your home.', 'On your terms.'], detail: 'A straightforward cash offer for your Jacksonville-area home, with no repairs, no open houses and no obligation.' },
  { image: 'villa', position: 'center 53%', label: 'Sell as-is', lines: ['Sell it as-is.', 'Start fresh.'], detail: 'Tell us about your home in its current condition. We’ll review the details and discuss the options with you.' },
  { image: 'film-poster', position: 'center 52%', label: 'Flexible closing', lines: ['Make your move.', 'At your pace.'], detail: 'Explore a direct sale and agree on a closing date that gives you room to plan your next move.', video: true },
];

export const services = [
  {
    slug: 'cash-offers',
    title: 'Fast, Fair Cash Offers for Your Home',
    image: 'villa',
    caption: 'Receive an offer within 24 hours.',
    detail: 'We understand the need for a quick sale, which is why we provide cash offers within 24 hours. You’ll receive a no-obligation, fair offer based on your property’s value, with no hidden fees or commissions. This service is perfect for homeowners looking to sell without the lengthy traditional real estate process.',
    points: ['Cash offer in 24 hours', 'No fees or commissions', 'No repairs required'],
  },
  {
    slug: 'sell-as-is',
    title: 'Sell As-Is, No Repairs Needed',
    image: 'suburban',
    caption: 'Skip the renovation checklist.',
    detail: 'Don’t worry about spending money on repairs or upgrades before selling. We buy homes in any condition, whether they need major renovations or just minor updates. Avoid the stress and costs of prepping your house for sale—we’ll handle everything.',
    points: ['Sell without any repairs', 'Save time and money', 'Get a competitive offer regardless of the home’s condition'],
  },
  {
    slug: 'flexible-closings',
    title: 'Close on Your Schedule',
    image: 'interior',
    caption: 'Plan the move at your pace.',
    detail: 'At Elite Homes USA, we understand that every homeowner’s situation is different. Whether you need to sell quickly or prefer a slower pace, we offer flexible closing dates to accommodate your timeline. You decide when you want to close, and we make it happen.',
    points: ['Close in as little as 7 days', 'Choose a timeline that works for you', 'No pressure, no rush—just flexibility'],
  },
  {
    slug: 'guided-process',
    title: 'Stress-Free Home-Selling Experience',
    image: 'keys',
    caption: 'Know what comes next.',
    detail: 'Our goal is to make the home-selling process as easy as possible. From the moment you contact us, we take care of everything—from the paperwork to the closing process. You won’t have to deal with showings, open houses, or negotiations. Just a straightforward, hassle-free sale.',
    points: ['We handle all paperwork', 'No showings or open houses needed', 'Streamlined process from start to finish'],
  },
  {
    slug: 'local-expertise',
    title: 'Local Experts You Can Trust',
    image: 'jacksonville',
    caption: 'A Jacksonville perspective.',
    detail: 'With years of experience in the local real estate market, we understand the unique challenges and opportunities in your area. Our team provides personalized guidance and fair offers based on your community’s trends, ensuring a quick and efficient sale.',
    points: ['Local market knowledge', 'Personalized service tailored to your area', 'Experienced professionals working for you'],
  },
];

export const benefits = [
  ['Fast and Fair Cash Offers', 'We understand that time is often critical, which is why we provide a fair, no-obligation cash offer within 24 hours. No waiting for buyers, no drawn-out negotiations—just a straightforward process that gets you results quickly.'],
  ['No Repairs or Upgrades Needed', 'Unlike traditional home sales that often require costly repairs and renovations, we buy your home as-is. Whether your property needs minor touch-ups or major repairs, we’ll still make an offer. Skip the hassle of fixing up your house and let us handle the rest.'],
  ['Transparent, No Hidden Fees', 'Our process is fully transparent. When we make you an offer, that’s the amount you’ll receive—no commissions, no closing costs, and no surprises. We handle everything from paperwork to closing, making it easy for you to move on without extra expenses.'],
  ['Flexible Closing Dates', 'We work around your schedule. Whether you need to close in a week or need more time, we provide flexibility so you can sell your house on your terms. It’s all about convenience and comfort for our clients.'],
  ['Local Expertise', 'We have deep knowledge of the local real estate market and understand the unique needs of homeowners in the areas we serve. Our team has years of experience helping people just like you, offering insights that help maximize the value of your home.'],
  ['Stress-Free Experience', 'Selling a home can be stressful, but it doesn’t have to be with Elite Homes USA. From the moment you contact us, we manage everything, ensuring a simple and easy process. No open houses, no constant showings, no last-minute changes—just a guaranteed, straightforward sale.'],
  ['Trusted by Homeowners', 'Our track record speaks for itself. We’ve helped numerous homeowners sell their properties quickly, providing peace of mind and fast cash offers. Our clients trust us for our integrity, reliability, and commitment to delivering results.'],
];

export const properties = [
  { title: 'Single-family homes', image: 'family', detail: 'We review detached homes across a range of conditions. Share the address and tell us about the property and your plans.' },
  { title: 'Townhomes', image: 'townhome', detail: 'Let us know about any association dues or rules that affect the property. We’ll review the details with you.' },
  { title: 'Condominiums', image: 'condo', detail: 'Association documents, assessments and occupancy can affect the review. Share the information you have on hand.' },
  { title: 'Multifamily properties', image: 'multi', detail: 'Tell us the number of units and whether they are occupied. We’ll ask for any additional information needed to review the property.' },
  { title: 'Homes needing repairs', image: 'suburban', detail: 'Share the repairs or updates you know about. You can request a review with the home in its current condition.' },
];

export const steps = [
  { title: 'Tell us about your home', detail: 'Share the address, the condition and your preferred timeline. We’ll follow up if we need a closer look.' },
  { title: 'Review the cash offer', detail: 'If the home qualifies, we’ll walk through the offer and its terms. You decide whether it works for you.' },
  { title: 'Agree on a closing date', detail: 'If you accept, we’ll coordinate the closing steps with you and agree on a date that fits your plans.' },
];

export const faqs = [
  ['How long does the process take?', 'The company’s published process describes potential offers within 24 hours and closings in as little as seven days. The property review, title, closing requirements and your schedule determine what’s possible.'],
  ['Do I need to make repairs first?', 'You can ask for an offer with the home as it is. Tell us about any repairs or updates it needs so we can consider them during the review.'],
  ['What about fees and commissions?', 'Elite Homes USA’s direct buying service is presented without a listing agent commission or hidden fees. Ask what closing costs apply to your transaction and review the written offer so you know your estimated proceeds.'],
  ['What types of properties do you consider?', 'We consider single-family homes, townhomes, condominiums and multifamily properties, including homes that need work. Eligibility depends on the individual property.'],
  ['What happens at closing?', 'The closing team coordinates title review and documents. We’ll agree on a date and explain the steps and terms before you decide to move forward.'],
];

export const comparison = [
  ['Preparation', 'Repairs, cleaning or staging may be recommended.', 'Begin with the home in its current condition.'],
  ['Showings', 'Potential buyers may tour the home over several days or weeks.', 'A property review can replace repeated showings.'],
  ['Financing', 'An offer may depend on mortgage approval and an appraisal.', 'Review the terms of a direct cash offer.'],
  ['Timeline', 'Timing may depend on listing activity and buyer contingencies.', 'Discuss a date that works for both parties.'],
  ['Costs', 'Commissions and closing expenses depend on the agreement.', 'Review any costs listed in the written offer.'],
];


export const sellerReviews = [
  { name: 'John M.', title: 'A sale without the prep', detail: 'John described getting a cash offer within 24 hours, avoiding repairs and showings, and closing on a schedule that worked for him.' },
  { name: 'David R.', title: 'Questions answered at every step', detail: 'David was initially skeptical about selling quickly. He said the team walked him through each step, answered his questions and made the process easier.' },
  { name: 'Michael B.', title: 'Support when timing mattered', detail: 'Michael needed to sell quickly and highlighted the team’s professionalism, responsiveness and attention to his situation.' },
];
