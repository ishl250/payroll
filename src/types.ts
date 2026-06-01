/**
 * Shared Type Definitions for EPMS PayMaster Ltd
 */

export interface Department {
  _id: string;
  departmentCode: string;
  departmentName: string;
}

export interface Employee {
  _id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  address: string;
  position: string;
  telephone: string;
  gender: 'Male' | 'Female' | 'Other';
  hiredDate: string; // ISO date string (YYYY-MM-DD)
  departmentId: string; // References Department._id
  department?: Department; // Populated department object
}

export interface Salary {
  _id: string;
  employeeId: string; // References Employee._id
  grossSalary: number;
  totalDeduction: number;
  netSalary: number;
  monthOfPayment: string; // MM-YYYY format (e.g., '05-2026')
  employee?: Employee; // Populated employee object
}

export interface User {
  _id: string;
  username: string;
  role: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface DashboardMetrics {
  totalEmployees: number;
  totalDepartments: number;
  totalPayrollRecords: number;
  totalSalaryPaid: number;
  salaryByMonth: { month: string; amount: number }[];
  genderDistribution: { gender: string; count: number }[];
  departmentDistribution: { department: string; count: number }[];
}

export interface PayrollReportItem {
  employeeNumber: string;
  name: string;
  position: string;
  departmentName: string;
  grossSalary: number;
  totalDeduction: number;
  netSalary: number;
  paymentDate: string;
}

export interface PayrollReport {
  records: PayrollReportItem[];
  totalGross: number;
  totalDeductions: number;
  totalNet: number;
  reportType: 'Daily' | 'Weekly' | 'Monthly';
  generatedAt: string;
}
