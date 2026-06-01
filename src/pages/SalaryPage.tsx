import React, { useEffect, useState } from 'react';
import {
  Banknote,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  X,
  Calendar,
  AlertCircle,
  TrendingDown,
  Percent,
  Calculator
} from 'lucide-react';
import api from '../api';
import { Salary, Employee } from '../types';
import { useToast } from '../components/Notification';

export default function SalaryPage() {
  const [salaries, setSalaries] = useState<Salary[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(true);

  // Filters and queries
  const [search, setSearch] = useState('');
  const [monthFilter, setMonthFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(8);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const { showToast } = useToast();

  // Modals status
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedSal, setSelectedSal] = useState<Salary | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteSalId, setDeleteSalId] = useState('');
  const [deleteSalName, setDeleteSalName] = useState('');

  // Form Fields
  const [employeeId, setEmployeeId] = useState('');
  const [grossSalary, setGrossSalary] = useState('');
  const [totalDeduction, setTotalDeduction] = useState('');
  const [monthOfPayment, setMonthOfPayment] = useState('');
  
  // Real-time calculated reactive hook
  const [netSalaryPre, setNetSalaryPre] = useState(0);

  const [formSubmitting, setFormSubmitting] = useState(false);

  // Active unique months pool for filtering dropdowns
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);

  useEffect(() => {
    fetchSalaries();
  }, [search, monthFilter, page]);

  useEffect(() => {
    fetchEmployees();
    setMonthOfPayment(getCurrentMonthString());
  }, []);

  const fetchSalaries = async () => {
    try {
      setLoading(true);
      const res = await api.get('/salaries', {
        params: {
          search,
          monthOfPayment: monthFilter,
          page,
          limit
        }
      });
      setSalaries(res.data.salaries);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages || 1);

      // Re-compile available dynamic month lists from server to help filters
      if (res.data.salaries && monthFilter === 'all' && !search) {
        const months = new Set<string>();
        // Add current month by default
        months.add(getCurrentMonthString());
        res.data.salaries.forEach((s: Salary) => {
          if (s.monthOfPayment) months.add(s.monthOfPayment);
        });
        setAvailableMonths(Array.from(months).sort((a,b)=> b.localeCompare(a)));
      }
    } catch (err: any) {
      console.error(err);
      showToast('Could not fetch payroll records.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      // Grab all active employees to fill select dropdowns (without page size limits on associations)
      const res = await api.get('/employees', { params: { limit: 1000 } });
      setEmployees(res.data.employees || []);
    } catch (err) {
      console.error(err);
    }
  };

  const getCurrentMonthString = () => {
    const d = new Date();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const yyyy = d.getFullYear();
    return `${mm}-${yyyy}`; // e.g., '06-2026'
  };

  // Re-calculate the dynamic net salary in real-time as user changes inputs!
  useEffect(() => {
    const gross = parseFloat(grossSalary) || 0;
    const deduct = parseFloat(totalDeduction) || 0;
    const computed = gross - deduct;
    setNetSalaryPre(computed > 0 ? parseFloat(computed.toFixed(2)) : 0);
  }, [grossSalary, totalDeduction]);

  const handleOpenCreate = () => {
    if (employees.length === 0) {
      showToast('There are no employee rosters on system! Please add employees first.', 'warning');
      return;
    }
    setEmployeeId(employees[0]?._id || '');
    setGrossSalary('');
    setTotalDeduction('');
    setMonthOfPayment(getCurrentMonthString());
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (sal: Salary) => {
    setSelectedSal(sal);
    setEmployeeId(sal.employeeId);
    setGrossSalary(String(sal.grossSalary));
    setTotalDeduction(String(sal.totalDeduction));
    setMonthOfPayment(sal.monthOfPayment);
    setIsEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!employeeId || !grossSalary || !totalDeduction || !monthOfPayment) {
      showToast('All fields are requested.', 'warning');
      return;
    }

    const gross = parseFloat(grossSalary);
    const deduct = parseFloat(totalDeduction);

    if (gross <= 0) {
      showToast('Gross salary must be greater than zero.', 'warning');
      return;
    }
    if (deduct < 0) {
      showToast('Total deduction cannot be negative.', 'warning');
      return;
    }
    if (deduct > gross) {
      showToast('Total deduction cannot exceed gross salary pay.', 'warning');
      return;
    }

    // Validate Month MM-YYYY format
    if (!/^(0[1-9]|1[0-2])-\d{4}$/.test(monthOfPayment.trim())) {
      showToast('Month reference must be in MM-YYYY format (e.g. 05-2026).', 'warning');
      return;
    }

    setFormSubmitting(true);
    try {
      await api.post('/salaries', {
        employeeId,
        grossSalary: gross,
        totalDeduction: deduct,
        monthOfPayment: monthOfPayment.trim()
      });
      showToast('Voucher salary receipt drafted successfully.', 'success');
      setIsCreateOpen(false);
      setPage(1);
      fetchSalaries();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Could not pay selected user.';
      showToast(errorMsg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSal) return;

    if (!grossSalary || !totalDeduction || !monthOfPayment) {
      showToast('Mandatory fields are requested.', 'warning');
      return;
    }

    const gross = parseFloat(grossSalary);
    const deduct = parseFloat(totalDeduction);

    if (gross <= 0) {
      showToast('Gross salary must be greater than zero.', 'warning');
      return;
    }
    if (deduct < 0) {
      showToast('Deduction cannot be negative.', 'warning');
      return;
    }
    if (deduct > gross) {
      showToast('Deduction rate must not exceed total gross pay rate.', 'warning');
      return;
    }

    // Validate Month MM-YYYY format
    if (!/^(0[1-9]|1[0-2])-\d{4}$/.test(monthOfPayment.trim())) {
      showToast('Month reference must be in MM-YYYY format (e.g. 05-2026).', 'warning');
      return;
    }

    setFormSubmitting(true);
    try {
      await api.put(`/salaries/${selectedSal._id}`, {
        grossSalary: gross,
        totalDeduction: deduct,
        monthOfPayment: monthOfPayment.trim()
      });
      showToast('Salary payment record modified.', 'success');
      setIsEditOpen(false);
      fetchSalaries();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Failed to update salary pay slip.';
      showToast(errorMsg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setDeleteSalId(id);
    setDeleteSalName(name);
    setIsDeleteOpen(true);
  };

  const executeDelete = async () => {
    try {
      await api.delete(`/salaries/${deleteSalId}`);
      showToast('Payroll transaction successfully deleted.', 'success');
      setIsDeleteOpen(false);
      fetchSalaries();
    } catch (err: any) {
      console.error(err);
      showToast('Failed to delete transaction receipt.', 'error');
    }
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('en-GB', { style: 'currency', currency: 'GBP' }).format(val);
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Staff Salary Disbursements</h1>
          <p className="text-sm text-slate-500 mt-0.5">Disburse salary, deduct charges, and log monthly payrolls</p>
        </div>
        <button
          id="btn-add-salary"
          onClick={handleOpenCreate}
          className="px-4 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-850 text-white rounded-md flex items-center justify-center gap-2 transition cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Plus className="h-4 w-4" /> Issue Salary Voucher
        </button>
      </div>

      {/* Filtering Panels */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* Search Field */}
        <div className="relative flex-1 max-w-sm rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            id="salary-search-input"
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="block w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 hover:border-slate-450 transition"
            placeholder="Search staff, position..."
          />
        </div>

        {/* Month Dropdown filter */}
        <div className="flex items-center gap-2">
          <Calendar className="h-4.5 w-4.5 text-slate-400" />
          <select
            id="salary-month-select"
            value={monthFilter}
            onChange={(e) => { setMonthFilter(e.target.value); setPage(1); }}
            className="block py-1.5 pl-3 pr-8 border border-slate-300 rounded-md text-sm text-slate-700 bg-white"
          >
            <option value="all">All Months</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>

        {(search || monthFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setMonthFilter('all'); setPage(1); }}
            className="text-xs text-slate-500 hover:text-slate-850 font-semibold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Salary table list view */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden" id="salaries-list-container">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-6 w-6 text-slate-800 animate-spin" />
            <span className="mt-2 text-xs text-slate-400 font-mono">RETRIEVING TRANSACTION LEDGERS...</span>
          </div>
        ) : salaries.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Banknote className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800 font-mono uppercase tracking-wider">No Statements Deposited</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              No salary voucher records exist matching those filters. Issue payments to employees to build historical archives.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-800">
              <thead className="bg-slate-50 text-slate-705 font-bold uppercase block-headers">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-xs tracking-wider">Employee</th>
                  <th scope="col" className="px-6 py-3.5 text-xs tracking-wider">Billing Month</th>
                  <th scope="col" className="px-6 py-3.5 text-xs tracking-wider">Gross Pay</th>
                  <th scope="col" className="px-6 py-3.5 text-xs tracking-wider">Deductions</th>
                  <th scope="col" className="px-6 py-3.5 text-xs tracking-wider">Net Salary</th>
                  <th scope="col" className="px-6 py-3.5 text-xs tracking-wider text-right">Ledger actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {salaries.map((sal) => {
                  const emp = sal.employee;
                  const nameDisplay = emp ? `${emp.firstName} ${emp.lastName}` : 'System user';
                  const jobLabel = emp ? `${emp.position} (${emp.department?.departmentCode || 'N/A'})` : 'Archive file';
                  return (
                    <tr key={sal._id} className="hover:bg-slate-50/50 transition">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div>
                          <span className="block font-bold text-slate-900 text-sm leading-tight">{nameDisplay}</span>
                          <span className="block text-[11px] font-medium font-mono text-slate-450 mt-1">{jobLabel}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs font-semibold text-slate-700">
                        {sal.monthOfPayment}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-slate-650">
                        {formatCurrency(sal.grossSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-mono text-xs text-rose-600 font-medium">
                        - {formatCurrency(sal.totalDeduction)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap font-semibold font-mono text-xs text-indigo-700 bg-slate-50/45">
                        {formatCurrency(sal.netSalary)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-xs font-semibold">
                        <div className="flex gap-2 justify-end">
                          <button
                            onClick={() => handleOpenEdit(sal)}
                            className="p-1 px-2.5 rounded border border-slate-200 text-slate-650 hover:bg-slate-100 transition cursor-pointer"
                          >
                            <Edit className="h-3.5 w-3.5" />
                          </button>
                          <button
                            onClick={() => handleDeleteRequest(sal._id, nameDisplay)}
                            className="p-1 px-2.5 rounded border border-rose-100 text-rose-600 hover:bg-rose-50 transition cursor-pointer"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Custom pagination block */}
      {totalPages > 1 && (
        <div className="flex justify-end gap-2 items-center bg-white p-3 border border-slate-200 rounded-md">
          <button
            disabled={page === 1}
            onClick={() => setPage(p => Math.max(1, p - 1))}
            className="px-3 py-1 border border-slate-300 text-xs font-medium text-slate-600 rounded hover:bg-slate-55 disabled:opacity-40 cursor-pointer"
          >
            Prev
          </button>
          <span className="text-xs font-mono text-slate-500 bg-slate-100 px-3 py-1 rounded">Page {page} of {totalPages}</span>
          <button
            disabled={page === totalPages}
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            className="px-3 py-1 border border-slate-300 text-xs font-medium text-slate-600 rounded hover:bg-slate-55 disabled:opacity-40 cursor-pointer"
          >
            Next
          </button>
        </div>
      )}

      {/* ==========================================
          CREATE SALARY MODAL
          ========================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-lg w-full shadow-lg overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Disburse Salary Voucher</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              {/* Employee Selection dropdown list */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-sal-employee">
                  Select Employee Roster *
                </label>
                <select
                  id="add-sal-employee"
                  required
                  value={employeeId}
                  onChange={(e) => setEmployeeId(e.target.value)}
                  className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 bg-white"
                >
                  {employees.map((e) => (
                    <option key={e._id} value={e._id}>
                      {e.firstName} {e.lastName} ({e.position} - {e.employeeNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gross Pay */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-sal-gross">
                    Gross Salary Amount (£) *
                  </label>
                  <input
                    id="add-sal-gross"
                    type="number"
                    required
                    step="0.01"
                    placeholder="4500.00"
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Total Deductions */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-sal-deduction">
                    Total Deductions (£) *
                  </label>
                  <input
                    id="add-sal-deduction"
                    type="number"
                    required
                    step="0.01"
                    placeholder="550.00"
                    value={totalDeduction}
                    onChange={(e) => setTotalDeduction(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Billing monthOfPayment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-sal-month">
                    Billing Month (MM-YYYY) *
                  </label>
                  <input
                    id="add-sal-month"
                    type="text"
                    required
                    placeholder="e.g. 05-2026"
                    value={monthOfPayment}
                    onChange={(e) => setMonthOfPayment(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 font-mono"
                  />
                  <span className="block text-[9px] text-slate-400 mt-0.5 uppercase">Follow standard schema format MM-YYYY</span>
                </div>

                {/* REAL-TIME DYNAMIC CALCULATOR FEEDBACK */}
                <div className="bg-slate-50 border border-slate-150 p-2 rounded-md flex flex-col justify-center">
                  <span className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1 font-mono">
                    <Calculator className="h-3 w-3" /> Calculated Net Salary
                  </span>
                  <span className="text-lg font-mono font-bold text-slate-900 mt-1">
                    {formatCurrency(netSalaryPre)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-105">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-705 hover:bg-slate-100 text-sm font-medium rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-create-salary"
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-850 rounded-md cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Disburse Payment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          EDIT SALARY MODAL
          ========================================== */}
      {isEditOpen && selectedSal && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-lg w-full shadow-lg overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Modify Salary Slip</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-1">
                  Employee
                </label>
                <div className="block w-full py-2 px-3 border border-slate-150 bg-slate-50 text-slate-650 rounded-md text-sm font-semibold select-none">
                  {selectedSal.employee ? `${selectedSal.employee.firstName} ${selectedSal.employee.lastName} (${selectedSal.employee.employeeNumber})` : 'Archived member'}
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Gross Pay */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="edit-sal-gross">
                    Gross Salary Amount (£) *
                  </label>
                  <input
                    id="edit-sal-gross"
                    type="number"
                    required
                    step="0.01"
                    placeholder="4500.00"
                    value={grossSalary}
                    onChange={(e) => setGrossSalary(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Total Deductions */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="edit-sal-deduction">
                    Total Deductions (£) *
                  </label>
                  <input
                    id="edit-sal-deduction"
                    type="number"
                    required
                    step="0.01"
                    placeholder="550.00"
                    value={totalDeduction}
                    onChange={(e) => setTotalDeduction(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Billing monthOfPayment */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="edit-sal-month">
                    Billing Month (MM-YYYY) *
                  </label>
                  <input
                    id="edit-sal-month"
                    type="text"
                    required
                    placeholder="e.g. 05-2026"
                    value={monthOfPayment}
                    onChange={(e) => setMonthOfPayment(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 font-mono"
                  />
                </div>

                {/* REAL-TIME DYNAMIC CALCULATOR FEEDBACK */}
                <div className="bg-slate-50 border border-slate-155 p-2 rounded-md flex flex-col justify-center">
                  <span className="block text-[10px] font-bold text-indigo-700 uppercase tracking-wider flex items-center gap-1 font-mono">
                    <Calculator className="h-3 w-3" /> Calculated Net Salary
                  </span>
                  <span className="text-lg font-mono font-bold text-slate-900 mt-1">
                    {formatCurrency(netSalaryPre)}
                  </span>
                </div>
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-105">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-705 hover:bg-slate-105 text-sm font-medium rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-edit-salary"
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-850 rounded-md cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Slips'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Salary Deletion Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/30">
              <h3 className="text-sm font-bold uppercase font-sans tracking-wide text-rose-700">
                Confirm Voucher Revocation
              </h3>
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="text-slate-400 hover:text-slate-650 cursor-pointer p-0.5 rounded transition"
              >
                <X className="h-4.5 w-4.5" />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <p className="text-xs font-semibold uppercase text-slate-400 font-mono tracking-wider">
                Financial Audit Alert
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                You are about to permanently delete and void the salary payment record issued for <strong className="text-slate-900">{deleteSalName}</strong>. 
                This will instantly remove this transaction from corporate tax reports, monthly pay logs, and audit ledger balances.
              </p>
            </div>

            <div className="bg-slate-50/60 px-6 py-4 border-t border-slate-150 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-705 bg-white hover:bg-slate-50 font-semibold rounded-md cursor-pointer transition"
              >
                Cancel
              </button>
              <button
                id="btn-confirm-delete-salary"
                onClick={executeDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md cursor-pointer transition shadow-sm"
              >
                Revoke Voucher
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
