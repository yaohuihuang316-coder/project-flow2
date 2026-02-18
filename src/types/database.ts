/**
 * Supabase 数据库类型定义
 * 由用户提供服务角色密钥，Kimi 可连接数据库
 */

export interface Database {
  public: {
    Tables: {
      // 示例表，根据实际数据库修改
      users: {
        Row: {
          id: string;
          email: string;
          name: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          email: string;
          name?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string | null;
          created_at?: string;
        };
      };
    };
    Views: {};
    Functions: {};
    Enums: {};
  };
}

// 便捷类型导出
export type Tables = Database['public']['Tables'];
export type TableNames = keyof Tables;
