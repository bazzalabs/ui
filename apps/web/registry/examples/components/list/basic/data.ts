export interface Transaction {
  id: string
  date: string
  name: string
  category: 'Income' | 'Groceries' | 'Travel' | 'Software' | 'Utilities'
  status: 'posted' | 'pending'
  amountCents: number
  currency: string
}

export const transactions: Transaction[] = [
  {
    id: 'salary-jul',
    date: '2025-07-12',
    name: 'Acme Corp. Payroll',
    category: 'Income',
    status: 'posted',
    amountCents: 485000,
    currency: 'USD',
  },
  {
    id: 'freelance-jul',
    date: '2025-07-10',
    name: 'Freelance invoice',
    category: 'Income',
    status: 'pending',
    amountCents: 125000,
    currency: 'USD',
  },
  {
    id: 'whole-foods',
    date: '2025-07-12',
    name: 'Whole Foods Market',
    category: 'Groceries',
    status: 'posted',
    amountCents: -8432,
    currency: 'USD',
  },
  {
    id: 'farmers-market',
    date: '2025-07-09',
    name: 'Farmers Market',
    category: 'Groceries',
    status: 'posted',
    amountCents: -3675,
    currency: 'USD',
  },
  {
    id: 'corner-grocery',
    date: '2025-07-03',
    name: 'Corner Grocery',
    category: 'Groceries',
    status: 'pending',
    amountCents: -2198,
    currency: 'USD',
  },
  {
    id: 'delta-flight',
    date: '2025-07-08',
    name: 'Delta Air Lines',
    category: 'Travel',
    status: 'posted',
    amountCents: -32740,
    currency: 'USD',
  },
  {
    id: 'city-cab',
    date: '2025-06-29',
    name: 'City Cab',
    category: 'Travel',
    status: 'posted',
    amountCents: -2450,
    currency: 'USD',
  },
  {
    id: 'figma',
    date: '2025-07-05',
    name: 'Figma',
    category: 'Software',
    status: 'posted',
    amountCents: -1500,
    currency: 'USD',
  },
  {
    id: 'github',
    date: '2025-07-01',
    name: 'GitHub',
    category: 'Software',
    status: 'pending',
    amountCents: -4400,
    currency: 'USD',
  },
  {
    id: 'netflix',
    date: '2025-06-27',
    name: 'Netflix',
    category: 'Software',
    status: 'posted',
    amountCents: -1799,
    currency: 'USD',
  },
  {
    id: 'electric-company',
    date: '2025-07-06',
    name: 'Electric Company',
    category: 'Utilities',
    status: 'posted',
    amountCents: -9218,
    currency: 'USD',
  },
  {
    id: 'internet-provider',
    date: '2025-07-02',
    name: 'Internet Provider',
    category: 'Utilities',
    status: 'pending',
    amountCents: -7900,
    currency: 'USD',
  },
  {
    id: 'water-service',
    date: '2025-06-25',
    name: 'Water Service',
    category: 'Utilities',
    status: 'posted',
    amountCents: -4525,
    currency: 'USD',
  },
  {
    id: 'mobile-plan',
    date: '2025-06-22',
    name: 'Mobile Plan',
    category: 'Utilities',
    status: 'posted',
    amountCents: -6500,
    currency: 'USD',
  },
]

export function formatAmount({ amountCents, currency }: Transaction) {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency,
  }).format(amountCents / 100)
}

export function formatDate(date: string) {
  return new Intl.DateTimeFormat(undefined, {
    month: 'short',
    day: 'numeric',
  }).format(new Date(`${date}T00:00:00`))
}
