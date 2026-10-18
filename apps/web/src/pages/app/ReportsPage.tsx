import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import { formatPaisa } from '../../utils/formatters';
import { Button } from '../../components/common/Button';
import { Printer, TrendingUp, DollarSign, PieChart, ArrowUpRight } from 'lucide-react';

export const ReportsPage: React.FC = () => {
  const [profitData, setProfitData] = useState<any | null>(null);
  const [agingData, setAgingData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReports = async () => {
      try {
        setLoading(true);
        const [profitRes, agingRes]: any = await Promise.all([
          api.get('/finance/reports/profit-loss'),
          api.get('/finance/aging-report'),
        ]);

        setProfitData(profitRes);
        setAgingData(agingRes);
      } catch (err) {
        console.error('Failed to load reports:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchReports();
  }, []);

  const netSales = profitData?.netSalesPaisa || 0;
  const issueCost = profitData?.costOfGoodsSoldPaisa || 0;
  const grossProfit = profitData?.grossProfitPaisa || 0;
  const expenses = profitData?.operatingExpensesPaisa || 0;
  const netProfit = profitData?.netProfitPaisa || (grossProfit - expenses);
  const marginPercent = netSales > 0 ? ((grossProfit / netSales) * 100).toFixed(1) : '0.0';

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 pb-2 no-print">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Financial & Profitability Reports</h1>
          <p className="text-xs text-slate-500 mt-0.5">
            Deterministic margin reporting based on actual Weighted-Average Cost (WAC) and khata balances.
          </p>
        </div>

        <Button
          variant="outline"
          size="sm"
          icon={<Printer className="w-4 h-4" />}
          onClick={() => window.print()}
        >
          Print Report
        </Button>
      </div>

      {/* Gross Profit & Net Margin Breakdown */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <PieChart className="w-5 h-5 text-emerald-700" />
            <h2 className="text-base font-bold text-slate-900">
              Profit & Loss Summary (Weighted-Average Cost Basis)
            </h2>
          </div>
          <span className="text-xs px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-800 font-bold font-mono">
            Gross Margin: {marginPercent}%
          </span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 text-xs">
          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block font-medium">Net Invoiced Sales</span>
            <p className="text-xl font-black text-slate-900 font-mono mt-1">{formatPaisa(netSales)}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Invoiced less return credits</span>
          </div>

          <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
            <span className="text-slate-500 block font-medium">Cost of Goods Sold (WAC)</span>
            <p className="text-xl font-black text-slate-700 font-mono mt-1">{formatPaisa(issueCost)}</p>
            <span className="text-[11px] text-slate-400 mt-1 block">Actual inventory issue valuation</span>
          </div>

          <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
            <span className="text-emerald-800 block font-medium">Gross Profit</span>
            <p className="text-xl font-black text-emerald-900 font-mono mt-1">{formatPaisa(grossProfit)}</p>
            <span className="text-[11px] text-emerald-700 mt-1 block">Sales minus Cost of Goods</span>
          </div>

          <div className="p-4 rounded-xl bg-blue-50 border border-blue-200">
            <span className="text-blue-800 block font-medium">Net Operating Profit</span>
            <p className="text-xl font-black text-blue-900 font-mono mt-1">{formatPaisa(netProfit)}</p>
            <span className="text-[11px] text-blue-700 mt-1 block">Gross Profit minus Expenses</span>
          </div>
        </div>

        {/* Financial Flow Line Items */}
        <div className="border border-slate-200 rounded-xl overflow-hidden text-xs">
          <table className="w-full text-left border-collapse">
            <tbody className="divide-y divide-slate-100 font-mono">
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-sans font-medium text-slate-800">Gross Sales Revenue</td>
                <td className="py-2.5 px-4 text-right font-bold text-slate-900">{formatPaisa(netSales)}</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-sans text-slate-600 pl-8">Less: Inventory Issue Cost (WAC)</td>
                <td className="py-2.5 px-4 text-right text-rose-600">({formatPaisa(issueCost)})</td>
              </tr>
              <tr className="bg-slate-50 font-bold">
                <td className="py-2.5 px-4 font-sans text-slate-900">Gross Profit</td>
                <td className="py-2.5 px-4 text-right text-emerald-800">{formatPaisa(grossProfit)}</td>
              </tr>
              <tr className="hover:bg-slate-50">
                <td className="py-2.5 px-4 font-sans text-slate-600 pl-8">Less: Warehouse & Operating Expenses</td>
                <td className="py-2.5 px-4 text-right text-rose-600">({formatPaisa(expenses)})</td>
              </tr>
              <tr className="bg-emerald-50/50 font-black text-sm">
                <td className="py-3 px-4 font-sans text-emerald-950">Net Business Profit</td>
                <td className="py-3 px-4 text-right text-emerald-900">{formatPaisa(netProfit)}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* AR Aging Summary Banner */}
      <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm space-y-4">
        <h2 className="text-base font-bold text-slate-900">Portfolio Accounts Receivable Aging Analysis</h2>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 text-center text-xs">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <span className="text-slate-500 block text-[11px]">Current (Not Due)</span>
            <span className="font-mono font-bold text-slate-800 text-sm mt-1 block">
              {formatPaisa(agingData?.currentPaisa || 0)}
            </span>
          </div>
          <div className="p-3 bg-amber-50/50 rounded-xl border border-amber-200">
            <span className="text-amber-800 block text-[11px]">1–30 Days</span>
            <span className="font-mono font-bold text-amber-900 text-sm mt-1 block">
              {formatPaisa(agingData?.days1_30Paisa || 0)}
            </span>
          </div>
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200">
            <span className="text-amber-900 block text-[11px]">31–60 Days</span>
            <span className="font-mono font-bold text-amber-900 text-sm mt-1 block">
              {formatPaisa(agingData?.days31_60Paisa || 0)}
            </span>
          </div>
          <div className="p-3 bg-rose-50 rounded-xl border border-rose-200">
            <span className="text-rose-800 block text-[11px]">61–90 Days</span>
            <span className="font-mono font-bold text-rose-900 text-sm mt-1 block">
              {formatPaisa(agingData?.days61_90Paisa || 0)}
            </span>
          </div>
          <div className="p-3 bg-rose-100 rounded-xl border border-rose-300">
            <span className="text-rose-900 block text-[11px] font-black uppercase">Over 90 Days</span>
            <span className="font-mono font-black text-rose-950 text-sm mt-1 block">
              {formatPaisa(agingData?.daysOver90Paisa || 0)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
