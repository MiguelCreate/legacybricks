import { useState, useEffect } from "react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from "recharts";
import { TrendingUp, TrendingDown, Calendar } from "lucide-react";
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
};

type Expense = {
  id: string;
  datum: string;
  bedrag: number;
};

type MonthlyData = {
  month: string;
  monthLabel: string;
  income: number;
  expenses: number;
  cashflow: number;
};

export const CashflowChart = () => {
  const { user } = useAuth();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState("6");

  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);

  const fetchData = async () => {
    try {
      const [paymentsRes, expensesRes] = await Promise.all([
        supabase.from("payments").select("id, datum, bedrag").order("datum", { ascending: true }),
        supabase.from("expenses").select("id, datum, bedrag").order("datum", { ascending: true }),
      ]);

      if (paymentsRes.error) throw paymentsRes.error;
      if (expensesRes.error) throw expensesRes.error;

      setPayments(paymentsRes.data || []);
      setExpenses(expensesRes.data || []);
    } catch (error) {
      console.error("Error fetching data:", error);
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

      const monthExpenses = expenses.filter((e) => {
        const expenseDate = parseISO(e.datum);
        return expenseDate >= monthStart && expenseDate <= monthEnd;
      });

      const totalIncome = monthPayments.reduce((sum, p) => sum + Number(p.bedrag), 0);
      const totalExpenses = monthExpenses.reduce((sum, e) => sum + Number(e.bedrag), 0);

      data.push({
        month: monthKey,
        monthLabel,
        income: totalIncome,
        expenses: totalExpenses,
        cashflow: totalIncome - totalExpenses,
      });
    }

    return data;
  };

  const chartData = getChartData();
  const totalCashflow = chartData.reduce((sum, d) => sum + d.cashflow, 0);
  const avgCashflow = chartData.length > 0 ? totalCashflow / chartData.length : 0;
  const isPositive = totalCashflow >= 0;

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div className="bg-popover border border-border rounded-lg p-3 shadow-lg">
          <p className="text-sm font-medium text-foreground mb-2">{label}</p>
          <div className="space-y-1 text-sm">
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Inkomsten:</span>
              <span className="text-success">€{data.income.toLocaleString("nl-NL")}</span>
            </div>
            <div className="flex justify-between gap-4">
              <span className="text-muted-foreground">Kosten:</span>
              <span className="text-destructive">-€{data.expenses.toLocaleString("nl-NL")}</span>
            </div>
            <div className="flex justify-between gap-4 pt-1 border-t border-border">
              <span className="font-medium">Cashflow:</span>
              <span className={data.cashflow >= 0 ? "text-success font-medium" : "text-destructive font-medium"}>
                €{data.cashflow.toLocaleString("nl-NL")}
              </span>
            </div>
          </div>
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
            {isPositive ? (
              <TrendingUp className="w-5 h-5 text-success" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
            <CardTitle className="text-base font-semibold">Netto Cashflow</CardTitle>
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
            <p className={`text-2xl font-bold ${isPositive ? "text-success" : "text-destructive"}`}>
              €{totalCashflow.toLocaleString("nl-NL")}
            </p>
            <p className="text-xs text-muted-foreground">Totaal ({period} mnd)</p>
          </div>
          <div className="text-right">
            <p className={`text-lg font-semibold ${avgCashflow >= 0 ? "text-success" : "text-destructive"}`}>
              €{Math.round(avgCashflow).toLocaleString("nl-NL")}
            </p>
            <p className="text-xs text-muted-foreground">Gem. per maand</p>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {payments.length === 0 && expenses.length === 0 ? (
          <div className="h-48 flex items-center justify-center text-muted-foreground text-sm">
            Nog geen transacties geregistreerd
          </div>
        ) : (
          <div className="h-48 mt-4">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
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
                  tickFormatter={(value) => `€${value >= 1000 || value <= -1000 ? `${(value / 1000).toFixed(0)}k` : value}`}
                />
                <Tooltip content={<CustomTooltip />} />
                <ReferenceLine y={0} stroke="hsl(var(--border))" />
                <Bar
                  dataKey="cashflow"
                  fill="hsl(var(--success))"
                  radius={[4, 4, 0, 0]}
                  maxBarSize={40}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  );
};
