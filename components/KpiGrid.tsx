import KpiCard from './KpiCard';

interface KpiGridProps {
  kpis: Array<{
    label: string;
    value: number | null;
    change?: number;
    format: 'currency' | 'percent' | 'ratio';
    color: string;
    positive?: boolean;
    helper?: string;
  }>;
}

export default function KpiGrid({ kpis }: KpiGridProps) {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
      {kpis.map((kpi, index) => (
        <KpiCard key={index} {...kpi} />
      ))}
    </div>
  );
}
