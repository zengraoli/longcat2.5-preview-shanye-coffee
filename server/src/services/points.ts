/**
 * 积分与会员等级纯函数服务。
 * 规则：每消费 1 元（实付）积 1 分；银卡 0 分、金卡 500 分、黑卡 2000 分，自动升级。
 */

export type MemberLevel = 'silver' | 'gold' | 'black';

export interface LevelInfo {
  level: MemberLevel;
  name: string;
  points: number;
  /** 下一等级；已达最高等级时为 null */
  nextLevel: MemberLevel | null;
  /** 距下一等级还差的分数；已达最高等级时为 null */
  pointsToNext: number | null;
}

/** 按积分计算会员等级。 */
export function levelForPoints(points: number): LevelInfo {
  if (points >= 2000) {
    return { level: 'black', name: '黑卡', points, nextLevel: null, pointsToNext: null };
  }
  if (points >= 500) {
    return { level: 'gold', name: '金卡', points, nextLevel: 'black', pointsToNext: 2000 - points };
  }
  return { level: 'silver', name: '银卡', points, nextLevel: 'gold', pointsToNext: 500 - points };
}

/** 按实付金额（分）计算积分：每 1 元（100 分）积 1 分，向下取整。 */
export function pointsForAmount(payableAmount: number): number {
  if (payableAmount <= 0) return 0;
  return Math.floor(payableAmount / 100);
}
