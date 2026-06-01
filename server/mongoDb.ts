import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

// ==========================================
// MONGOOSE INTERFACES
// ==========================================

export interface IUserDoc extends Document {
  username: string;
  passwordHash: string;
  role: string;
}

export interface IDepartmentDoc extends Document {
  departmentCode: string;
  departmentName: string;
}

export interface IEmployeeDoc extends Document {
  employeeNumber: string;
  firstName: string;
  lastName: string;
  address: string;
  position: string;
  telephone: string;
  gender: 'Male' | 'Female' | 'Other';
  hiredDate: string;
  departmentId: mongoose.Types.ObjectId;
}

export interface ISalaryDoc extends Document {
  employeeId: mongoose.Types.ObjectId;
  grossSalary: number;
  totalDeduction: number;
  netSalary: number;
  monthOfPayment: string;
  createdAt: string;
}

// ==========================================
// SCHEMAS DEFINITION
// ==========================================

const UserSchema = new Schema<IUserDoc>({
  username: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role: { type: String, required: true, default: 'Admin' }
}, { timestamps: true });

const DepartmentSchema = new Schema<IDepartmentDoc>({
  departmentCode: { type: String, required: true, unique: true, uppercase: true, trim: true },
  departmentName: { type: String, required: true, trim: true }
}, { timestamps: true });

const EmployeeSchema = new Schema<IEmployeeDoc>({
  employeeNumber: { type: String, required: true, unique: true, uppercase: true, trim: true },
  firstName: { type: String, required: true, trim: true },
  lastName: { type: String, required: true, trim: true },
  address: { type: String, default: '' },
  position: { type: String, required: true, trim: true },
  telephone: { type: String, default: '' },
  gender: { type: String, required: true, enum: ['Male', 'Female', 'Other'] },
  hiredDate: { type: String, required: true },
  departmentId: { type: Schema.Types.ObjectId, ref: 'Department', required: true }
}, { timestamps: true });

const SalarySchema = new Schema<ISalaryDoc>({
  employeeId: { type: Schema.Types.ObjectId, ref: 'Employee', required: true },
  grossSalary: { type: Number, required: true, min: 0 },
  totalDeduction: { type: Number, required: true, min: 0 },
  netSalary: { type: Number, required: true },
  monthOfPayment: { type: String, required: true },
  createdAt: { type: String, required: true }
}, { timestamps: true });

// Compound index to prevent duplicate employee payments on the same MM-YYYY slot
SalarySchema.index({ employeeId: 1, monthOfPayment: 1 }, { unique: true });

// ==========================================
// MODELS COMPILING
// ==========================================

export const MongoUser = mongoose.models.User || mongoose.model<IUserDoc>('User', UserSchema);
export const MongoDepartment = mongoose.models.Department || mongoose.model<IDepartmentDoc>('Department', DepartmentSchema);
export const MongoEmployee = mongoose.models.Employee || mongoose.model<IEmployeeDoc>('Employee', EmployeeSchema);
export const MongoSalary = mongoose.models.Salary || mongoose.model<ISalaryDoc>('Salary', SalarySchema);

// ==========================================
// DB CONNECTIVITY & SEEDING ENGINE
// ==========================================

export let isMongoConnected = false;

export async function connectMongo(): Promise<boolean> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.log('MONGODB_URI is undefined. Operating on high-performance Local JSON relational fallback.');
    isMongoConnected = false;
    return false;
  }

  try {
    await mongoose.connect(uri);
    isMongoConnected = true;
    console.log('Successfully connected to enterprise MongoDB database schema instance!');
    await seedMongoDatabase();
    return true;
  } catch (err) {
    console.error('Failed to establish MongoDB connection. Reverting to Local database.', err);
    isMongoConnected = false;
    return false;
  }
}

async function seedMongoDatabase() {
  try {
    // Check if seeding is needed
    const userCount = await MongoUser.countDocuments();
    if (userCount > 0) {
      console.log('MongoDB cluster contains existing collections. Seeding bypassed.');
      return;
    }

    console.log('Bootstrapping vacant MongoDB cluster with high-contrast administrative mock data profiles...');

    // 1. Create Default Admin
    const salt = bcrypt.genSaltSync(10);
    const passwordHash = bcrypt.hashSync('Password123', salt);
    await MongoUser.create({
      username: 'admin',
      passwordHash,
      role: 'Admin'
    });

    // 2. Create Departments
    const hr = await MongoDepartment.create({ departmentCode: 'HR01', departmentName: 'Human Resources' });
    const it = await MongoDepartment.create({ departmentCode: 'IT02', departmentName: 'Information Technology' });
    const fn = await MongoDepartment.create({ departmentCode: 'FN03', departmentName: 'Finance' });
    const sl = await MongoDepartment.create({ departmentCode: 'SL04', departmentName: 'Sales & Marketing' });

    // 3. Create Employees
    const emp1 = await MongoEmployee.create({
      employeeNumber: 'EMP001',
      firstName: 'John',
      lastName: 'Doe',
      address: '123 HR Lane, London',
      position: 'HR Manager',
      telephone: '+44 7123 456789',
      gender: 'Male',
      hiredDate: '2024-01-15',
      departmentId: hr._id
    });

    const emp2 = await MongoEmployee.create({
      employeeNumber: 'EMP002',
      firstName: 'Jane',
      lastName: 'Smith',
      address: '456 Tech Blvd, Manchester',
      position: 'Senior Developer',
      telephone: '+44 7234 567890',
      gender: 'Female',
      hiredDate: '2024-03-20',
      departmentId: it._id
    });

    const emp3 = await MongoEmployee.create({
      employeeNumber: 'EMP003',
      firstName: 'Robert',
      lastName: 'Johnson',
      address: '789 Coin Road, Birmingham',
      position: 'Finance Lead',
      telephone: '+44 7345 678901',
      gender: 'Male',
      hiredDate: '2025-05-10',
      departmentId: fn._id
    });

    // 4. Create Historical Salaries
    const today = new Date();
    const isoDate = today.toISOString().split('T')[0];

    const weekAgo = new Date();
    weekAgo.setDate(today.getDate() - 5);
    const weeklyIsoDate = weekAgo.toISOString().split('T')[0];

    await MongoSalary.create({
      employeeId: emp1._id,
      grossSalary: 5000,
      totalDeduction: 600,
      netSalary: 4400,
      monthOfPayment: '05-2026',
      createdAt: isoDate
    });

    await MongoSalary.create({
      employeeId: emp2._id,
      grossSalary: 6500,
      totalDeduction: 900,
      netSalary: 5600,
      monthOfPayment: '05-2026',
      createdAt: isoDate
    });

    await MongoSalary.create({
      employeeId: emp3._id,
      grossSalary: 5500,
      totalDeduction: 750,
      netSalary: 4750,
      monthOfPayment: '05-2026',
      createdAt: weeklyIsoDate
    });

    console.log('MongoDB successfully bootstrapped & completed seeding!');
  } catch (err) {
    console.error('Error occurred during MongoDB initialization seeding:', err);
  }
}
