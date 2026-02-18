-- 创建一个函数来列出所有表名
CREATE OR REPLACE FUNCTION list_all_tables()
RETURNS TABLE (table_name text) 
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT t.table_name::text
  FROM information_schema.tables t
  WHERE t.table_schema = 'public' 
    AND t.table_type = 'BASE TABLE'
  ORDER BY t.table_name;
$$;

-- 授予执行权限
GRANT EXECUTE ON FUNCTION list_all_tables() TO authenticated;
GRANT EXECUTE ON FUNCTION list_all_tables() TO anon;
GRANT EXECUTE ON FUNCTION list_all_tables() TO service_role;

-- 创建另一个使用 execute_sql 的函数
CREATE OR REPLACE FUNCTION execute_sql(query text)
RETURNS SETOF json
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY EXECUTE query;
END;
$$;

-- 授予权限
GRANT EXECUTE ON FUNCTION execute_sql(text) TO authenticated;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO anon;
GRANT EXECUTE ON FUNCTION execute_sql(text) TO service_role;

-- 测试查询
SELECT '✅ 函数创建成功！' as status;
