/**
 * The choices offered on the enquiry form. The same lists are enforced again by the database function
 * (supabase/migrations/009_detailed_inquiry.sql), so keep the two in step when you change one.
 */
export const ROLES = ['Owner', 'Executive', 'Manager', 'Operations', 'Technical', 'Sales', 'Marketing', 'Finance', 'Other'] as const
export const COMPANY_SIZES = ['Solo or freelancer', '2 to 10 employees', '11 to 50 employees', '51 to 200 employees', '200+ employees'] as const
export const REVENUES = ['Less than $100K', '$100K-$500K', '$500K-$1M', '$1M-$2M', 'More than $2M'] as const
export const BUDGETS = ['Less than $10K', '$10K-$50K', '$50K-$100K', 'More than $100K'] as const
export const INTERESTS = [
  'Website design or development',
  'Lead generation or sales',
  'Customer support',
  'Internal operations',
  'Data processing or reporting',
  'Content or marketing workflows',
  'Not sure yet',
] as const
