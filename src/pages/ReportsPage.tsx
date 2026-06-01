import React, { useEffect, useState } from 'react';
import {
  FileSpreadsheet,
  Printer,
  Calendar,
  DollarSign,
  TrendingUp,
  Loader2,
  Users,
  Search,
  CheckCircle,
  FileText
} from 'lucide-react';
import api from '../api';
import { PayrollReport } from '../types';
import { useToast } from '../components/Notification';

export default function ReportsPage() {
  const [reportType, setReportType] = useState<'daily' | 'weekly' | 'monthly'>('monthly');
  const [monthQuery, setMonthQuery] = useState('');
  const [reportData, setReportData] = useState<PayrollReport | null>(null);
  const [loading, setLoading] = useState(true);
  const { showToast } = useToast();

  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  useEffect(() => {
    fetchAvailableMonths();
  }, []);

  useEffect(() => {
    fetchReport();
  }, [reportType, monthQuery]);

  const fetchAvailableMonths = async () => {
    try {
      // Fetch some initial salaries to populate available paid period indexes
      const res = await api.get('/salaries', { params: { limit: 100 } });
      const months = new Set<string>();
      months.add(getCurrentMonthString());
      if (res.data.salaries) {
        res.data.salaries.forEach((s: any) => {
          if (s.monthOfPayment) months.add(s.monthOfPayment);
        });
      }
      const sorted = Array.from(months).sort((a,b)=> b.localeCompare(a));
      setAvailableMonths(sorted);
      setMonthQuery(sorted[0] || getCurrentMonthString());
    } catch {
      // Fallback
      setMonthQuery(getCurrentMonthString());
    }
  };

  const getCurrentMonthString = () => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}-${yyyy}`;
  };

  const fetchReport = async () => {
    if (reportType === 'monthly' && !monthQuery) return;
    try {
      setLoading(true);
      const res = await api.get('/reports/payroll', {
        params: {
          type: reportType,
          monthOfPayment: reportType === 'monthly' ? monthQuery : undefined
        }
      });
      setReportData(res.data);
    } catch (err: any) {
      console.error(err);
      showToast('Could not assemble payroll report.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Page Header (Hidden on print) */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5 print:hidden">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Financial & Payroll Audits</h1>
          <p className="text-sm text-slate-500 mt-0.5">Generate daily, weekly, and monthly corporate payroll reports</p>
        </div>
        <button
          onClick={handlePrint}
          className="px-4 py-2 border border-slate-200 text-slate-700 bg-white hover:bg-slate-50 transition rounded-md flex items-center justify-center gap-2 cursor-pointer shadow-sm text-sm font-semibold"
        >
          <Printer className="h-4.5 w-4.5 text-slate-500" /> Print Formal Audit
        </button>
      </div>

      {/* Audit Controller Selection cards (Hidden on print) */}
      <div className="bg-white border border-slate-200 p-5 rounded-md flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div className="flex flex-wrap items-center gap-2">
          {/* Daily Selection */}
          <button
            onClick={() => setReportType('daily')}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase font-mono tracking-wider transition cursor-pointer border ${
              reportType === 'daily'
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'hover:bg-slate-100 border-slate-200 text-slate-650'
            }`}
          >
            Daily Payroll Report
          </button>

          {/* Weekly Selection */}
          <button
            onClick={() => setReportType('weekly')}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase font-mono tracking-wider transition cursor-pointer border ${
              reportType === 'weekly'
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'hover:bg-slate-100 border-slate-200 text-slate-650'
            }`}
          >
            Weekly Payroll Report
          </button>

          {/* Monthly Selection */}
          <button
            onClick={() => setReportType('monthly')}
            className={`px-4 py-2 rounded-md text-xs font-bold uppercase font-mono tracking-wider transition cursor-pointer border ${
              reportType === 'monthly'
                ? 'bg-slate-900 border-slate-900 text-white'
                : 'hover:bg-slate-100 border-slate-200 text-slate-650'
            }`}
          >
            Monthly Payroll Report
          </button>
        </div>

        {/* Monthly Select dropdown triggerer */}
        {reportType === 'monthly' && (
          <div className="flex items-center gap-2 self-stretch md:self-auto justify-end">
            <span className="text-xs font-semibold text-slate-500 font-mono">Period Index:</span>
            <select
              value={monthQuery}
              onChange={(e) => setMonthQuery(e.target.value)}
              className="py-1.5 pl-3 pr-8 border border-slate-300 rounded-md text-xs font-bold text-slate-700 bg-white"
            >
              {availableMonths.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </select>
          </div>
        )}
      </div>

      {/* Loading state indicator */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-32 bg-white border border-slate-200 rounded-md">
          <Loader2 className="h-7 w-7 text-slate-800 animate-spin" />
          <span className="mt-2 text-xs text-slate-400 font-mono">ASSEMBLING AUDIT LEDGER TRANSACTION DATA...</span>
        </div>
      ) : !reportData || reportData.records.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-md text-center py-20 px-4">
          <FileText className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 uppercase font-mono tracking-wider">No Disbursed Statements</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            Zero payroll transactions matches the requested audit window timeframe ({reportType === 'monthly' ? monthQuery : reportType}).
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Summary Aggregates row */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4" id="report-aggregates">
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-md">
              <span className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider">Accumulated Gross Salary</span>
              <span className="text-lg font-bold text-slate-900 font-mono mt-1 block">
                {formatCurrency(reportData.totalGross)}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-md">
              <span className="block text-[10px] font-bold text-rose-500 uppercase tracking-wider">Accumulated Deductions</span>
              <span className="text-lg font-bold text-rose-650 font-mono mt-1 block">
                {formatCurrency(reportData.totalDeductions)}
              </span>
            </div>
            <div className="bg-slate-50 border border-slate-200 p-4 rounded-md bg-indigo-50/50">
              <span className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider">Net Payroll Disbursed</span>
              <span className="text-lg font-bold text-slate-950 font-mono mt-1 block">
                {formatCurrency(reportData.totalNet)}
              </span>
            </div>
          </div>

          {/* PRINTABLE FORMAL LEDGER TEMPLATE */}
          <div className="bg-white border border-slate-200 rounded-md p-6 sm:p-8 space-y-6 printable-report">
            {/* Report Header block */}
            <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-b border-slate-200 pb-6">
              <div>
                <span className="block font-bold text-slate-950 text-base font-sans tracking-tight uppercase">PayMaster Ltd</span>
                <span className="block text-[10px] text-slate-500 font-mono uppercase tracking-wider leading-none mt-1">EPMS Financial Auditor</span>
                <span className="block text-xs text-slate-555 max-w-xs mt-2 text-[11px] leading-relaxed">
                  25 PayMaster Chambers, Financial Sector, London, EC1A 4HD
                </span>
              </div>
              <div className="sm:text-right font-mono text-[11px] text-slate-500 space-y-1">
                <div>AUDIT TYPE: <span className="font-bold text-slate-800">{reportData.reportType.toUpperCase()} PAYROLL</span></div>
                {reportType === 'monthly' && <div>PERIOD: <span className="font-bold text-slate-800">{monthQuery}</span></div>}
                <div>GENERATED: <span className="font-bold text-slate-800">{reportData.generatedAt}</span></div>
                <div>STAFF COUNT: <span className="font-bold text-slate-800">{reportData.records.length} paid head(s)</span></div>
              </div>
            </div>

            {/* Audit content items table */}
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-800 font-sans">
                <thead>
                  <tr className="bg-slate-50 font-bold text-slate-700 text-xs border-y border-slate-200 block-headers">
                    <th scope="col" className="px-4 py-2.5">Staff Code</th>
                    <th scope="col" className="px-4 py-2.5">Name</th>
                    <th scope="col" className="px-4 py-2.5">Branch Dept.</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Gross (£)</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Deducts (£)</th>
                    <th scope="col" className="px-4 py-2.5 text-right">Net Pay (£)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200 bg-white">
                  {reportData.records.map((r, idx) => (
                    <tr key={idx} className="hover:bg-slate-50/20 text-xs font-medium">
                      <td className="px-4 py-3 font-mono font-semibold text-slate-900">{r.employeeNumber}</td>
                      <td className="px-4 py-3">
                        <div>
                          <span className="block font-bold text-slate-850">{r.name}</span>
                          <span className="block text-[10px] text-slate-450 font-medium mt-0.5">{r.position}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 font-semibold text-slate-600">{r.departmentName}</td>
                      <td className="px-4 py-3 text-right font-mono text-slate-650">{formatCurrency(r.grossSalary)}</td>
                      <td className="px-4 py-3 text-right font-mono text-rose-600">- {formatCurrency(r.totalDeduction)}</td>
                      <td className="px-4 py-3 text-right font-mono font-bold text-indigo-750">{formatCurrency(r.netSalary)}</td>
                    </tr>
                  ))}

                  {/* Summary row aggregates within the table */}
                  <tr className="bg-slate-50/70 border-t border-slate-200 font-semibold font-mono text-xs text-slate-900 block-headers">
                    <td colSpan={3} className="px-4 py-3 font-bold text-left uppercase text-[10px] tracking-wider text-slate-705">
                      Voucher Aggregates:
                    </td>
                    <td className="px-4 py-3 text-right font-mono font-bold">{formatCurrency(reportData.totalGross)}</td>
                    <td className="px-4 py-3 text-right font-mono text-rose-700 font-bold">- {formatCurrency(reportData.totalDeductions)}</td>
                    <td className="px-4 py-3 text-right font-mono text-indigo-805 font-extrabold bg-slate-100/70 border border-slate-250">
                      {formatCurrency(reportData.totalNet)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Official signature blocks (Visible on Print default) */}
            <div className="pt-10 grid grid-cols-2 gap-10 text-[11px] font-mono text-slate-500 border-t border-slate-200">
              <div className="space-y-12">
                <p className="uppercase font-bold text-slate-800">Prepared & Checked By:</p>
                <div className="border-t border-slate-350 pr-10 pt-2 text-[10px] uppercase">
                  HR & Operations Officer
                </div>
              </div>
              <div className="space-y-12">
                <p className="uppercase font-bold text-slate-805">Authorized & Approved By:</p>
                <div className="border-t border-slate-350 pr-10 pt-2 text-[10px] uppercase">
                  Managing Director, PayMaster Ltd
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
