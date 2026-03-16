-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  bank_name TEXT NOT NULL,
  payee TEXT NOT NULL,
  address TEXT,
  dv_number TEXT,
  particulars TEXT,
  amount NUMERIC(15, 2) NOT NULL,
  date DATE NOT NULL,
  check_number TEXT,
  control_number TEXT,
  account_code TEXT,
  debit NUMERIC(15, 2) DEFAULT 0,
  credit NUMERIC(15, 2) DEFAULT 0,
  remarks TEXT,
  fund TEXT DEFAULT 'General Fund',
  responsibility_center TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create viewer_access table
CREATE TABLE IF NOT EXISTS viewer_access (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(viewer_id, entry_user_id)
);

-- Create transaction_batches table
CREATE TABLE IF NOT EXISTS transaction_batches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  viewer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  entry_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  batch_name TEXT,
  transaction_count INTEGER DEFAULT 0,
  total_amount NUMERIC(15, 2) DEFAULT 0,
  applied_filters JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create batch_transactions table
CREATE TABLE IF NOT EXISTS batch_transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  batch_id UUID NOT NULL REFERENCES transaction_batches(id) ON DELETE CASCADE,
  transaction_id UUID NOT NULL,
  transaction_data JSONB NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create Indexes for performance
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_viewer_access_viewer_id ON viewer_access(viewer_id);
CREATE INDEX IF NOT EXISTS idx_viewer_access_entry_user_id ON viewer_access(entry_user_id);
CREATE INDEX IF NOT EXISTS idx_transaction_batches_viewer_id ON transaction_batches(viewer_id);
CREATE INDEX IF NOT EXISTS idx_batch_transactions_batch_id ON batch_transactions(batch_id);

-- Enable Row Level Security
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE viewer_access ENABLE ROW LEVEL SECURITY;
ALTER TABLE transaction_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE batch_transactions ENABLE ROW LEVEL SECURITY;

-- Note: Policies need to be added based on specific app requirements.
-- For now, we will assume the API routes handle the security logic since they use a service role 
-- or because the client is used on the server side.
