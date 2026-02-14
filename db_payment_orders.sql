-- ==========================================
-- 支付订单表
-- ==========================================

CREATE TABLE IF NOT EXISTS payment_orders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id TEXT NOT NULL REFERENCES app_users(id) ON DELETE CASCADE,
    plan_id TEXT NOT NULL, -- 'pro' or 'pro_plus'
    billing_cycle TEXT NOT NULL, -- 'monthly' or 'yearly'
    amount INTEGER NOT NULL, -- 金额（分）
    payment_method TEXT, -- 'alipay', 'wechat', null
    status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed', 'cancelled'
    paid_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE payment_orders ENABLE ROW LEVEL SECURITY;

-- 用户只能看到自己的订单
CREATE POLICY "view_own_orders" ON payment_orders FOR SELECT USING (user_id = auth.uid()::TEXT);
CREATE POLICY "insert_own_orders" ON payment_orders FOR INSERT WITH CHECK (user_id = auth.uid()::TEXT);
CREATE POLICY "update_own_orders" ON payment_orders FOR UPDATE USING (user_id = auth.uid()::TEXT);

-- 索引
CREATE INDEX IF NOT EXISTS idx_payment_orders_user ON payment_orders(user_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_payment_orders_status ON payment_orders(status);

SELECT '支付订单表创建完成' as status;
