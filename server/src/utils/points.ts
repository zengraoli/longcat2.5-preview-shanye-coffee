export type MemberLevel = '银卡' | '金卡' | '黑卡';

export function getMemberLevel(points: number): MemberLevel {
  if (points >= 2000) return '黑卡';
  if (points >= 500) return '金卡';
  return '银卡';
}

export function calcPointsFromAmount(paidAmountFen: number): number {
  return Math.floor(paidAmountFen / 100);
}
