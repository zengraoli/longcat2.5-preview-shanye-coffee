import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';

export default function Dashboard() {
  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-brand-900">数据看板</h1>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {['今日营业额', '订单量', '客单价', '新增会员'].map((t) => (
          <Card key={t}>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-brand-500">{t}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-brand-900">-</div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
