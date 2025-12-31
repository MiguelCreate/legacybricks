import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { InfoTooltip } from "@/components/ui/InfoTooltip";
import { InvestmentAnalysis } from "@/lib/rendementsCalculations";
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer, 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  Tooltip,
  Legend,
  LineChart,
  Line,
  CartesianGrid,
  Area,
  AreaChart
} from "recharts";
import { PieChart as PieChartIcon, BarChart3, TrendingUp } from "lucide-react";

interface VisualChartsProps {
  analysis: InvestmentAnalysis;
}

const COLORS = {
  income: '#10B981',
  mortgage: '#F59E0B', 
  opex: '#EF4444',
  net: '#4A6CF7',
  cumulative: '#8B5CF6',
};

export function VisualCharts({ analysis }: VisualChartsProps) {
  const year1 = analysis.yearlyCashflows[0];
  
  // Income vs Expenses pie chart data
  const incomeExpenseData = [
    { name: 'Netto Cashflow', value: Math.max(0, year1?.netCashflow || 0), color: COLORS.net },
    { name: 'Hypotheeklasten', value: year1?.debtService || 0, color: COLORS.mortgage },
    { name: 'Exploitatiekosten', value: year1?.opex || 0, color: COLORS.opex },
  ];

  // Cashflow over time
  const cashflowData = analysis.yearlyCashflows
    .filter((_, i) => i === 0 || (i + 1) % 2 === 0 || i === analysis.yearlyCashflows.length - 1)
    .map(cf => ({
      jaar: `Jaar ${cf.year}`,
      'Bruto Huur': Math.round(cf.grossRent),
      'OPEX': Math.round(cf.opex),
      'Hypotheek': Math.round(cf.debtService),
      'Netto CF': Math.round(cf.netCashflow),
    }));

  // Cumulative wealth chart
  const wealthData = analysis.yearlyCashflows.map(cf => ({
    jaar: cf.year,
    cashflow: Math.round(cf.cumulativeCashflow),
  }));

  // Investment breakdown
  const investmentBreakdown = [
    { name: 'Eigen Inleg', value: analysis.ownCapital, color: '#4A6CF7' },
    { name: 'Hypotheek', value: analysis.loanAmount, color: '#F59E0B' },
  ];

  const formatCurrency = (value: number) => `€${value.toLocaleString('nl-NL')}`;
  const formatCurrencyShort = (value: number) => {
    if (value >= 1000) return `€${(value / 1000).toFixed(0)}k`;
    return `€${value}`;
  };

  return (
    <div className="space-y-4">
      {/* Top row: Investment breakdown + Income distribution */}
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Investment Breakdown */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Financieringsstructuur
              <InfoTooltip 
                title="Financieringsstructuur"
                content="Dit diagram toont hoe je investering is opgebouwd: hoeveel eigen geld vs. geleend geld."
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={investmentBreakdown}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false}
                  >
                    {investmentBreakdown.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-4 mt-2">
              {investmentBreakdown.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Income Distribution */}
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-sm flex items-center gap-2">
              <PieChartIcon className="h-4 w-4 text-primary" />
              Verdeling Huurinkomsten (Jaar 1)
              <InfoTooltip 
                title="Verdeling Huurinkomsten"
                content="Dit toont waar je huurinkomsten naartoe gaan: hypotheek, kosten, en wat je overhoudt."
              />
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-40">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={incomeExpenseData}
                    cx="50%"
                    cy="50%"
                    innerRadius={35}
                    outerRadius={60}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {incomeExpenseData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatCurrency(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex justify-center gap-3 mt-2 flex-wrap">
              {incomeExpenseData.map((item, i) => (
                <div key={i} className="flex items-center gap-1.5 text-xs">
                  <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                  <span className="text-muted-foreground">{item.name}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Cashflow Bar Chart */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-primary" />
            Cashflow Overzicht per Jaar
            <InfoTooltip 
              title="Cashflow Overzicht"
              content="Dit staafdiagram toont de ontwikkeling van je inkomsten, kosten en netto cashflow over de jaren."
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashflowData} margin={{ left: 10, right: 10 }}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="jaar" tick={{ fontSize: 11 }} />
                <YAxis tickFormatter={formatCurrencyShort} tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Bruto Huur" fill={COLORS.income} radius={[4, 4, 0, 0]} />
                <Bar dataKey="OPEX" fill={COLORS.opex} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Hypotheek" fill={COLORS.mortgage} radius={[4, 4, 0, 0]} />
                <Bar dataKey="Netto CF" fill={COLORS.net} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Cumulative Wealth Chart */}
      <Card className="shadow-card">
        <CardHeader className="pb-2">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-primary" />
            Cumulatieve Cashflow Over Tijd
            <InfoTooltip 
              title="Cumulatieve Cashflow"
              content="Dit laat zien hoeveel je totaal hebt verdiend of verloren over de tijd. Het startpunt is je eigen inleg (negatief)."
            />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={wealthData} margin={{ left: 10, right: 10 }}>
                <defs>
                  <linearGradient id="colorCashflow" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor={COLORS.cumulative} stopOpacity={0.3}/>
                    <stop offset="95%" stopColor={COLORS.cumulative} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis 
                  dataKey="jaar" 
                  tick={{ fontSize: 11 }}
                  tickFormatter={(v) => `Jaar ${v}`}
                />
                <YAxis tickFormatter={formatCurrencyShort} tick={{ fontSize: 11 }} />
                <Tooltip 
                  formatter={(value: number) => [formatCurrency(value), 'Cumulatief']}
                  labelFormatter={(label) => `Jaar ${label}`}
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--card))', 
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '8px',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="cashflow"
                  stroke={COLORS.cumulative}
                  strokeWidth={2}
                  fill="url(#colorCashflow)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-2">
            Na {analysis.yearlyCashflows.length} jaar: {formatCurrency(analysis.yearlyCashflows[analysis.yearlyCashflows.length - 1]?.cumulativeCashflow || 0)} cumulatieve cashflow
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
