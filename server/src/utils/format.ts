export function maskPhone(phone: string): string {
  if (phone.length < 7) return phone;
  return phone.slice(0, 3) + '****' + phone.slice(-4);
}

export function memberLevel(points: number): '银卡' | '金卡' | '黑卡' {
  if (points >= 2000) return '黑卡';
  if (points >= 500) return '金卡';
  return '银卡';
}

export function formatTime(iso: string): string {
  const d = new Date(iso);
  return d.toISOString().slice(11, 16);
}
