import fs from 'fs';
import path from 'path';
import bcrypt from 'bcryptjs';

const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'db.json');

// Ensure database directory exists
if (!fs.existsSync(DB_DIR)) {
  fs.mkdirSync(DB_DIR, { recursive: true });
}

export interface IDepartment {
  _id: string;
  departmentCode: string;
  departmentName: string;
}

export interface IEmployee {
  _id: string;
  employeeNumber: string;
  firstName: string;
  lastName: string;
  address: string;
  position: string;
  telephone: string;
  gender: 'Male' | 'Female' | 'Other';
  hiredDate: string;
  departmentId: string;
}

export interface ISalary {
  _id: string;
  employeeId: string;
  grossSalary: number;
  totalDeduction: number;
  netSalary: number;
  monthOfPayment: string;
  createdAt?: string; // ISO date format for report generation (Daily/Weekly)
}

export interface IUser {
  _id: string;
  username: string;
  passwordHash: string;
  role: string;
}

export interface IDatabase {
  departments: IDepartment[];
  employees: IEmployee[];
  salaries: ISalary[];
  users: IUser[];
}

// Lowdb-like in-memory database with synchronous JSON persistence
class Database {
  private data: IDatabase = {
    departments: [],
    employees: [],
    salaries: [],
    users: []
  };

  constructor() {
    this.load();
  }

  private load() {
    if (fs.existsSync(DB_FILE)) {
      try {
        const raw = fs.readFileSync(DB_FILE, 'utf-8');
        this.data = JSON.parse(raw);
        console.log('Database loaded successfully with', this.data.employees.length, 'employees');
      } catch (err) {
        console.error('Failed to parse database, initializing fresh one.', err);
        this.initializeSeed();
      }
    } else {
      this.initializeSeed();
    }
  }

  private save() {
    try {
      fs.writeFileSync(DB_FILE, JSON.stringify(this.data, null, 2), 'utf-8');
    } catch (err) {
      console.error('Database write failed:', err);
    }
  }

  private initializeSeed() {
    console.log('Initializing seed database data...');
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('Password123', salt);

    this.data.users = [
      {
        _id: 'user_admin',
        username: 'admin',
        passwordHash,
        role: 'Admin'
      }
    ];

    this.data.departments = [
      { _id: 'dept_hr', departmentCode: 'HR01', departmentName: 'Human Resources' },
      { _id: 'dept_it', departmentCode: 'IT02', departmentName: 'Information Technology' },
      { _id: 'dept_fn', departmentCode: 'FN03', departmentName: 'Finance' },
      { _id: 'dept_sl', departmentCode: 'SL04', departmentName: 'Sales & Marketing' }
    ];

    this.data.employees = [
      {
        _id: 'emp_001',
        employeeNumber: 'EMP001',
        firstName: 'John',
        lastName: 'Doe',
        address: '123 HR Lane, London',
        position: 'HR Manager',
        telephone: '+44 7123 456789',
        gender: 'Male',
        hiredDate: '2024-01-15',
        departmentId: 'dept_hr'
      },
      {
        _id: 'emp_002',
        employeeNumber: 'EMP002',
        firstName: 'Jane',
        lastName: 'Smith',
        address: '456 Tech Blvd, Manchester',
        position: 'Senior Developer',
        telephone: '+44 7234 567890',
        gender: 'Female',
        hiredDate: '2024-03-20',
        departmentId: 'dept_it'
      },
      {
        _id: 'emp_003',
        employeeNumber: 'EMP003',
        firstName: 'Robert',
        lastName: 'Johnson',
        address: '789 Coin Road, Birmingham',
        position: 'Finance Lead',
        telephone: '+44 7345 678901',
        gender: 'Male',
        hiredDate: '2025-05-10',
        departmentId: 'dept_fn'
      }
    ];

    // Historical pay records (including today and days prior for daily/weekly/monthly report matches)
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];

    // A week ago to match weekly payrolls
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 5);
    const weeklyIsoDate = weekAgo.toISOString().split('T')[0];

    // Standard May-2026 format for paymentMonth
    this.data.salaries = [
      {
        _id: 'sal_001',
        employeeId: 'emp_001',
        grossSalary: 5000,
        totalDeduction: 600,
        netSalary: 4400,
        monthOfPayment: '05-2026',
        createdAt: isoDate
      },
      {
        _id: 'sal_002',
        employeeId: 'emp_002',
        grossSalary: 6500,
        totalDeduction: 900,
        netSalary: 5600,
        monthOfPayment: '05-2026',
        createdAt: isoDate
      },
      {
        _id: 'sal_003',
        employeeId: 'emp_003',
        grossSalary: 5500,
        totalDeduction: 750,
        netSalary: 4750,
        monthOfPayment: '05-2026',
        createdAt: weeklyIsoDate
      }
    ];

    this.save();
  }

  // --- Department Operations ---
  getDepartments(): IDepartment[] {
    return this.data.departments;
  }

  getDepartmentById(id: string): IDepartment | undefined {
    return this.data.departments.find(d => d._id === id);
  }

  getDepartmentByCode(code: string): IDepartment | undefined {
    return this.data.departments.find(d => d.departmentCode.toLowerCase() === code.toLowerCase());
  }

  createDepartment(dept: Omit<IDepartment, '_id'>): IDepartment {
    const newDept: IDepartment = {
      ...dept,
      _id: 'dept_' + Math.random().toString(36).substr(2, 9)
    };
    this.data.departments.push(newDept);
    this.save();
    return newDept;
  }

  updateDepartment(id: string, updates: Partial<Omit<IDepartment, '_id'>>): IDepartment | undefined {
    const dept = this.getDepartmentById(id);
    if (!dept) return undefined;
    Object.assign(dept, updates);
    this.save();
    return dept;
  }

  deleteDepartment(id: string): boolean {
    const index = this.data.departments.findIndex(d => d._id === id);
    if (index === -1) return false;
    this.data.departments.splice(index, 1);
    this.save();
    return true;
  }

  // --- Employee Operations ---
  getEmployees(): IEmployee[] {
    return this.data.employees;
  }

  getEmployeeById(id: string): IEmployee | undefined {
    return this.data.employees.find(e => e._id === id);
  }

  getEmployeeByNumber(empNum: string): IEmployee | undefined {
    return this.data.employees.find(e => e.employeeNumber.toLowerCase() === empNum.toLowerCase());
  }

  createEmployee(employee: Omit<IEmployee, '_id'>): IEmployee {
    const newEmp: IEmployee = {
      ...employee,
      _id: 'emp_' + Math.random().toString(36).substr(2, 9)
    };
    this.data.employees.push(newEmp);
    this.save();
    return newEmp;
  }

  updateEmployee(id: string, updates: Partial<Omit<IEmployee, '_id'>>): IEmployee | undefined {
    const emp = this.getEmployeeById(id);
    if (!emp) return undefined;
    Object.assign(emp, updates);
    this.save();
    return emp;
  }

  deleteEmployee(id: string): boolean {
    const index = this.data.employees.findIndex(e => e._id === id);
    if (index === -1) return false;
    this.data.employees.splice(index, 1);

    // Delete associated salaries cascade optionally, or keep them. Let's delete to prevent dangling data
    this.data.salaries = this.data.salaries.filter(s => s.employeeId !== id);

    this.save();
    return true;
  }

  // --- Salary Operations ---
  getSalaries(): ISalary[] {
    return this.data.salaries;
  }

  getSalaryById(id: string): ISalary | undefined {
    return this.data.salaries.find(s => s._id === id);
  }

  createSalary(salary: Omit<ISalary, '_id'>): ISalary {
    const newSal: ISalary = {
      ...salary,
      _id: 'sal_' + Math.random().toString(36).substr(2, 9),
      createdAt: salary.createdAt || new Date().toISOString().split('T')[0]
    };
    this.data.salaries.push(newSal);
    this.save();
    return newSal;
  }

  updateSalary(id: string, updates: Partial<Omit<ISalary, '_id'>>): ISalary | undefined {
    const sal = this.getSalaryById(id);
    if (!sal) return undefined;
    Object.assign(sal, updates);
    this.save();
    return sal;
  }

  deleteSalary(id: string): boolean {
    const index = this.data.salaries.findIndex(s => s._id === id);
    if (index === -1) return false;
    this.data.salaries.splice(index, 1);
    this.save();
    return true;
  }

  // --- User Operations ---
  getUsers(): IUser[] {
    return this.data.users;
  }

  getUserByUsername(username: string): IUser | undefined {
    return this.data.users.find(u => u.username.toLowerCase() === username.toLowerCase());
  }
}

export const db = new Database();
export default db;
