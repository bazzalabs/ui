export interface Transaction {
  id: string
  date: string
  name: string
  category: 'Income' | 'Groceries' | 'Travel' | 'Software' | 'Utilities'
  status: 'posted' | 'pending'
  amountCents: number
  currency: string
}

const names = [
  'Acme Corp. Payroll',
  'Freelance invoice',
  'Whole Foods Market',
  'Farmers Market',
  'Corner Grocery',
  'Delta Air Lines',
  'City Cab',
  'Figma',
  'GitHub',
  'Netflix',
  'Electric Company',
  'Internet Provider',
  'Water Service',
  'Mobile Plan',
]

const categories: Transaction['category'][] = [
  'Income',
  'Groceries',
  'Travel',
  'Software',
  'Utilities',
]

const amounts = [
  485000, -8432, -32740, -1500, -9218, 125000, -3675, -2450, -4400, -7900,
  25000,
]

export function makeTransactions(count: number): Transaction[] {
  const startDate = new Date(Date.UTC(2025, 6, 12))

  const transactions: Transaction[] = Array.from(
    { length: count },
    (_, index) => {
      const date = new Date(startDate)
      date.setUTCDate(startDate.getUTCDate() - index)

      return {
        id: `transaction-${index + 1}`,
        date: date.toISOString().slice(0, 10),
        name: names[index % names.length]!,
        category: categories[index % categories.length]!,
        status: index % 3 === 0 ? 'pending' : 'posted',
        amountCents: amounts[index % amounts.length]!,
        currency: 'USD',
      }
    },
  )

  return transactions.sort(
    (a, b) => categories.indexOf(a.category) - categories.indexOf(b.category),
  )
}

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
