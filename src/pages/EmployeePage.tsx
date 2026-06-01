import React, { useEffect, useState } from 'react';
import {
  Users,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  X,
  MapPin,
  Briefcase,
  Phone,
  Calendar,
  Filter
} from 'lucide-react';
import api from '../api';
import { Employee, Department } from '../types';
import { useToast } from '../components/Notification';

export default function EmployeePage() {
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search and Filter parameters
  const [search, setSearch] = useState('');
  const [deptFilter, setDeptFilter] = useState('all');
  const [page, setPage] = useState(1);
  const [limit] = useState(6); // Max 6 profiles per slide to give clean card layout densities
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);

  const { showToast } = useToast();

  // Dialog panels
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedEmp, setSelectedEmp] = useState<Employee | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteEmpId, setDeleteEmpId] = useState('');
  const [deleteEmpName, setDeleteEmpName] = useState('');

  // Form Fields
  const [empNum, setEmpNum] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [address, setAddress] = useState('');
  const [position, setPosition] = useState('');
  const [telephone, setTelephone] = useState('');
  const [gender, setGender] = useState<'Male' | 'Female' | 'Other'>('Male');
  const [hiredDate, setHiredDate] = useState('');
  const [deptId, setDeptId] = useState('');
  
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchEmployees();
  }, [search, deptFilter, page]);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchEmployees = async () => {
    try {
      setLoading(true);
      const res = await api.get('/employees', {
        params: {
          search,
          departmentId: deptFilter,
          page,
          limit
        }
      });
      setEmployees(res.data.employees);
      setTotal(res.data.total);
      setTotalPages(res.data.totalPages || 1);
    } catch (err: any) {
      console.error(err);
      showToast('Could not load human resource employees roster.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const fetchDepartments = async () => {
    try {
      const res = await api.get('/departments');
      setDepartments(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCreateOpen = () => {
    setEmpNum('');
    setFirstName('');
    setLastName('');
    setAddress('');
    setPosition('');
    setTelephone('');
    setGender('Male');
    setHiredDate(new Date().toISOString().split('T')[0]);
    setDeptId(departments[0]?._id || '');
    setIsCreateOpen(true);
  };

  const handleOpenEditOpen = (emp: Employee) => {
    setSelectedEmp(emp);
    setEmpNum(emp.employeeNumber);
    setFirstName(emp.firstName);
    setLastName(emp.lastName);
    setAddress(emp.address);
    setPosition(emp.position);
    setTelephone(emp.telephone);
    setGender(emp.gender);
    setHiredDate(emp.hiredDate);
    setDeptId(emp.departmentId);
    setIsEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!empNum.trim() || !firstName.trim() || !lastName.trim() || !position.trim() || !deptId) {
      showToast('All highlighted core fields are required.', 'warning');
      return;
    }

    setFormSubmitting(true);
    try {
      await api.post('/employees', {
        employeeNumber: empNum.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
        position: position.trim(),
        telephone: telephone.trim(),
        gender,
        hiredDate,
        departmentId: deptId
      });
      showToast('New employee profile logged successfully.', 'success');
      setIsCreateOpen(false);
      setPage(1); // Back to first page
      fetchEmployees();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Failed to create active employee.';
      showToast(errorMsg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedEmp) return;

    if (!empNum.trim() || !firstName.trim() || !lastName.trim() || !position.trim() || !deptId) {
      showToast('Prerequisite core fields are required.', 'warning');
      return;
    }

    setFormSubmitting(true);
    try {
      await api.put(`/employees/${selectedEmp._id}`, {
        employeeNumber: empNum.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        address: address.trim(),
        position: position.trim(),
        telephone: telephone.trim(),
        gender,
        hiredDate,
        departmentId: deptId
      });
      showToast('Employee details updated successfully.', 'success');
      setIsEditOpen(false);
      fetchEmployees();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Failed to modify employee record.';
      showToast(errorMsg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setDeleteEmpId(id);
    setDeleteEmpName(name);
    setIsDeleteOpen(true);
  };

  const executeDelete = async () => {
    try {
      await api.delete(`/employees/${deleteEmpId}`);
      showToast(`Employee file ${deleteEmpName} removed.`, 'success');
      setIsDeleteOpen(false);
      fetchEmployees();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Access Denied. Could not delete employee.';
      showToast(errorMsg, 'error');
    }
  };

  // Helper formatting hiredDate
  const formatDateString = (rawDate: string) => {
    try {
      const parts = rawDate.split('-');
      if (parts.length === 3) {
        return `${parts[2]}/${parts[1]}/${parts[0]}`; // Convert 'YYYY-MM-DD' to 'DD/MM/YYYY' for British HR formats
      }
      return new Date(rawDate).toLocaleDateString('en-GB');
    } catch {
      return rawDate;
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Employee Directory</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage staff profiles, department placements, and profiles</p>
        </div>
        <button
          id="btn-add-employee"
          onClick={handleOpenCreateOpen}
          className="px-4 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-850 text-white rounded-md flex items-center justify-center gap-2 transition cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Employee
        </button>
      </div>

      {/* Roster lists filter bars */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
        {/* Search Input */}
        <div className="relative flex-1 max-w-sm rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            id="employee-search-input"
            type="text"
            value={search}
            onChange={(e) => { setSearch(e.target.value); setPage(1); }}
            className="block w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 hover:border-slate-450 transition"
            placeholder="Search name, job title, ID..."
          />
        </div>

        {/* Department Filter dropdown select */}
        <div className="flex items-center gap-2">
          <Filter className="h-4.5 w-4.5 text-slate-450" />
          <select
            id="employee-dept-filter-select"
            value={deptFilter}
            onChange={(e) => { setDeptFilter(e.target.value); setPage(1); }}
            className="block py-1.5 pl-3 pr-8 border border-slate-300 rounded-md text-sm text-slate-700 bg-white focus:outline-none focus:ring-1 focus:ring-slate-900 transition"
          >
            <option value="all">All Departments</option>
            {departments.map((dept) => (
              <option key={dept._id} value={dept._id}>
                {dept.departmentName}
              </option>
            ))}
          </select>
        </div>

        {(search || deptFilter !== 'all') && (
          <button
            onClick={() => { setSearch(''); setDeptFilter('all'); setPage(1); }}
            className="text-xs text-slate-500 hover:text-slate-800 font-semibold"
          >
            Clear Filters
          </button>
        )}
      </div>

      {/* Staff directory grid or loaders */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-24 bg-white border border-slate-200 rounded-md">
          <Loader2 className="h-6 w-6 text-slate-800 animate-spin" />
          <span className="mt-2 text-xs text-slate-400 font-mono">LOADING STAFF ROSTER FILE INDEXING...</span>
        </div>
      ) : employees.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-md text-center py-20 px-4">
          <Users className="h-10 w-10 text-slate-300 mx-auto mb-3" />
          <h3 className="text-sm font-semibold text-slate-800 font-mono uppercase tracking-wider">No Employees Found</h3>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            We discovered zero registered staff records matching these filters. Add staff from the directory.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {/* Bento-style directory cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" id="employees-grid">
            {employees.map((emp) => (
              <div
                key={emp._id}
                className="bg-white border border-slate-200 rounded-md shadow-sm p-5 hover:pointer-events-auto hover:border-slate-350 transition duration-150 flex flex-col justify-between space-y-4"
              >
                {/* ID badge header */}
                <div className="flex justify-between items-start">
                  <div>
                    <span className="inline-block px-2 py-0.5 rounded text-[10px] bg-slate-100 text-slate-800 border border-slate-250 font-mono font-bold uppercase">
                      {emp.employeeNumber}
                    </span>
                    <h3 className="text-base font-bold text-slate-905 mt-2">
                      {emp.firstName} {emp.lastName}
                    </h3>
                  </div>
                  <span className="text-xs px-2.5 py-0.5 rounded-full font-semibold font-mono bg-indigo-50 border border-indigo-150 text-indigo-805">
                    {emp.department?.departmentCode || 'N/A'}
                  </span>
                </div>

                {/* Info block lines */}
                <div className="space-y-2 text-xs text-slate-600 font-medium">
                  <div className="flex items-center gap-2">
                    <Briefcase className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>{emp.position}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                    <span>Hired: {formatDateString(emp.hiredDate)}</span>
                  </div>
                  {emp.telephone && (
                    <div className="flex items-center gap-2">
                      <Phone className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                      <span>{emp.telephone}</span>
                    </div>
                  )}
                  {emp.address && (
                    <div className="flex items-start gap-2 max-w-full">
                      <MapPin className="h-3.5 w-3.5 text-slate-400 shrink-0 mt-0.5" />
                      <span className="truncate" title={emp.address}>{emp.address}</span>
                    </div>
                  )}
                </div>

                {/* Operations footer */}
                <div className="pt-4 border-t border-slate-100 flex justify-end gap-2 text-xs">
                  <button
                    onClick={() => handleOpenEditOpen(emp)}
                    className="p-1 px-3 border border-slate-200 text-slate-650 hover:bg-slate-105 hover:text-slate-900 rounded font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <Edit className="h-3.5 w-3.5" /> Modify
                  </button>
                  <button
                    onClick={() => handleDeleteRequest(emp._id, `${emp.firstName} ${emp.lastName}`)}
                    className="p-1 px-3 border border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-750 rounded font-semibold transition cursor-pointer flex items-center gap-1"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Terminate
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Simple Pagination Footer Controls */}
          {totalPages >= 1 && (
            <div className="flex items-center justify-between border-t border-slate-200 bg-white px-4 py-3 sm:px-6 rounded-md border mt-6">
              <div className="flex flex-1 justify-between sm:hidden">
                <button
                  disabled={page === 1}
                  onClick={() => setPage((p) => Math.max(1, p - 1))}
                  className="relative inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Previous
                </button>
                <button
                  disabled={page === totalPages}
                  onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                  className="relative ml-3 inline-flex items-center rounded-md border border-slate-300 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 disabled:opacity-40"
                >
                  Next
                </button>
              </div>
              <div className="hidden sm:flex sm:flex-1 sm:items-center sm:justify-between">
                <div>
                  <p className="text-xs text-slate-550">
                    Showing <span className="font-semibold text-slate-800">{(page - 1) * limit + 1}</span> to{' '}
                    <span className="font-semibold text-slate-800">
                      {Math.min(page * limit, total)}
                    </span> of{' '}
                    <span className="font-semibold text-slate-800">{total}</span> employee profiles
                  </p>
                </div>
                <div>
                  <nav className="isolate inline-flex -space-x-px rounded-md shadow-sm" aria-label="Pagination">
                    <button
                      disabled={page === 1}
                      onClick={() => setPage(1)}
                      className="relative inline-flex items-center rounded-l-md px-3 py-1.5 text-xs font-semibold text-slate-500 border border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      First
                    </button>
                    <button
                      disabled={page === 1}
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      className="relative inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-500 border-y border-r border-slate-300 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      Prev
                    </button>
                    <span className="relative inline-flex items-center px-4 py-1.5 text-xs font-bold text-slate-800 border-y border-r border-slate-300 bg-slate-100">
                      Page {page} of {totalPages}
                    </span>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      className="relative inline-flex items-center px-3 py-1.5 text-xs font-semibold text-slate-500 border-y border-r border-slate-350 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      Next
                    </button>
                    <button
                      disabled={page === totalPages}
                      onClick={() => setPage(totalPages)}
                      className="relative inline-flex items-center rounded-r-md px-3 py-1.5 text-xs font-semibold text-slate-450 border-y border-r border-slate-350 bg-white hover:bg-slate-50 disabled:opacity-40 cursor-pointer"
                    >
                      Last
                    </button>
                  </nav>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ==========================================
          ADD EMPLOYEE DIALOG MODAL
          ========================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-2xl w-full shadow-lg overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Register New Employee</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employee ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-emp-num">
                    Employee ID / Number Label *
                  </label>
                  <input
                    id="add-emp-num"
                    type="text"
                    required
                    placeholder="e.g. EMP005"
                    value={empNum}
                    onChange={(e) => setEmpNum(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-950 font-mono"
                  />
                </div>

                {/* Department Selection list */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-emp-dept">
                    Department Assignment *
                  </label>
                  <select
                    id="add-emp-dept"
                    required
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:outline-none"
                  >
                    <option value="" disabled>Select Department</option>
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        [{dept.departmentCode}] {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-emp-fname">
                    First Name *
                  </label>
                  <input
                    id="add-emp-fname"
                    type="text"
                    required
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-emp-lname">
                    Last Name *
                  </label>
                  <input
                    id="add-emp-lname"
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Job Title / Position */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-emp-position">
                    Job Title / Position *
                  </label>
                  <input
                    id="add-emp-position"
                    type="text"
                    required
                    placeholder="e.g. Senior Software Engineer"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Gender */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-emp-gender">
                    Gender *
                  </label>
                  <select
                    id="add-emp-gender"
                    required
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Contact phone */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-emp-telephone">
                    Telephone Number
                  </label>
                  <input
                    id="add-emp-telephone"
                    type="text"
                    placeholder="e.g. +44 7123 456789"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900"
                  />
                </div>

                {/* Date of hire */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-emp-hdate">
                    Employment Commencement Date *
                  </label>
                  <input
                    id="add-emp-hdate"
                    type="date"
                    required
                    value={hiredDate}
                    onChange={(e) => setHiredDate(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Physical Home address label */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-emp-address">
                  Physical Residential Address
                </label>
                <textarea
                  id="add-emp-address"
                  rows={2}
                  placeholder="Street details, County, Country postal labels"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-medium rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-create-emp"
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-850 rounded-md cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Registration'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          MODIFY EMPLOYEE DIALOG MODAL
          ========================================== */}
      {isEditOpen && selectedEmp && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-2xl w-full shadow-lg overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-150 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Modify Employee Profile</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-400 hover:text-slate-700 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Employee ID */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="edit-emp-num">
                    Employee ID Label *
                  </label>
                  <input
                    id="edit-emp-num"
                    type="text"
                    required
                    placeholder="e.g. EMP005"
                    value={empNum}
                    onChange={(e) => setEmpNum(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-950 font-mono disabled:opacity-50"
                    disabled // Immutable ID numbers recommended in system processes
                  />
                </div>

                {/* Department dropdown selection */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="edit-emp-dept">
                    Department Placement *
                  </label>
                  <select
                    id="edit-emp-dept"
                    required
                    value={deptId}
                    onChange={(e) => setDeptId(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 bg-white"
                  >
                    {departments.map((dept) => (
                      <option key={dept._id} value={dept._id}>
                        [{dept.departmentCode}] {dept.departmentName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* First Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="edit-emp-fname">
                    First Name *
                  </label>
                  <input
                    id="edit-emp-fname"
                    type="text"
                    required
                    placeholder="John"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="edit-emp-lname">
                    Last Name *
                  </label>
                  <input
                    id="edit-emp-lname"
                    type="text"
                    required
                    placeholder="Doe"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Job Title / Work position */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="edit-emp-position">
                    Job Title / Position *
                  </label>
                  <input
                    id="edit-emp-position"
                    type="text"
                    required
                    placeholder="e.g. Senior Software Engineer"
                    value={position}
                    onChange={(e) => setPosition(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none"
                  />
                </div>

                {/* Gender select details */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="edit-emp-gender">
                    Gender *
                  </label>
                  <select
                    id="edit-emp-gender"
                    required
                    value={gender}
                    onChange={(e) => setGender(e.target.value as any)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 bg-white focus:outline-none"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                {/* Phone tag contact */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="edit-emp-telephone">
                    Telephone Number
                  </label>
                  <input
                    id="edit-emp-telephone"
                    type="text"
                    placeholder="e.g. +44 7123 456789"
                    value={telephone}
                    onChange={(e) => setTelephone(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900"
                  />
                </div>

                {/* Hired Commencement timestamp date */}
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="edit-emp-hdate">
                    Employment Commencement Date *
                  </label>
                  <input
                    id="edit-emp-hdate"
                    type="date"
                    required
                    value={hiredDate}
                    onChange={(e) => setHiredDate(e.target.value)}
                    className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 font-mono"
                  />
                </div>
              </div>

              {/* Physical Residence location address details */}
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="edit-emp-address">
                  Physical Residential Address
                </label>
                <textarea
                  id="edit-emp-address"
                  rows={2}
                  placeholder="Street details, County, Country postal label"
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none"
                />
              </div>

              <div className="flex gap-2 justify-end pt-4 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditOpen(false)}
                  className="px-4 py-2 border border-slate-200 text-slate-700 hover:bg-slate-100 text-sm font-medium rounded-md cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  id="btn-confirm-edit-emp"
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-850 rounded-md cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50 shadow-sm"
                >
                  {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Modifications'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Custom Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/30">
              <h3 className="text-sm font-bold uppercase font-sans tracking-wide text-rose-700">
                Confirm Profile Termination
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
                Relational Cascade Warning
              </p>
              <p className="text-sm text-slate-600 leading-relaxed">
                You are about to permanently delete <strong className="text-slate-900">{deleteEmpName}</strong> from active rosters. 
                This action is irreversible and will <strong className="text-rose-650">cascade purge all associated payments</strong> and monthly salary voucher receipts.
              </p>
            </div>

            <div className="bg-slate-50/60 px-6 py-4 border-t border-slate-150 flex justify-end gap-2 text-xs">
              <button
                onClick={() => setIsDeleteOpen(false)}
                className="px-4 py-2 border border-slate-200 text-slate-705 bg-white hover:bg-slate-50 font-semibold rounded-md cursor-pointer transition"
              >
                Keep Profile
              </button>
              <button
                id="btn-confirm-delete-employee"
                onClick={executeDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md cursor-pointer transition shadow-sm"
              >
                Confirm Termination
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
