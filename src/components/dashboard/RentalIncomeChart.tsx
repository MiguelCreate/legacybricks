import { useState, useEffect } from "react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { TrendingUp, Calendar } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { format, subMonths, startOfMonth, endOfMonth, parseISO } from "date-fns";
import { nl } from "date-fns/locale";

type Payment = {
  id: string;
  datum: string;
  bedrag: number;
  property_id: string;
};

type MonthlyData = {
  month: string;
  monthLabel: string;
  income: number;
};

export const RentalIncomeChart = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6");

  useEffect(() => {
    if (user) {
      fetchPayments();
    }
  }, [user]);

  const fetchPayments = async () => {
    try {
      const { data, error } = await supabase
        .from("payments")
        .select("id, datum, bedrag, property_id")
        .order("datum", { ascending: true });

      if (error) throw error;
      setPayments(data || []);
    } catch (error) {
      console.error("Error fetching payments:", error);
    } finally {
      setLoading(false);
    }
  };

  const getChartData = (): MonthlyData[] => {
    const months = parseInt(period);
    const data: MonthlyData[] = [];
    const now = new Date();

    for (let i = months - 1; i >= 0; i--) {
      const monthDate = subMonths(now, i);
      const monthStart = startOfMonth(monthDate);
      const monthEnd = endOfMonth(monthDate);
      const monthKey = format(monthDate, "yyyy-MM");
      const monthLabel = format(monthDate, "MMM yy", { locale: nl });

      const monthPayments = payments.filter((p) => {
        const paymentDate = parseISO(p.datum);
        return paymentDate >= monthStart && paymentDate <= monthEnd;
      });

      const totalIncome = monthPayments.reduce((sum, p) => sum + Number(p.bedrag), 0);

      data.push({
        month: monthKey,
        monthLabel,
        income: totalIncome,
      });
    }

    return data;
  };

  const chartData = getChartData();
  const totalIncome = chartData.reduce((sum, d) => sum + d.income, 0);
  const avgIncome = chartData.length > 0 ? totalIncome / chartData.length : 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-sm text-success">
            €{payload[0].value.toLocaleString("nl-NL")}
          </p>
        </div>
      );
    }
    return null;
  };

  if (loading) {
    return (
      <Card className="animate-pulse">
        <CardHeader className="pb-2">
          <div className="h-6 bg-muted rounded w-1/3" />
        </CardHeader>
        <CardContent>
          <div className="h-48 bg-muted rounded" />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-success" />
            <CardTitle className="text-base font-semibold">Huurinkomsten</CardTitle>
          </div>
          <Select value={period} onValueChange={setPeriod}>
            <SelectTrigger className="w-28 h-8 text-xs">
              <Calendar className="w-3 h-3 mr-1" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="3">3 maanden</SelectItem>
              <SelectItem value="6">6 maanden</SelectItem>
              <SelectItem value="12">12 maanden</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="flex items-baseline gap-4 mt-2">
          <div>
            <p className="text-2xl font-bold text-foreground">
              €{totalIncome.toLocaleString("nl-NL")}
            </p>
            <p className="text-xs text-muted-foreground">Totaal ({period} mnd)</p>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-muted-foreground">
              €{Math.round(avgIncome).toLocaleString("nl-NL")}
            </p>
            <p className="text-xs text-muted-foreground">Gem. per maand</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Nog geen betalingen geregistreerd
          </div>
        ) : (
          <div className="h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
                <defs>
                  <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(var(--success))" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(var(--success))" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis
                  dataKey="monthLabel"
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={{ stroke: "hsl(var(--border))" }}
                  tickLine={false}
                />
                <YAxis
                  tick={{ fill: "hsl(var(--muted-foreground))", fontSize: 11 }}
                  axisLine={false}
                  tickLine={false}
                  tickFormatter={(value) => `€${value >= 1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stroke="hsl(var(--success))"
                  strokeWidth={2}
                  fill="url(#incomeGradient)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
