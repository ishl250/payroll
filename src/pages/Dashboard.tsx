import React, { useEffect, useState } from 'react';
import {
  Users,
  Building2,
  Banknote,
  Coins,
  ArrowUpRight,
  TrendingUp,
  Loader2,
  UserPlus
} from 'lucide-react';
import api from '../api';
import { DashboardMetrics } from '../types';
import { useToast } from '../components/Notification';
import { Link } from 'react-router-dom';

export default function Dashboard() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  useEffect(() => {
    fetchMetrics();
  }, []);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      const res = await api.get('/dashboard/metrics');
      setMetrics(res.data);
    } catch (err) {
      console.error('Error fetching dashboard: ', err);
      showToast('Could not load analytical metrics. Make sure you are logged in.', 'error');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center py-20">
        <Loader2 className="h-8 w-8 text-slate-800 animate-spin" />
        <span className="mt-2 text-sm text-slate-500 font-mono">RETRIEVING PAYMASTER ANALYTICS...</span>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="bg-white border rounded-md p-10 text-center border-slate-200">
        <p className="text-slate-600">Error loading metrics dashboard. Please refresh.</p>
        <button
          onClick={fetchMetrics}
          className="mt-4 px-4 py-2 text-sm bg-slate-950 text-white rounded-md hover:bg-slate-800 transition cursor-pointer"
        >
          Retry
        </button>
      </div>
    );
  }

  // Formatting helpers
  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP', minimumFractionDigits: 0 }).format(val);
  };

  // Safe Math calculation for maximum monthly amount in charts to scale heights
  const maxMonthlyAmount = metrics.salaryByMonth.length > 0
    ? Math.max(...metrics.salaryByMonth.map(m => m.amount))
    : 10000;

  // Pie chart calculation helper
  const totalGender = metrics.genderDistribution.reduce((acc, g) => acc + g.count, 0) || 1;
  let angleAccumulator = 0;

  return (
    <div className="space-y-6">
      {/* Page header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">HR & Payroll Dashboard</h1>
          <p className="text-sm text-slate-500 mt-0.5">PayMaster Ltd Core Administrative Panel</p>
        </div>
        <div className="flex gap-2 font-mono text-xs text-slate-600 bg-slate-100 px-3 py-1.5 rounded border border-slate-200 justify-center items-center">
          <span>SYSTEM TIME: 2026-06-01 (UTC)</span>
        </div>
      </div>

      {/* Primary Metrics Grid (No Neumorphism / Flat Design) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4" id="metrics-grid">
        {/* Metric 1 */}
        <div className="bg-white border border-slate-200 p-5 rounded-md flex items-center gap-4 transition hover:border-slate-350">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-md">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Employees</span>
            <span className="text-2xl font-bold text-slate-900 font-sans">{metrics.totalEmployees}</span>
            <Link to="/employees" className="block text-xs text-indigo-600 hover:text-indigo-800 mt-1 flex items-center gap-0.5 font-medium">
              View Directory <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Metric 2 */}
        <div className="bg-white border border-slate-200 p-5 rounded-md flex items-center gap-4 transition hover:border-slate-350">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-md">
            <Building2 className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Departments</span>
            <span className="text-2xl font-bold text-slate-900 font-sans">{metrics.totalDepartments}</span>
            <Link to="/departments" className="block text-xs text-indigo-600 hover:text-indigo-800 mt-1 flex items-center gap-0.5 font-medium">
              View Departments <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Metric 3 */}
        <div className="bg-white border border-slate-200 p-5 rounded-md flex items-center gap-4 transition hover:border-slate-350">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-md">
            <Banknote className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Payroll Records</span>
            <span className="text-2xl font-bold text-slate-900 font-sans">{metrics.totalPayrollRecords}</span>
            <Link to="/salaries" className="block text-xs text-indigo-600 hover:text-indigo-800 mt-1 flex items-center gap-0.5 font-medium">
              Manage Slips <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>

        {/* Metric 4 */}
        <div className="bg-white border border-slate-200 p-5 rounded-md flex items-center gap-4 transition hover:border-slate-350">
          <div className="p-3 bg-slate-100 text-slate-800 rounded-md">
            <Coins className="h-6 w-6" />
          </div>
          <div>
            <span className="block text-xs font-semibold text-slate-500 uppercase tracking-wider">Total Salary Paid</span>
            <span className="text-xl font-bold text-slate-900 font-sans">{formatCurrency(metrics.totalSalaryPaid)}</span>
            <Link to="/reports" className="block text-xs text-indigo-600 hover:text-indigo-800 mt-1 flex items-center gap-0.5 font-medium">
              Generate Reports <ArrowUpRight className="h-3 w-3" />
            </Link>
          </div>
        </div>
      </div>

      {/* Visual Analytics Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Salaries paid over time block (Bar chart) */}
        <div className="bg-white border border-slate-200 p-5 rounded-md lg:col-span-2 flex flex-col">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <div>
              <h2 className="text-sm font-bold text-slate-800 uppercase tracking-wider flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-slate-600" />
                Salary Payments Over Time
              </h2>
              <p className="text-xs text-slate-500">Aggregate Net Payroll paid per billing cycle</p>
            </div>
            <span className="text-[10px] bg-indigo-50 border border-indigo-100 text-indigo-800 px-2 py-0.5 rounded font-mono font-bold uppercase">
              Net Amount (GBP)
            </span>
          </div>

          {/* Custom SVG Bar Chart */}
          <div className="flex-1 min-h-[220px] flex items-end pt-4 pb-2 px-2 border-b border-slate-200">
            {metrics.salaryByMonth.length === 0 ? (
              <div className="w-full text-center text-xs text-slate-400 py-10">No past salary records yet. Add salaries to display historical trends.</div>
            ) : (
              <div className="w-full h-full flex justify-around items-end gap-2 shrink-0">
                {metrics.salaryByMonth.map((m) => {
                  const percentage = Math.max(10, Math.min(100, (m.amount / maxMonthlyAmount) * 100));
                  return (
                    <div key={m.month} className="flex-1 flex flex-col items-center group relative">
                      {/* Tooltip on hover */}
                      <div className="absolute -top-10 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900 text-white text-[10px] font-mono py-1 px-2 rounded -translate-y-1 pointer-events-none whitespace-nowrap z-10">
                        {formatCurrency(m.amount)}
                      </div>
                      {/* Bar filled element */}
                      <div
                        style={{ height: `${percentage}%` }}
                        className="w-full max-w-[32px] bg-slate-800 hover:bg-slate-950 transition-colors duration-150 rounded-t"
                      />
                      {/* X-axis Label */}
                      <span className="text-[10px] font-mono font-semibold text-slate-500 mt-2 rotate-12 sm:rotate-0">
                        {m.month}
                      </span>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
          <div className="flex justify-between text-[10px] text-slate-400 font-mono mt-2">
            <span>Scale: GBP 0.00</span>
            <span>Max: {formatCurrency(maxMonthlyAmount)}</span>
          </div>
        </div>

        {/* Gender Distribution block (Pie/Donut chart list) */}
        <div className="bg-white border border-slate-200 p-5 rounded-md flex flex-col">
          <div className="border-b border-slate-100 pb-3 mb-4">
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Staff Gender Distribution
            </h3>
            <p className="text-xs text-slate-500">Demographic composition analysis</p>
          </div>

          <div className="flex-1 flex flex-col justify-center items-center">
            {metrics.totalEmployees === 0 ? (
              <p className="text-xs text-slate-400 py-10">No employees registered yet.</p>
            ) : (
              <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-4 items-center">
                {/* Visual Circle Representation */}
                <div className="flex justify-center">
                  <svg width="120" height="120" viewBox="0 0 36 36" className="w-[100px] h-[100px]">
                    <circle cx="18" cy="18" r="15.915" fill="none" stroke="#f1f5f9" strokeWidth="3" />
                    {metrics.genderDistribution.map((g, idx) => {
                      const percentage = (g.count / totalGender) * 100;
                      if (percentage === 0) return null;
                      const strokeDashArray = `${percentage} ${100 - percentage}`;
                      const strokeDashOffset = 100 - angleAccumulator + 25;
                      angleAccumulator += percentage;

                      const colors = ['#0f172a', '#475569', '#cbd5e1'];
                      const strokeColor = colors[idx] || '#94a3b8';

                      return (
                        <circle
                          key={g.gender}
                          cx="18"
                          cy="18"
                          r="15.915"
                          fill="none"
                          stroke={strokeColor}
                          strokeWidth="3.2"
                          strokeDasharray={strokeDashArray}
                          strokeDashoffset={strokeDashOffset}
                        />
                      );
                    })}
                  </svg>
                </div>

                {/* legend items */}
                <div className="space-y-2">
                  {metrics.genderDistribution.map((g, idx) => {
                    const percentage = Math.round((g.count / totalGender) * 100);
                    const dotColors = ['bg-slate-900', 'bg-slate-600', 'bg-slate-300'];
                    const dotBg = dotColors[idx] || 'bg-slate-400';
                    return (
                      <div key={g.gender} className="flex items-center gap-2">
                        <span className={`h-2.5 w-2.5 rounded-full ${dotBg} shrink-0`} />
                        <div>
                          <span className="block text-xs font-semibold text-slate-700 leading-none">{g.gender}</span>
                          <span className="block text-[10px] text-slate-400 font-mono mt-0.5">
                            {g.count} head(s) ({percentage}%)
                          </span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Staffing levels per Department breakdown */}
      <div className="bg-white border border-slate-200 p-5 rounded-md">
        <div className="border-b border-slate-100 pb-3 mb-4 flex justify-between items-center">
          <div>
            <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">
              Department Placement Distribution
            </h3>
            <p className="text-xs text-slate-500">Staff Count allocated in each operational segment</p>
          </div>
          <Link to="/employees" className="text-xs font-semibold text-indigo-600 hover:text-indigo-800 bg-slate-100 px-3 py-1 rounded hover:bg-slate-200 transition flex items-center gap-1">
            <UserPlus className="h-3 w-3" /> Hire Staff
          </Link>
        </div>

        {metrics.departmentDistribution.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-6">No departments defined helper.</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {metrics.departmentDistribution.map((d) => {
              const maxPlacements = Math.max(1, ...metrics.departmentDistribution.map(x => x.count));
              const pct = Math.max(5, (d.count / maxPlacements) * 100);
              return (
                <div key={ d.department } className="border border-slate-200 rounded-md p-4 bg-slate-50 flex flex-col justify-between">
                  <div>
                    <span className="block font-semibold text-slate-800 text-sm">{ d.department }</span>
                    <span className="block font-mono text-[11px] text-slate-400 mt-1">{ d.count } employee(s)</span>
                  </div>
                  {/* Progress Indicator */}
                  <div className="w-full bg-slate-200 h-1.5 rounded-full mt-3 overflow-hidden">
                    <div style={{ width: `${pct}%` }} className="bg-slate-800 h-full rounded-full" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
