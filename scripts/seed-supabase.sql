-- BudgetSync Supabase Seed Data
-- Replace YOUR_USER_ID with your actual Supabase auth.users id
-- Replace category IDs with your local SQLite category IDs
-- (run: SELECT id, name FROM categories; in your local DB to get them)

-- ============================================================================
-- CONFIG: Set your user ID here
-- ============================================================================
-- Example: SET my.user_id = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';

-- ============================================================================
-- ACCOUNTS
-- ============================================================================
INSERT INTO accounts (id, name, type, last4, balance, currency, created_at, user_id) VALUES
  ('acct-chk-0001-0000-000000000001', 'TD Chequing',    'bank',        '4532', 2847.63, 'CAD', '2025-11-15T10:00:00Z', 'YOUR_USER_ID'),
  ('acct-sav-0002-0000-000000000002', 'TD Savings',     'bank',        '8891', 12450.00, 'CAD', '2025-11-15T10:00:00Z', 'YOUR_USER_ID'),
  ('acct-visa-003-0000-000000000003', 'CIBC Visa',      'credit_card', '7721', -1263.47, 'CAD', '2025-12-01T10:00:00Z', 'YOUR_USER_ID'),
  ('acct-tfsa-004-0000-000000000004', 'Wealthsimple TFSA', 'investment', NULL, 8920.00, 'CAD', '2026-01-10T10:00:00Z', 'YOUR_USER_ID')
ON CONFLICT (id) DO UPDATE SET
  balance = EXCLUDED.balance,
  name = EXCLUDED.name;

-- ============================================================================
-- TRANSACTIONS: February 2026
-- ============================================================================
INSERT INTO transactions (id, account_id, category_id, type, amount, note, date, created_at, user_id) VALUES
  -- Salary
  ('tx-2602-sal-01', 'acct-chk-0001-0000-000000000001', 'SALARY_CAT_ID',      'income',  3850.00, 'Biweekly pay',          '2026-02-06', '2026-02-06T09:00:00Z', 'YOUR_USER_ID'),
  ('tx-2602-sal-02', 'acct-chk-0001-0000-000000000001', 'SALARY_CAT_ID',      'income',  3850.00, 'Biweekly pay',          '2026-02-20', '2026-02-20T09:00:00Z', 'YOUR_USER_ID'),
  -- Rent
  ('tx-2602-rnt-01', 'acct-chk-0001-0000-000000000001', 'RENT_CAT_ID',        'expense', 1950.00, 'Feb rent - 1BR Yonge',  '2026-02-01', '2026-02-01T08:00:00Z', 'YOUR_USER_ID'),
  -- Groceries
  ('tx-2602-gro-01', 'acct-visa-003-0000-000000000003', 'GROCERIES_CAT_ID',   'expense',   67.42, 'Loblaws weekly',        '2026-02-02', '2026-02-02T18:30:00Z', 'YOUR_USER_ID'),
  ('tx-2602-gro-02', 'acct-visa-003-0000-000000000003', 'GROCERIES_CAT_ID',   'expense',   54.18, 'No Frills',             '2026-02-09', '2026-02-09T14:15:00Z', 'YOUR_USER_ID'),
  ('tx-2602-gro-03', 'acct-visa-003-0000-000000000003', 'GROCERIES_CAT_ID',   'expense',   71.93, 'Loblaws weekly',        '2026-02-16', '2026-02-16T17:45:00Z', 'YOUR_USER_ID'),
  ('tx-2602-gro-04', 'acct-visa-003-0000-000000000003', 'GROCERIES_CAT_ID',   'expense',   48.67, 'T&T Supermarket',       '2026-02-23', '2026-02-23T12:00:00Z', 'YOUR_USER_ID'),
  -- Dining
  ('tx-2602-din-01', 'acct-visa-003-0000-000000000003', 'DINING_CAT_ID',      'expense',   42.50, 'Pai Northern Thai',     '2026-02-07', '2026-02-07T19:30:00Z', 'YOUR_USER_ID'),
  ('tx-2602-din-02', 'acct-visa-003-0000-000000000003', 'DINING_CAT_ID',      'expense',   18.75, 'Tim Hortons',           '2026-02-12', '2026-02-12T08:15:00Z', 'YOUR_USER_ID'),
  ('tx-2602-din-03', 'acct-visa-003-0000-000000000003', 'DINING_CAT_ID',      'expense',   65.00, 'Birthday dinner',       '2026-02-14', '2026-02-14T20:00:00Z', 'YOUR_USER_ID'),
  ('tx-2602-din-04', 'acct-visa-003-0000-000000000003', 'DINING_CAT_ID',      'expense',   15.20, 'Subway lunch',          '2026-02-19', '2026-02-19T12:30:00Z', 'YOUR_USER_ID'),
  -- Transport
  ('tx-2602-trn-01', 'acct-chk-0001-0000-000000000001', 'TRANSPORT_CAT_ID',   'expense',  156.00, 'TTC monthly pass',      '2026-02-01', '2026-02-01T07:00:00Z', 'YOUR_USER_ID'),
  ('tx-2602-trn-02', 'acct-visa-003-0000-000000000003', 'TRANSPORT_CAT_ID',   'expense',   24.50, 'Uber to airport',       '2026-02-15', '2026-02-15T05:30:00Z', 'YOUR_USER_ID'),
  -- Utilities
  ('tx-2602-utl-01', 'acct-chk-0001-0000-000000000001', 'UTILITIES_CAT_ID',   'expense',   85.40, 'Toronto Hydro',         '2026-02-10', '2026-02-10T10:00:00Z', 'YOUR_USER_ID'),
  ('tx-2602-utl-02', 'acct-chk-0001-0000-000000000001', 'UTILITIES_CAT_ID',   'expense',   65.00, 'Bell internet',         '2026-02-15', '2026-02-15T10:00:00Z', 'YOUR_USER_ID'),
  -- Entertainment
  ('tx-2602-ent-01', 'acct-visa-003-0000-000000000003', 'ENTERTAINMENT_CAT_ID','expense',   16.99, 'Netflix',               '2026-02-05', '2026-02-05T10:00:00Z', 'YOUR_USER_ID'),
  ('tx-2602-ent-02', 'acct-visa-003-0000-000000000003', 'ENTERTAINMENT_CAT_ID','expense',   45.00, 'Raptors vs Celtics tix','2026-02-22', '2026-02-22T18:00:00Z', 'YOUR_USER_ID'),
  -- Shopping
  ('tx-2602-shp-01', 'acct-visa-003-0000-000000000003', 'SHOPPING_CAT_ID',    'expense',  129.99, 'Winter jacket - Uniqlo','2026-02-08', '2026-02-08T15:00:00Z', 'YOUR_USER_ID'),
  -- Savings transfer
  ('tx-2602-sav-01', 'acct-sav-0002-0000-000000000002', 'SALARY_CAT_ID',      'income',   500.00, 'Monthly savings',       '2026-02-21', '2026-02-21T09:00:00Z', 'YOUR_USER_ID'),

-- ============================================================================
-- TRANSACTIONS: March 2026
-- ============================================================================
  -- Salary
  ('tx-2603-sal-01', 'acct-chk-0001-0000-000000000001', 'SALARY_CAT_ID',      'income',  3850.00, 'Biweekly pay',          '2026-03-06', '2026-03-06T09:00:00Z', 'YOUR_USER_ID'),
  ('tx-2603-sal-02', 'acct-chk-0001-0000-000000000001', 'SALARY_CAT_ID',      'income',  3850.00, 'Biweekly pay',          '2026-03-20', '2026-03-20T09:00:00Z', 'YOUR_USER_ID'),
  -- Freelance
  ('tx-2603-frl-01', 'acct-chk-0001-0000-000000000001', 'FREELANCE_CAT_ID',   'income',   750.00, 'Logo design project',   '2026-03-12', '2026-03-12T14:00:00Z', 'YOUR_USER_ID'),
  -- Rent
  ('tx-2603-rnt-01', 'acct-chk-0001-0000-000000000001', 'RENT_CAT_ID',        'expense', 1950.00, 'Mar rent',              '2026-03-01', '2026-03-01T08:00:00Z', 'YOUR_USER_ID'),
  -- Groceries
  ('tx-2603-gro-01', 'acct-visa-003-0000-000000000003', 'GROCERIES_CAT_ID',   'expense',   72.15, 'Loblaws weekly',        '2026-03-01', '2026-03-01T17:00:00Z', 'YOUR_USER_ID'),
  ('tx-2603-gro-02', 'acct-visa-003-0000-000000000003', 'GROCERIES_CAT_ID',   'expense',   43.80, 'No Frills',             '2026-03-08', '2026-03-08T11:00:00Z', 'YOUR_USER_ID'),
  ('tx-2603-gro-03', 'acct-visa-003-0000-000000000003', 'GROCERIES_CAT_ID',   'expense',   88.42, 'Costco run',            '2026-03-15', '2026-03-15T14:30:00Z', 'YOUR_USER_ID'),
  ('tx-2603-gro-04', 'acct-visa-003-0000-000000000003', 'GROCERIES_CAT_ID',   'expense',   51.20, 'Loblaws weekly',        '2026-03-22', '2026-03-22T16:00:00Z', 'YOUR_USER_ID'),
  ('tx-2603-gro-05', 'acct-visa-003-0000-000000000003', 'GROCERIES_CAT_ID',   'expense',   39.65, 'H Mart Korean groceries','2026-03-29', '2026-03-29T13:00:00Z', 'YOUR_USER_ID'),
  -- Dining
  ('tx-2603-din-01', 'acct-visa-003-0000-000000000003', 'DINING_CAT_ID',      'expense',   38.90, 'Ramen Isshin',          '2026-03-05', '2026-03-05T19:00:00Z', 'YOUR_USER_ID'),
  ('tx-2603-din-02', 'acct-visa-003-0000-000000000003', 'DINING_CAT_ID',      'expense',   12.50, 'Starbucks',             '2026-03-10', '2026-03-10T08:00:00Z', 'YOUR_USER_ID'),
  ('tx-2603-din-03', 'acct-visa-003-0000-000000000003', 'DINING_CAT_ID',      'expense',   55.00, 'Team lunch',            '2026-03-18', '2026-03-18T12:30:00Z', 'YOUR_USER_ID'),
  ('tx-2603-din-04', 'acct-visa-003-0000-000000000003', 'DINING_CAT_ID',      'expense',   22.30, 'Pho Tien Thanh',        '2026-03-25', '2026-03-25T18:45:00Z', 'YOUR_USER_ID'),
  -- Transport
  ('tx-2603-trn-01', 'acct-chk-0001-0000-000000000001', 'TRANSPORT_CAT_ID',   'expense',  156.00, 'TTC monthly pass',      '2026-03-01', '2026-03-01T07:00:00Z', 'YOUR_USER_ID'),
  ('tx-2603-trn-02', 'acct-visa-003-0000-000000000003', 'TRANSPORT_CAT_ID',   'expense',   18.75, 'Uber to dinner',        '2026-03-18', '2026-03-18T19:00:00Z', 'YOUR_USER_ID'),
  -- Utilities
  ('tx-2603-utl-01', 'acct-chk-0001-0000-000000000001', 'UTILITIES_CAT_ID',   'expense',   78.20, 'Toronto Hydro',         '2026-03-10', '2026-03-10T10:00:00Z', 'YOUR_USER_ID'),
  ('tx-2603-utl-02', 'acct-chk-0001-0000-000000000001', 'UTILITIES_CAT_ID',   'expense',   65.00, 'Bell internet',         '2026-03-15', '2026-03-15T10:00:00Z', 'YOUR_USER_ID'),
  ('tx-2603-utl-03', 'acct-chk-0001-0000-000000000001', 'UTILITIES_CAT_ID',   'expense',   45.00, 'Phone plan',            '2026-03-15', '2026-03-15T10:00:00Z', 'YOUR_USER_ID'),
  -- Entertainment
  ('tx-2603-ent-01', 'acct-visa-003-0000-000000000003', 'ENTERTAINMENT_CAT_ID','expense',   16.99, 'Netflix',               '2026-03-05', '2026-03-05T10:00:00Z', 'YOUR_USER_ID'),
  ('tx-2603-ent-02', 'acct-visa-003-0000-000000000003', 'ENTERTAINMENT_CAT_ID','expense',   89.99, 'Concert tickets',       '2026-03-28', '2026-03-28T10:00:00Z', 'YOUR_USER_ID'),
  -- Shopping
  ('tx-2603-shp-01', 'acct-visa-003-0000-000000000003', 'SHOPPING_CAT_ID',    'expense',   64.99, 'Running shoes sale',    '2026-03-14', '2026-03-14T16:00:00Z', 'YOUR_USER_ID'),
  -- Savings transfer
  ('tx-2603-sav-01', 'acct-sav-0002-0000-000000000002', 'SALARY_CAT_ID',      'income',   500.00, 'Monthly savings',       '2026-03-21', '2026-03-21T09:00:00Z', 'YOUR_USER_ID'),

-- ============================================================================
-- TRANSACTIONS: April 2026 (current month, partial)
-- ============================================================================
  -- Salary
  ('tx-2604-sal-01', 'acct-chk-0001-0000-000000000001', 'SALARY_CAT_ID',      'income',  3850.00, 'Biweekly pay',          '2026-04-03', '2026-04-03T09:00:00Z', 'YOUR_USER_ID'),
  -- Rent
  ('tx-2604-rnt-01', 'acct-chk-0001-0000-000000000001', 'RENT_CAT_ID',        'expense', 1950.00, 'Apr rent',              '2026-04-01', '2026-04-01T08:00:00Z', 'YOUR_USER_ID'),
  -- Groceries
  ('tx-2604-gro-01', 'acct-visa-003-0000-000000000003', 'GROCERIES_CAT_ID',   'expense',   82.35, 'Costco run',            '2026-04-04', '2026-04-04T15:00:00Z', 'YOUR_USER_ID'),
  ('tx-2604-gro-02', 'acct-visa-003-0000-000000000003', 'GROCERIES_CAT_ID',   'expense',   37.90, 'No Frills midweek',     '2026-04-07', '2026-04-07T18:00:00Z', 'YOUR_USER_ID'),
  -- Dining
  ('tx-2604-din-01', 'acct-visa-003-0000-000000000003', 'DINING_CAT_ID',      'expense',   28.50, 'Banh Mi Boys',          '2026-04-02', '2026-04-02T12:30:00Z', 'YOUR_USER_ID'),
  ('tx-2604-din-02', 'acct-visa-003-0000-000000000003', 'DINING_CAT_ID',      'expense',   14.25, 'Second Cup',            '2026-04-06', '2026-04-06T09:00:00Z', 'YOUR_USER_ID'),
  -- Transport
  ('tx-2604-trn-01', 'acct-chk-0001-0000-000000000001', 'TRANSPORT_CAT_ID',   'expense',  156.00, 'TTC monthly pass',      '2026-04-01', '2026-04-01T07:00:00Z', 'YOUR_USER_ID'),
  -- Utilities
  ('tx-2604-utl-01', 'acct-chk-0001-0000-000000000001', 'UTILITIES_CAT_ID',   'expense',   82.10, 'Toronto Hydro',         '2026-04-07', '2026-04-07T10:00:00Z', 'YOUR_USER_ID'),
  -- Entertainment
  ('tx-2604-ent-01', 'acct-visa-003-0000-000000000003', 'ENTERTAINMENT_CAT_ID','expense',   16.99, 'Netflix',               '2026-04-05', '2026-04-05T10:00:00Z', 'YOUR_USER_ID')

ON CONFLICT (id) DO UPDATE SET
  amount = EXCLUDED.amount,
  note = EXCLUDED.note,
  date = EXCLUDED.date;
