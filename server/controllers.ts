import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';
import { db } from './db';
import { AuthenticatedRequest } from './middleware';
import {
  isMongoConnected,
  MongoUser,
  MongoDepartment,
  MongoEmployee,
  MongoSalary
} from './mongoDb';

const JWT_SECRET = process.env.JWT_SECRET || 'paymaster_secret_2026';

// ==========================================
// AUTH CONTROLLER
// ==========================================
export async function login(req: Request, res: Response): Promise<void> {
  const { username, password } = req.body;

  if (!username || !password) {
    res.status(400).json({ message: 'Username and password are required.' });
    return;
  }

  let user: { _id: string; username: string; passwordHash: string; role: string } | null = null;

  if (isMongoConnected) {
    try {
      const dbUser = await (MongoUser as any).findOne({ username: username.toLowerCase() });
      if (dbUser) {
        user = {
          _id: dbUser._id.toString(),
          username: dbUser.username,
          passwordHash: dbUser.passwordHash,
          role: dbUser.role
        };
      }
    } catch (err) {
      console.error('Mongo user query failed, falling back to Local db:', err);
    }
  }

  if (!user) {
    const localUser = db.getUserByUsername(username);
    if (localUser) {
      user = {
        _id: localUser._id,
        username: localUser.username,
        passwordHash: localUser.passwordHash,
        role: localUser.role
      };
    }
  }

  if (!user) {
    res.status(401).json({ message: 'Invalid credentials. User not found.' });
    return;
  }

  const isPasswordValid = bcrypt.compareSync(password, user.passwordHash);
  if (!isPasswordValid) {
    res.status(401).json({ message: 'Invalid credentials. Password incorrect.' });
    return;
  }

  const tokenPayload = {
    _id: user._id,
    username: user.username,
    role: user.role
  };

  const token = jwt.sign(tokenPayload, JWT_SECRET, { expiresIn: '8h' });

  res.status(200).json({
    message: 'Login successful.',
    token,
    user: {
      _id: user._id,
      username: user.username,
      role: user.role
    }
  });
}

export function getCurrentUser(req: AuthenticatedRequest, res: Response): void {
  if (!req.user) {
    res.status(401).json({ message: 'Unauthorized.' });
    return;
  }
  res.status(200).json({ user: req.user });
}

// ==========================================
// DEPARTMENT CONTROLLER
// ==========================================
export async function getDepartments(req: Request, res: Response): Promise<void> {
  const search = req.query.search as string;

  if (isMongoConnected) {
    try {
      let query: any = {};
      if (search) {
        const regex = new RegExp(search, 'i');
        query = {
          $or: [
            { departmentCode: regex },
            { departmentName: regex }
          ]
        };
      }
      const list = await (MongoDepartment as any).find(query).sort({ departmentCode: 1 });
      res.status(200).json(list);
      return;
    } catch (err) {
      console.error('Mongo query failed, falling back to Local db:', err);
    }
  }

  let list = db.getDepartments();
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(d => 
      d.departmentCode.toLowerCase().includes(q) || 
      d.departmentName.toLowerCase().includes(q)
    );
  }
  res.status(200).json(list);
}

export async function getDepartmentById(req: Request, res: Response): Promise<void> {
  const id = req.params.id;

  if (isMongoConnected) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const dept = await (MongoDepartment as any).findById(id);
        if (dept) {
          res.status(200).json(dept);
          return;
        }
      }
    } catch (err) {
      console.error('Mongo query failed, falling back to Local db:', err);
    }
  }

  const dept = db.getDepartmentById(id);
  if (!dept) {
    res.status(404).json({ message: 'Department not found.' });
    return;
  }
  res.status(200).json(dept);
}

export async function createDepartment(req: Request, res: Response): Promise<void> {
  const { departmentCode, departmentName } = req.body;

  if (!departmentCode || !departmentName) {
    res.status(400).json({ message: 'Department code and name are required.' });
    return;
  }

  const codeRegex = /^[A-Z0-9]{2,10}$/;
  if (!codeRegex.test(departmentCode)) {
    res.status(400).json({ message: 'Department code must be 2-10 alphanumeric uppercase characters.' });
    return;
  }

  if (isMongoConnected) {
    try {
      const existing = await (MongoDepartment as any).findOne({ departmentCode: departmentCode.toUpperCase().trim() });
      if (existing) {
        res.status(400).json({ message: `Department code ${departmentCode} already exists.` });
        return;
      }
      const newDept = await (MongoDepartment as any).create({
        departmentCode: departmentCode.toUpperCase().trim(),
        departmentName: departmentName.trim()
      });
      res.status(201).json(newDept);
      return;
    } catch (err) {
      console.error('Mongo operation failed, falling back to Local db:', err);
    }
  }

  const existing = db.getDepartmentByCode(departmentCode);
  if (existing) {
    res.status(400).json({ message: `Department code ${departmentCode} already exists.` });
    return;
  }

  const newDept = db.createDepartment({ departmentCode, departmentName });
  res.status(201).json(newDept);
}

export async function updateDepartment(req: Request, res: Response): Promise<void> {
  const { departmentCode, departmentName } = req.body;
  const id = req.params.id;

  if (!departmentCode || !departmentName) {
    res.status(400).json({ message: 'Department code and name are required.' });
    return;
  }

  if (isMongoConnected) {
    try {
      const existing = await (MongoDepartment as any).findOne({ departmentCode: departmentCode.toUpperCase().trim() });
      if (existing && existing._id.toString() !== id) {
        res.status(400).json({ message: `Department code ${departmentCode} is taken by another department.` });
        return;
      }
      if (mongoose.Types.ObjectId.isValid(id)) {
        const updated = await (MongoDepartment as any).findByIdAndUpdate(
          id,
          { departmentCode: departmentCode.toUpperCase().trim(), departmentName: departmentName.trim() },
          { new: true }
        );
        if (updated) {
          res.status(200).json(updated);
          return;
        }
      }
    } catch (err) {
      console.error('Mongo operation failed, falling back to Local db:', err);
    }
  }

  const existing = db.getDepartmentByCode(departmentCode);
  if (existing && existing._id !== id) {
    res.status(400).json({ message: `Department code ${departmentCode} is taken by another department.` });
    return;
  }

  const updated = db.updateDepartment(id, { departmentCode, departmentName });
  if (!updated) {
    res.status(404).json({ message: 'Department not found.' });
    return;
  }

  res.status(200).json(updated);
}

export async function deleteDepartment(req: Request, res: Response): Promise<void> {
  const id = req.params.id;

  if (isMongoConnected) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        // Let's verify no employee currently belongs to this department before deleting it
        const dependentCount = await (MongoEmployee as any).countDocuments({ departmentId: new mongoose.Types.ObjectId(id) });
        if (dependentCount > 0) {
          res.status(400).json({ 
            message: `Cannot delete department. There are ${dependentCount} employee(s) assigned to this department.` 
          });
          return;
        }
        const deleted = await (MongoDepartment as any).findByIdAndDelete(id);
        if (deleted) {
          res.status(200).json({ success: true, message: 'Department successfully deleted.' });
          return;
        }
      }
    } catch (err) {
      console.error('Mongo operation failed, falling back to Local db:', err);
    }
  }

  // Let's verify no employee currently belongs to this department before deleting it
  const dependentEmployees = db.getEmployees().filter(e => e.departmentId === id);
  if (dependentEmployees.length > 0) {
    res.status(400).json({ 
      message: `Cannot delete department. There are ${dependentEmployees.length} employee(s) assigned to this department.` 
    });
    return;
  }

  const deleted = db.deleteDepartment(id);
  if (!deleted) {
    res.status(404).json({ message: 'Department not found.' });
    return;
  }

  res.status(200).json({ success: true, message: 'Department successfully deleted.' });
}

// ==========================================
// EMPLOYEE CONTROLLER
// ==========================================
export async function getEmployees(req: Request, res: Response): Promise<void> {
  const search = req.query.search as string;
  const departmentId = req.query.departmentId as string;
  
  // Pagination
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 8;
  const skip = (page - 1) * limit;

  if (isMongoConnected) {
    try {
      const q: any = {};
      if (departmentId && departmentId !== 'all') {
        if (mongoose.Types.ObjectId.isValid(departmentId)) {
          q.departmentId = new mongoose.Types.ObjectId(departmentId);
        }
      }

      if (search) {
        const regex = new RegExp(search, 'i');
        q.$or = [
          { firstName: regex },
          { lastName: regex },
          { employeeNumber: regex },
          { position: regex }
        ];
      }

      const total = await (MongoEmployee as any).countDocuments(q);
      const totalPages = Math.ceil(total / limit);

      const dbEmployees = await (MongoEmployee as any).find(q)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate({ path: 'departmentId', model: 'Department' });

      // Format employees object to match client expecting 'department' property
      const employees = dbEmployees.map((empObj: any) => {
        const doc = empObj.toObject();
        return {
          ...doc,
          _id: doc._id.toString(),
          departmentId: doc.departmentId?._id?.toString() || doc.departmentId?.toString() || '',
          department: doc.departmentId
        };
      });

      res.status(200).json({
        employees,
        total,
        page,
        totalPages
      });
      return;
    } catch (err) {
      console.error('Mongo employee query failed. Falling back to Local db:', err);
    }
  }

  let list = db.getEmployees();

  // Filter by department if supplied
  if (departmentId && departmentId !== 'all') {
    list = list.filter(e => e.departmentId === departmentId);
  }

  // Filter by search matching firstName, lastName, positions, or employee number
  if (search) {
    const q = search.toLowerCase();
    list = list.filter(e => 
      e.firstName.toLowerCase().includes(q) || 
      e.lastName.toLowerCase().includes(q) ||
      e.employeeNumber.toLowerCase().includes(q) ||
      e.position.toLowerCase().includes(q)
    );
  }

  // Populate departments
  const populated = list.map(emp => {
    const department = db.getDepartmentById(emp.departmentId);
    return { ...emp, department };
  });

  // Calculate total and paginate
  const total = populated.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedList = populated.slice(skip, skip + limit);

  res.status(200).json({
    employees: paginatedList,
    total,
    page,
    totalPages
  });
}

export async function getEmployeeById(req: Request, res: Response): Promise<void> {
  const id = req.params.id;

  if (isMongoConnected) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const empVal = await (MongoEmployee as any).findById(id).populate({ path: 'departmentId', model: 'Department' });
        if (empVal) {
          const doc = empVal.toObject();
          res.status(200).json({
            ...doc,
            _id: doc._id.toString(),
            departmentId: doc.departmentId?._id?.toString() || doc.departmentId?.toString() || '',
            department: doc.departmentId
          });
          return;
        }
      }
    } catch (err) {
      console.error('Mongo employee lookup by id failed. Falling back:', err);
    }
  }

  const emp = db.getEmployeeById(id);
  if (!emp) {
    res.status(404).json({ message: 'Employee not found.' });
    return;
  }
  const department = db.getDepartmentById(emp.departmentId);
  res.status(200).json({ ...emp, department });
}

export async function createEmployee(req: Request, res: Response): Promise<void> {
  const {
    employeeNumber,
    firstName,
    lastName,
    address,
    position,
    telephone,
    gender,
    hiredDate,
    departmentId
  } = req.body;

  // Validation
  if (!employeeNumber || !firstName || !lastName || !position || !departmentId || !gender || !hiredDate) {
    res.status(400).json({ message: 'Required fields are missing.' });
    return;
  }

  // Double check code format
  if (!/^[a-zA-Z0-9\-–_]{3,20}$/.test(employeeNumber)) {
    res.status(400).json({ message: 'Employee number must be 3-20 alphanumeric characters (or dashes).' });
    return;
  }

  if (isMongoConnected) {
    try {
      const existing = await (MongoEmployee as any).findOne({ employeeNumber: employeeNumber.toUpperCase().trim() });
      if (existing) {
        res.status(400).json({ message: `Employee record with employee ID number "${employeeNumber}" already exists.` });
        return;
      }

      if (mongoose.Types.ObjectId.isValid(departmentId)) {
        const dept = await (MongoDepartment as any).findById(departmentId);
        if (!dept) {
          res.status(400).json({ message: 'Assigned Department does not exist.' });
          return;
        }

        const newEmp = await (MongoEmployee as any).create({
          employeeNumber: employeeNumber.toUpperCase().trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          address: address || '',
          position: position.trim(),
          telephone: telephone || '',
          gender,
          hiredDate,
          departmentId: new mongoose.Types.ObjectId(departmentId)
        });

        res.status(201).json({
          ...newEmp.toObject(),
          _id: newEmp._id.toString(),
          departmentId: departmentId
        });
        return;
      }
    } catch (err) {
      console.error('Mongo employee construction failed. Falling back:', err);
    }
  }

  const existing = db.getEmployeeByNumber(employeeNumber);
  if (existing) {
    res.status(400).json({ message: `Employee record with employee ID number "${employeeNumber}" already exists.` });
    return;
  }

  const dept = db.getDepartmentById(departmentId);
  if (!dept) {
    res.status(400).json({ message: 'Assigned Department does not exist.' });
    return;
  }

  const newEmp = db.createEmployee({
    employeeNumber,
    firstName,
    lastName,
    address: address || '',
    position,
    telephone: telephone || '',
    gender,
    hiredDate,
    departmentId
  });

  res.status(201).json(newEmp);
}

export async function updateEmployee(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  const {
    employeeNumber,
    firstName,
    lastName,
    address,
    position,
    telephone,
    gender,
    hiredDate,
    departmentId
  } = req.body;

  if (!employeeNumber || !firstName || !lastName || !position || !departmentId || !gender || !hiredDate) {
    res.status(400).json({ message: 'Required fields cannot be empty.' });
    return;
  }

  if (isMongoConnected) {
    try {
      const existing = await (MongoEmployee as any).findOne({ employeeNumber: employeeNumber.toUpperCase().trim() });
      if (existing && existing._id.toString() !== id) {
        res.status(400).json({ message: `Employee number "${employeeNumber}" is already in use by another person.` });
        return;
      }

      if (mongoose.Types.ObjectId.isValid(departmentId) && mongoose.Types.ObjectId.isValid(id)) {
        const dept = await (MongoDepartment as any).findById(departmentId);
        if (!dept) {
          res.status(400).json({ message: 'Assigned Department does not exist.' });
          return;
        }

        const updated = await (MongoEmployee as any).findByIdAndUpdate(
          id,
          {
            employeeNumber: employeeNumber.toUpperCase().trim(),
            firstName: firstName.trim(),
            lastName: lastName.trim(),
            address: address || '',
            position: position.trim(),
            telephone: telephone || '',
            gender,
            hiredDate,
            departmentId: new mongoose.Types.ObjectId(departmentId)
          },
          { new: true }
        );

        if (updated) {
          res.status(200).json({
            ...updated.toObject(),
            _id: updated._id.toString(),
            departmentId: departmentId
          });
          return;
        }
      }
    } catch (err) {
      console.error('Mongo employee updating failed. Falling back:', err);
    }
  }

  const existing = db.getEmployeeByNumber(employeeNumber);
  if (existing && existing._id !== id) {
    res.status(400).json({ message: `Employee number "${employeeNumber}" is already in use by another person.` });
    return;
  }

  const dept = db.getDepartmentById(departmentId);
  if (!dept) {
    res.status(400).json({ message: 'Assigned Department does not exist.' });
    return;
  }

  const updated = db.updateEmployee(id, {
    employeeNumber,
    firstName,
    lastName,
    address,
    position,
    telephone,
    gender,
    hiredDate,
    departmentId
  });

  if (!updated) {
    res.status(404).json({ message: 'Employee not found.' });
    return;
  }

  res.status(200).json(updated);
}

export async function deleteEmployee(req: Request, res: Response): Promise<void> {
  const id = req.params.id;

  if (isMongoConnected) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        // Cascade delete employee records and salary pay slips!
        const deleted = await (MongoEmployee as any).findByIdAndDelete(id);
        if (deleted) {
          await (MongoSalary as any).deleteMany({ employeeId: new mongoose.Types.ObjectId(id) });
          res.status(200).json({ success: true, message: 'Employee profile and all past payrolls successfully archived.' });
          return;
        }
      }
    } catch (err) {
      console.error('Mongo employee deletion cascade failed. Falling back:', err);
    }
  }

  const deleted = db.deleteEmployee(id);
  if (!deleted) {
    res.status(404).json({ message: 'Employee not found or deletion failed.' });
    return;
  }
  res.status(200).json({ success: true, message: 'Employee profile and all past payrolls successfully archived.' });
}

// ==========================================
// SALARY CONTROLLER
// ==========================================
export async function getSalaries(req: Request, res: Response): Promise<void> {
  const search = req.query.search as string;
  const monthOfPayment = req.query.monthOfPayment as string; // Optional filtering

  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 8;
  const skip = (page - 1) * limit;

  if (isMongoConnected) {
    try {
      const q: any = {};
      if (monthOfPayment && monthOfPayment !== 'all') {
        q.monthOfPayment = monthOfPayment;
      }

      // Populating deep to get employee and their department
      const allSals = await (MongoSalary as any).find(q)
        .populate({
          path: 'employeeId',
          model: 'Employee',
          populate: { path: 'departmentId', model: 'Department' }
        });

      // Filter by search matching employee details
      let populated = allSals.map(salDoc => {
        const doc = salDoc.toObject();
        const emp = doc.employeeId;
        const dept = emp ? emp.departmentId : null;
        
        return {
          ...doc,
          _id: doc._id.toString(),
          employeeId: emp ? emp._id?.toString() : doc.employeeId?.toString(),
          employee: emp ? {
            ...emp,
            _id: emp._id.toString(),
            departmentId: dept ? dept._id.toString() : '',
            department: dept
          } : null
        };
      });

      if (search) {
        const regexQ = search.toLowerCase();
        populated = populated.filter(sal => {
          const emp = sal.employee;
          if (!emp) return false;
          return (
            emp.firstName.toLowerCase().includes(regexQ) ||
            emp.lastName.toLowerCase().includes(regexQ) ||
            emp.employeeNumber.toLowerCase().includes(regexQ) ||
            emp.position.toLowerCase().includes(regexQ)
          );
        });
      }

      const total = populated.length;
      const totalPages = Math.ceil(total / limit);
      const paginatedList = populated.slice(skip, skip + limit);

      res.status(200).json({
        salaries: paginatedList,
        total,
        page,
        totalPages
      });
      return;
    } catch (err) {
      console.error('Mongo salary query failed. Falling back:', err);
    }
  }

  let list = db.getSalaries();

  // Filter by MonthOfPayment if selected
  if (monthOfPayment && monthOfPayment !== 'all') {
    list = list.filter(s => s.monthOfPayment === monthOfPayment);
  }

  // Populate employee and dynamic query searching
  let populated = list.map(sal => {
    const employee = db.getEmployeeById(sal.employeeId);
    let department = null;
    if (employee) {
      department = db.getDepartmentById(employee.departmentId);
    }
    return {
      ...sal,
      employee: employee ? { ...employee, department } : null
    };
  });

  // Filter by search matching employee names or position
  if (search) {
    const q = search.toLowerCase();
    populated = populated.filter(sal => {
      const emp = sal.employee;
      if (!emp) return false;
      return (
        emp.firstName.toLowerCase().includes(q) ||
        emp.lastName.toLowerCase().includes(q) ||
        emp.employeeNumber.toLowerCase().includes(q) ||
        emp.position.toLowerCase().includes(q)
      );
    });
  }

  const total = populated.length;
  const totalPages = Math.ceil(total / limit);
  const paginatedList = populated.slice(skip, skip + limit);

  res.status(200).json({
    salaries: paginatedList,
    total,
    page,
    totalPages
  });
}

export async function getSalaryById(req: Request, res: Response): Promise<void> {
  const id = req.params.id;

  if (isMongoConnected) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const salDoc = await (MongoSalary as any).findById(id).populate({
          path: 'employeeId',
          model: 'Employee',
          populate: { path: 'departmentId', model: 'Department' }
        });
        if (salDoc) {
          const doc = salDoc.toObject();
          const emp = doc.employeeId;
          const dept = emp ? emp.departmentId : null;
          res.status(200).json({
            ...doc,
            _id: doc._id.toString(),
            employeeId: emp ? emp._id.toString() : doc.employeeId.toString(),
            employee: emp ? {
              ...emp,
              _id: emp._id.toString(),
              departmentId: dept ? dept._id.toString() : '',
              department: dept
            } : null
          });
          return;
        }
      }
    } catch (err) {
      console.error('Mongo salary lookup failed. Falling back:', err);
    }
  }

  const sal = db.getSalaryById(id);
  if (!sal) {
    res.status(404).json({ message: 'Salary receipt record not found.' });
    return;
  }
  const employee = db.getEmployeeById(sal.employeeId);
  res.status(200).json({ ...sal, employee });
}

export async function createSalary(req: Request, res: Response): Promise<void> {
  const { employeeId, grossSalary, totalDeduction, monthOfPayment, createdAt } = req.body;

  if (!employeeId || grossSalary === undefined || totalDeduction === undefined || !monthOfPayment) {
    res.status(400).json({ message: 'Employee, gross salary, total deduction, and payment month are required.' });
    return;
  }

  const grossVal = parseFloat(grossSalary);
  const deductVal = parseFloat(totalDeduction);

  if (isNaN(grossVal) || grossVal <= 0) {
    res.status(400).json({ message: 'Gross Salary must be a positive number.' });
    return;
  }

  if (isNaN(deductVal) || deductVal < 0) {
    res.status(400).json({ message: 'Total Deduction must be a positive number or zero.' });
    return;
  }

  if (deductVal > grossVal) {
    res.status(400).json({ message: 'Total Deduction cannot exceed the Gross Salary.' });
    return;
  }

  if (isMongoConnected) {
    try {
      if (mongoose.Types.ObjectId.isValid(employeeId)) {
        // Confirm Employee Exists
        const emp = await (MongoEmployee as any).findById(employeeId);
        if (!emp) {
          res.status(404).json({ message: 'Selected Employee does not exist.' });
          return;
        }

        // Validate only ONE payout record per employee per selected billing month
        const existingPay = await (MongoSalary as any).findOne({
          employeeId: new mongoose.Types.ObjectId(employeeId),
          monthOfPayment
        });

        if (existingPay) {
          res.status(400).json({ 
            message: `Employee was already paid for ${monthOfPayment}. To change, please update or remove existing salary receipt.` 
          });
          return;
        }

        const netSalary = parseFloat((grossVal - deductVal).toFixed(2));
        const newSal = await (MongoSalary as any).create({
          employeeId: new mongoose.Types.ObjectId(employeeId),
          grossSalary: grossVal,
          totalDeduction: deductVal,
          netSalary,
          monthOfPayment,
          createdAt: createdAt || new Date().toISOString().split('T')[0]
        });

        res.status(201).json({
          ...newSal.toObject(),
          _id: newSal._id.toString(),
          employeeId: employeeId
        });
        return;
      }
    } catch (err) {
      console.error('Mongo salary creation failed. Falling back:', err);
    }
  }

  // Confirm Employee Exists
  const emp = db.getEmployeeById(employeeId);
  if (!emp) {
    res.status(404).json({ message: 'Selected Employee does not exist.' });
    return;
  }

  // Validate only ONE payout record per employee per selected billing month
  const existingPay = db.getSalaries().find(s => s.employeeId === employeeId && s.monthOfPayment === monthOfPayment);
  if (existingPay) {
    res.status(400).json({ 
      message: `Employee was already paid for ${monthOfPayment}. To change, please update or remove existing salary receipt.` 
    });
    return;
  }

  const netSalary = parseFloat((grossVal - deductVal).toFixed(2));

  const newSal = db.createSalary({
    employeeId,
    grossSalary: grossVal,
    totalDeduction: deductVal,
    netSalary,
    monthOfPayment,
    createdAt: createdAt || new Date().toISOString().split('T')[0]
  });

  res.status(201).json(newSal);
}

export async function updateSalary(req: Request, res: Response): Promise<void> {
  const id = req.params.id;
  const { grossSalary, totalDeduction, monthOfPayment } = req.body;

  if (isMongoConnected) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const original = await (MongoSalary as any).findById(id);
        if (!original) {
          res.status(404).json({ message: 'Salary receipt record not found.' });
          return;
        }

        let grossVal = original.grossSalary;
        let deductVal = original.totalDeduction;

        if (grossSalary !== undefined) {
          grossVal = parseFloat(grossSalary);
          if (isNaN(grossVal) || grossVal <= 0) {
            res.status(400).json({ message: 'Gross Salary must be a valid positive number.' });
            return;
          }
        }

        if (totalDeduction !== undefined) {
          deductVal = parseFloat(totalDeduction);
          if (isNaN(deductVal) || deductVal < 0) {
            res.status(400).json({ message: 'Total Deduction must be a valid positive number or zero.' });
            return;
          }
        }

        if (deductVal > grossVal) {
          res.status(400).json({ message: 'Deductions must not exceed the gross pay.' });
          return;
        }

        const targetMonth = monthOfPayment || original.monthOfPayment;
        if (targetMonth !== original.monthOfPayment) {
          const existingPay = await (MongoSalary as any).findOne({
            employeeId: original.employeeId,
            monthOfPayment: targetMonth,
            _id: { $ne: original._id }
          });
          if (existingPay) {
            res.status(400).json({ message: `Employee was already paid for billing month ${targetMonth}.` });
            return;
          }
        }

        const netSalary = parseFloat((grossVal - deductVal).toFixed(2));
        const updated = await (MongoSalary as any).findByIdAndUpdate(
          id,
          {
            grossSalary: grossVal,
            totalDeduction: deductVal,
            netSalary,
            monthOfPayment: targetMonth
          },
          { new: true }
        );

        if (updated) {
          res.status(200).json({
            ...updated.toObject(),
            _id: updated._id.toString(),
            employeeId: updated.employeeId.toString()
          });
          return;
        }
      }
    } catch (err) {
      console.error('Mongo salary update failed. Falling back:', err);
    }
  }

  const original = db.getSalaryById(id);
  if (!original) {
    res.status(404).json({ message: 'Salary receipt record not found.' });
    return;
  }

  // Validations
  let grossVal = original.grossSalary;
  let deductVal = original.totalDeduction;

  if (grossSalary !== undefined) {
    grossVal = parseFloat(grossSalary);
    if (isNaN(grossVal) || grossVal <= 0) {
      res.status(400).json({ message: 'Gross Salary must be a valid positive number.' });
      return;
    }
  }

  if (totalDeduction !== undefined) {
    deductVal = parseFloat(totalDeduction);
    if (isNaN(deductVal) || deductVal < 0) {
      res.status(400).json({ message: 'Total Deduction must be a valid positive number or zero.' });
      return;
    }
  }

  if (deductVal > grossVal) {
    res.status(400).json({ message: 'Deductions must not exceed the gross pay.' });
    return;
  }

  if (monthOfPayment && monthOfPayment !== original.monthOfPayment) {
    // Confirm unique month per employee
    const existingPay = db.getSalaries().find(s => 
      s.employeeId === original.employeeId && 
      s.monthOfPayment === monthOfPayment && 
      s._id !== id
    );
    if (existingPay) {
      res.status(400).json({ message: `Employee was already paid for billing month ${monthOfPayment}.` });
      return;
    }
  }

  const netSalary = parseFloat((grossVal - deductVal).toFixed(2));

  const updated = db.updateSalary(id, {
    grossSalary: grossVal,
    totalDeduction: deductVal,
    netSalary,
    monthOfPayment: monthOfPayment || original.monthOfPayment
  });

  res.status(200).json(updated);
}

export async function deleteSalary(req: Request, res: Response): Promise<void> {
  const id = req.params.id;

  if (isMongoConnected) {
    try {
      if (mongoose.Types.ObjectId.isValid(id)) {
        const deleted = await (MongoSalary as any).findByIdAndDelete(id);
        if (deleted) {
          res.status(200).json({ success: true, message: 'Salary voucher deleted successfully.' });
          return;
        }
      }
    } catch (err) {
      console.error('Mongo salary delete failed:', err);
    }
  }

  const deleted = db.deleteSalary(id);
  if (!deleted) {
    res.status(404).json({ message: 'Salary receipt record not found.' });
    return;
  }
  res.status(200).json({ success: true, message: 'Salary voucher deleted successfully.' });
}

// ==========================================
// REPORTS CONTROLLER
// ==========================================
export async function getPayrollReports(req: Request, res: Response): Promise<void> {
  const type = (req.query.type as string || 'monthly').toLowerCase(); // 'daily', 'weekly', 'monthly'
  const filterMonth = req.query.monthOfPayment as string; // defaults to latest if omitted

  const today = new Date();

  if (isMongoConnected) {
    try {
      const allSals = await (MongoSalary as any).find({}).populate({
        path: 'employeeId',
        model: 'Employee',
        populate: { path: 'departmentId', model: 'Department' }
      });

      let filteredSals = allSals;

      if (type === 'daily') {
        const todayStr = today.toISOString().split('T')[0];
        filteredSals = allSals.filter(s => s.createdAt && s.createdAt === todayStr);
      } else if (type === 'weekly') {
        const weekAgo = new Date();
        weekAgo.setDate(today.getDate() - 7);
        filteredSals = allSals.filter(s => {
          if (!s.createdAt) return false;
          const salDate = new Date(s.createdAt);
          return salDate >= weekAgo && salDate <= today;
        });
      } else {
        if (filterMonth && filterMonth !== 'all') {
          filteredSals = allSals.filter(s => s.monthOfPayment === filterMonth);
        } else {
          if (allSals.length > 0) {
            const sortedMonths = [...allSals].sort((a, b) => b.monthOfPayment.localeCompare(a.monthOfPayment));
            const latestMonth = sortedMonths[0].monthOfPayment;
            filteredSals = allSals.filter(s => s.monthOfPayment === latestMonth);
          }
        }
      }

      const records = filteredSals.map(salDoc => {
        const doc = salDoc.toObject();
        const emp = doc.employeeId;
        const dept = emp ? emp.departmentId : null;
        const deptName = dept ? dept.departmentName : 'N/A';

        return {
          employeeNumber: emp ? emp.employeeNumber : 'N/A',
          name: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown Employee',
          position: emp ? emp.position : 'N/A',
          departmentName: deptName,
          grossSalary: doc.grossSalary,
          totalDeduction: doc.totalDeduction,
          netSalary: doc.netSalary,
          paymentDate: doc.createdAt || 'N/A'
        };
      });

      const totalGross = parseFloat(records.reduce((acc, r) => acc + r.grossSalary, 0).toFixed(2));
      const totalDeductions = parseFloat(records.reduce((acc, r) => acc + r.totalDeduction, 0).toFixed(2));
      const totalNet = parseFloat(records.reduce((acc, r) => acc + r.netSalary, 0).toFixed(2));

      res.status(200).json({
        records,
        totalGross,
        totalDeductions,
        totalNet,
        reportType: type.charAt(0).toUpperCase() + type.slice(1) as any,
        generatedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
      });
      return;
    } catch (err) {
      console.error('Mongo reports query failed. Falling back:', err);
    }
  }

  const allSalaries = db.getSalaries();
  let filtered = allSalaries;

  if (type === 'daily') {
    const todayStr = today.toISOString().split('T')[0];
    filtered = allSalaries.filter(s => s.createdAt && s.createdAt === todayStr);
  } else if (type === 'weekly') {
    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 7);
    filtered = allSalaries.filter(s => {
      if (!s.createdAt) return false;
      const salDate = new Date(s.createdAt);
      return salDate >= weekAgo && salDate <= today;
    });
  } else {
    if (filterMonth && filterMonth !== 'all') {
      filtered = allSalaries.filter(s => s.monthOfPayment === filterMonth);
    } else {
      if (allSalaries.length > 0) {
        const sortedMonths = [...allSalaries].sort((a, b) => b.monthOfPayment.localeCompare(a.monthOfPayment));
        const latestMonth = sortedMonths[0].monthOfPayment;
        filtered = allSalaries.filter(s => s.monthOfPayment === latestMonth);
      }
    }
  }

  // Populate details
  const records = filtered.map(sal => {
    const emp = db.getEmployeeById(sal.employeeId);
    let deptName = 'N/A';
    if (emp) {
      const dept = db.getDepartmentById(emp.departmentId);
      if (dept) deptName = dept.departmentName;
    }

    return {
      employeeNumber: emp ? emp.employeeNumber : 'N/A',
      name: emp ? `${emp.firstName} ${emp.lastName}` : 'Unknown Employee',
      position: emp ? emp.position : 'N/A',
      departmentName: deptName,
      grossSalary: sal.grossSalary,
      totalDeduction: sal.totalDeduction,
      netSalary: sal.netSalary,
      paymentDate: sal.createdAt || 'N/A'
    };
  });

  // Calculate Aggregates
  const totalGross = parseFloat(records.reduce((acc, r) => acc + r.grossSalary, 0).toFixed(2));
  const totalDeductions = parseFloat(records.reduce((acc, r) => acc + r.totalDeduction, 0).toFixed(2));
  const totalNet = parseFloat(records.reduce((acc, r) => acc + r.netSalary, 0).toFixed(2));

  res.status(200).json({
    records,
    totalGross,
    totalDeductions,
    totalNet,
    reportType: type.charAt(0).toUpperCase() + type.slice(1) as any,
    generatedAt: new Date().toLocaleDateString() + ' ' + new Date().toLocaleTimeString()
  });
}

// ==========================================
// DASHBOARD METRICS CONTROLLER
// ==========================================
export async function getDashboardMetrics(req: Request, res: Response): Promise<void> {
  if (isMongoConnected) {
    try {
      const employees = await (MongoEmployee as any).find({});
      const departments = await (MongoDepartment as any).find({});
      const salaries = await (MongoSalary as any).find({});

      const totalEmployees = employees.length;
      const totalDepartments = departments.length;
      const totalPayrollRecords = salaries.length;

      // Summing total payments ever made
      const totalSalaryPaid = parseFloat(salaries.reduce((acc, s) => acc + s.netSalary, 0).toFixed(2));

      // 1. Group Salary Paid by monthOfPayment
      const monthMap: Record<string, number> = {};
      salaries.forEach(s => {
        monthMap[s.monthOfPayment] = (monthMap[s.monthOfPayment] || 0) + s.netSalary;
      });
      const salaryByMonth = Object.entries(monthMap)
        .map(([month, amount]) => ({ month, amount: parseFloat(amount.toFixed(2)) }))
        .sort((a, b) => a.month.localeCompare(b.month));

      // 2. Gender Distribution count
      const genderMap: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
      employees.forEach(e => {
        const g = e.gender || 'Other';
        genderMap[g] = (genderMap[g] || 0) + 1;
      });
      const genderDistribution = Object.entries(genderMap).map(([gender, count]) => ({
        gender,
        count
      }));

      // 3. Department Distribution (Calculated properly)
      const deptMap: Record<string, number> = {};
      departments.forEach(d => {
        deptMap[d.departmentName] = 0;
      });
      employees.forEach(e => {
        const dept = departments.find(d => d._id.toString() === e.departmentId.toString());
        if (dept) {
          deptMap[dept.departmentName] = (deptMap[dept.departmentName] || 0) + 1;
        }
      });
      const departmentDistribution = Object.entries(deptMap).map(([department, count]) => ({
        department,
        count
      }));

      res.status(200).json({
        totalEmployees,
        totalDepartments,
        totalPayrollRecords,
        totalSalaryPaid,
        salaryByMonth,
        genderDistribution,
        departmentDistribution
      });
      return;
    } catch (err) {
      console.error('Mongo dashboard aggregation query failed. Falling back:', err);
    }
  }

  const employees = db.getEmployees();
  const departments = db.getDepartments();
  const salaries = db.getSalaries();

  const totalEmployees = employees.length;
  const totalDepartments = departments.length;
  const totalPayrollRecords = salaries.length;
  
  // Summing total payments ever made
  const totalSalaryPaid = parseFloat(salaries.reduce((acc, s) => acc + s.netSalary, 0).toFixed(2));

  // 1. Group Salary Paid by monthOfPayment
  const monthMap: Record<string, number> = {};
  salaries.forEach(s => {
    monthMap[s.monthOfPayment] = (monthMap[s.monthOfPayment] || 0) + s.netSalary;
  });
  const salaryByMonth = Object.entries(monthMap)
    .map(([month, amount]) => ({ month, amount: parseFloat(amount.toFixed(2)) }))
    .sort((a, b) => a.month.localeCompare(b.month));

  // 2. Gender Distribution count
  const genderMap: Record<string, number> = { Male: 0, Female: 0, Other: 0 };
  employees.forEach(e => {
    const g = e.gender || 'Other';
    genderMap[g] = (genderMap[g] || 0) + 1;
  });
  const genderDistribution = Object.entries(genderMap).map(([gender, count]) => ({
    gender,
    count
  }));

  // 3. Department Distribution (Calculated properly)
  const deptMap: Record<string, number> = {};
  departments.forEach(d => {
    deptMap[d.departmentName] = 0;
  });
  employees.forEach(e => {
    const dept = departments.find(d => d._id === e.departmentId);
    if (dept) {
      deptMap[dept.departmentName] = (deptMap[dept.departmentName] || 0) + 1;
    }
  });
  const departmentDistribution = Object.entries(deptMap).map(([department, count]) => ({
    department,
    count
  }));

  res.status(200).json({
    totalEmployees,
    totalDepartments,
    totalPayrollRecords,
    totalSalaryPaid,
    salaryByMonth,
    genderDistribution,
    departmentDistribution
  });
}
