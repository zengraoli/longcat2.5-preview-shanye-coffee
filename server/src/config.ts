/** 全局配置：均可通过环境变量覆盖，方便测试与冒烟脚本使用临时数据库。 */
export const config = {
  host: process.env.HOST ?? '0.0.0.0',
  port: Number(process.env.PORT ?? 3300),
  /** SQLite 文件路径；测试时用 :memory: 或临时文件 */
  dbFile: process.env.DB_FILE ?? 'data/app.db',
  /** 登录 token 有效期（小时） */
  tokenTtlHours: Number(process.env.TOKEN_TTL_HOURS ?? 72),
  /** 会员登录固定验证码（模拟短信） */
  memberCode: process.env.MEMBER_CODE ?? '123456',
} as const;
