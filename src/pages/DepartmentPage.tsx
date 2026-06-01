import React, { useEffect, useState } from 'react';
import {
  Building2,
  Plus,
  Search,
  Edit,
  Trash2,
  Loader2,
  AlertCircle,
  X
} from 'lucide-react';
import api from '../api';
import { Department } from '../types';
import { useToast } from '../components/Notification';

export default function DepartmentPage() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const { showToast } = useToast();

  // Modal contexts
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [deleteDeptId, setDeleteDeptId] = useState('');
  const [deleteDeptName, setDeleteDeptName] = useState('');

  // Form parameters
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [formSubmitting, setFormSubmitting] = useState(false);

  useEffect(() => {
    fetchDepartments();
  }, [search]);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await api.get('/departments', { params: { search } });
      setDepartments(res.data);
    } catch (err: any) {
      console.error(err);
      showToast('Could not fetch departments list.', 'error');
    } finally {
      setLoading(false);
    }
  };

  const handleOpenCreate = () => {
    setCode('');
    setName('');
    setIsCreateOpen(true);
  };

  const handleOpenEdit = (dept: Department) => {
    setSelectedDept(dept);
    setCode(dept.departmentCode);
    setName(dept.departmentName);
    setIsEditOpen(true);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim() || !name.trim()) {
      showToast('All fields are required.', 'warning');
      return;
    }

    setFormSubmitting(true);
    try {
      await api.post('/departments', {
        departmentCode: code.toUpperCase().trim(),
        departmentName: name.trim()
      });
      showToast('Department added successfully.', 'success');
      setIsCreateOpen(false);
      fetchDepartments();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Failed to add department.';
      showToast(errorMsg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDept) return;
    if (!code.trim() || !name.trim()) {
      showToast('All fields are required.', 'warning');
      return;
    }

    setFormSubmitting(true);
    try {
      await api.put(`/departments/${selectedDept._id}`, {
        departmentCode: code.toUpperCase().trim(),
        departmentName: name.trim()
      });
      showToast('Department updated successfully.', 'success');
      setIsEditOpen(false);
      fetchDepartments();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Failed to update department.';
      showToast(errorMsg, 'error');
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleDeleteRequest = (id: string, name: string) => {
    setDeleteDeptId(id);
    setDeleteDeptName(name);
    setIsDeleteOpen(true);
  };

  const executeDelete = async () => {
    try {
      const res = await api.delete(`/departments/${deleteDeptId}`);
      showToast(res.data.message || 'Department successfully deleted.', 'success');
      setIsDeleteOpen(false);
      fetchDepartments();
    } catch (err: any) {
      console.error(err);
      const errorMsg = err.response?.data?.message || 'Could not delete department.';
      showToast(errorMsg, 'error');
    }
  };

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 border-b border-slate-200 pb-5">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900 tracking-tight">Organization Departments</h1>
          <p className="text-sm text-slate-500 mt-0.5">Manage corporate structures and operations</p>
        </div>
        <button
          id="btn-add-department"
          onClick={handleOpenCreate}
          className="px-4 py-2 text-sm font-medium bg-slate-900 hover:bg-slate-850 text-white rounded-md flex items-center justify-center gap-2 transition cursor-pointer self-start sm:self-auto shadow-sm"
        >
          <Plus className="h-4 w-4" /> Add Department
        </button>
      </div>

      {/* List controls */}
      <div className="flex flex-col sm:flex-row items-center gap-3">
        <div className="relative w-full sm:max-w-xs rounded-md shadow-sm">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-4 w-4 text-slate-400" />
          </div>
          <input
            id="department-search-input"
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="block w-full pl-9 pr-3 py-1.5 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 hover:border-slate-450 transition"
            placeholder="Search code or name..."
          />
        </div>
        {search && (
          <button
            onClick={() => setSearch('')}
            className="text-xs text-slate-500 hover:text-slate-800 font-medium"
          >
            Clear Search
          </button>
        )}
      </div>

      {/* Main Grid table */}
      <div className="bg-white border border-slate-200 rounded-md shadow-sm overflow-hidden" id="departments-list-container">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-24">
            <Loader2 className="h-6 w-6 text-slate-800 animate-spin" />
            <span className="mt-2 text-xs text-slate-400 font-mono">RETRIEVING STRUCTURE PATHS...</span>
          </div>
        ) : departments.length === 0 ? (
          <div className="text-center py-16 px-4">
            <Building2 className="h-10 w-10 text-slate-300 mx-auto mb-3" />
            <h3 className="text-sm font-semibold text-slate-800 uppercase tracking-widest font-mono">No Departments Found</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
              There are no organizational branches loaded matching your search filter. Create one to get started.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200 text-left text-sm text-slate-800">
              <thead className="bg-slate-50 font-semibold text-slate-700 uppercase block-headers">
                <tr>
                  <th scope="col" className="px-6 py-3.5 text-xs font-bold tracking-wider">
                    Dept. Code
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-bold tracking-wider">
                    Department Name
                  </th>
                  <th scope="col" className="px-6 py-3.5 text-xs font-bold tracking-wider text-right">
                    Management Operations
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {departments.map((dept) => (
                  <tr key={dept._id} className="hover:bg-slate-50/55 transition duration-150">
                    <td className="whitespace-nowrap px-6 py-4 font-mono text-xs font-bold text-slate-900">
                      {dept.departmentCode}
                    </td>
                    <td className="px-6 py-4 font-medium text-slate-800">
                      {dept.departmentName}
                    </td>
                    <td className="whitespace-nowrap px-6 py-4 text-right text-xs">
                      <div className="flex gap-2 justify-end">
                        <button
                          onClick={() => handleOpenEdit(dept)}
                          className="p-1 px-2.5 rounded border border-slate-200 text-slate-650 hover:bg-slate-100 hover:text-slate-900 transition flex items-center gap-1.5 cursor-pointer font-medium"
                        >
                          <Edit className="h-3.5 w-3.5" /> Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRequest(dept._id, dept.departmentName)}
                          className="p-1 px-2.5 rounded border border-rose-100 text-rose-600 hover:bg-rose-50 hover:text-rose-700 transition flex items-center gap-1.5 cursor-pointer font-medium"
                        >
                          <Trash2 className="h-3.5 w-3.5" /> Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* ==========================================
          CREATE DEPARTMENT MODAL
          ========================================== */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-md w-full shadow-lg overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Add Department</h3>
              <button onClick={() => setIsCreateOpen(false)} className="text-slate-405 hover:text-slate-700 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-dept-code">
                  Department Code (Uppercase Alphanumeric)
                </label>
                <input
                  id="add-dept-code"
                  type="text"
                  required
                  placeholder="e.g. ENG04"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono tracking-wider"
                />
                <span className="block text-[10px] text-slate-400 mt-1 uppercase font-mono">Alphanumeric 2 to 10 chars</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="add-dept-name">
                  Department Name
                </label>
                <input
                  id="add-dept-name"
                  type="text"
                  required
                  placeholder="e.g. Software Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
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
                  id="btn-confirm-create-dept"
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-850 rounded-md cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Confirm Add'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ==========================================
          EDIT DEPARTMENT MODAL
          ========================================== */}
      {isEditOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto flex items-center justify-center bg-black/50 p-4">
          <div className="bg-white border border-slate-200 rounded-md max-w-md w-full shadow-lg overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
              <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wider">Edit Department</h3>
              <button onClick={() => setIsEditOpen(false)} className="text-slate-405 hover:text-slate-700 p-1">
                <X className="h-5 w-5" />
              </button>
            </div>
            <form onSubmit={handleUpdate} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="edit-dept-code">
                  Department Code
                </label>
                <input
                  id="edit-dept-code"
                  type="text"
                  required
                  placeholder="e.g. ENG04"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900 font-mono tracking-wider bg-slate-50 cursor-not-allowed"
                  disabled // Recommended for standard DB flow
                />
                <span className="block text-[10px] text-slate-400 mt-1 uppercase font-mono">Department code modifications disabled for relational safety</span>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1" htmlFor="edit-dept-name">
                  Department Name
                </label>
                <input
                  id="edit-dept-name"
                  type="text"
                  required
                  placeholder="e.g. Software Engineering"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="block w-full py-2 px-3 border border-slate-300 rounded-md text-sm text-slate-900 focus:outline-none focus:ring-1 focus:ring-slate-900 focus:border-slate-900"
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
                  id="btn-confirm-edit-dept"
                  type="submit"
                  disabled={formSubmitting}
                  className="px-4 py-2 text-sm font-medium text-white bg-slate-900 hover:bg-slate-850 rounded-md cursor-pointer inline-flex items-center gap-1.5 disabled:opacity-50"
                >
                  {formSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Custom Department Delete Confirmation Modal */}
      {isDeleteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-md border border-slate-200 shadow-xl max-w-md w-full overflow-hidden animate-slide-in">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-rose-50/30">
              <h3 className="text-sm font-bold uppercase font-sans tracking-wide text-rose-700">
                Confirm Department Deletion
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
                Relational Safeguard Check
              </p>
              <p className="text-sm text-slate-605 leading-relaxed">
                You are about to permanently delete the department <strong className="text-slate-900">{deleteDeptName}</strong>. 
                Departments can only be removed if they are completely empty and do not contain any active employee records.
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
                id="btn-confirm-delete-dept"
                onClick={executeDelete}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white font-semibold rounded-md cursor-pointer transition shadow-sm"
              >
                Delete Department
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
