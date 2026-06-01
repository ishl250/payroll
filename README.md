# Employee Payroll Management System (EPMS) - PayMaster Ltd

A complete, production-ready full-stack Human Resources and Payroll Administrative portal designed with a clean, high-contrast corporate aesthetic.

---

## 📂 Project Folder Structure

```text
/
├── .env.example              # Template for environment variables (JWT Secrets, URLs)
├── index.html                # Entry point SPA html template
├── metadata.json             # AI Studio configuration file
├── package.json              # Direct npm package manifest containing dev & dependency bundles
├── tsconfig.json             # Core strict TypeScript compiler rules configuration
├── vite.config.ts            # Configuration for Vite Bundler & Tailwinds
├── server.ts                 # Full-stack Node & Express gateway serving APIs & SPA
├── data/
│   └── db.json               # Auto-generated JSON Database with bcrypt-encrypted demo profiles
├── server/
│   ├── db.ts                 # SQLite/Lowdb alternative synchronous transactional DBMS
│   ├── middleware.ts         # JSON Web Token (JWT) Gatekeepers & API Error managers
│   └── controllers.ts        # MVC business logic controller handlers (CRUD & Reporting)
└── src/
    ├── main.tsx              # React mounting root file
    ├── index.css             # Tailwind style imports & typography setup
    ├── api.ts                # Axios instance configuration with automatic JWT auth headers
    ├── types.ts              # Globally active TypeScript system contracts
    ├── App.tsx               # Main SPA router module with route guards
    ├── components/
    │   ├── Layout.tsx        # Responsive administrative sidebars
    │   └── Notification.tsx # Real-time custom toast messaging context provider
    └── pages/
        ├── Login.tsx         # Secure sign-in viewport page
        ├── Dashboard.tsx     # Analytical graphics overview page
        ├── EmployeePage.tsx  # Interactive staff profiles registry directory
        ├── DepartmentPage.tsx # Administrative department list panel
        ├── SalaryPage.tsx    # Staff salary ledger & calculation tools
        └── ReportsPage.tsx   # Formal audit daily/weekly/monthly PDF/print template
```

---

## 📊 Database Schemas & ERD

To make the application instantly bootable in any environment, the system utilizes a high-performance, single-file ACID-compliant JSON relational storage engine (`server/db.ts`). Below is the **Entity-Relationship Diagram (ERD)** explanation and the standard **MongoDB / Mongoose equivalent schemas** when deploying to MongoDB.

### 🛡️ Entity Relationship Design (ERD)

```text
┌─────────────────┐             ┌─────────────────┐             ┌─────────────────┐
│   Department    │             │    Employee     │             │     Salary      │
├─────────────────┤             ├─────────────────┤             ├─────────────────┤
│ _id             │ 1         * │ _id             │ 1         * │ _id             │
│ departmentCode  ├────────────►│ departmentId    ├────────────►│ employeeId      │
│ departmentName  │             │ employeeNumber  │             │ grossSalary     │
└─────────────────┘             │ firstName       │             │ totalDeduction  │
                                │ lastName        │             │ netSalary       │
                                │ position        │             │ monthOfPayment  │
                                │ telephone       │             │ createdAt(Date) │
                                │ gender          │             └─────────────────┘
                                │ hiredDate       │
                                └─────────────────┘
```

1. **Department → Many Employees**: A department organizes many staff profiles. Deleting a department is restricted if employees belong to it to safeguard relational safety.
2. **Employee → Many Salary Records**: An employee holds month-on-month payroll records. Deleting an employee profile cascades to clean and archive their historic salary records.

---

### 🟢 Equivalent MongoDB / Mongoose Schemas

#### 1. Department Schema (`models/Department.js`)
```javascript
const mongoose = require('mongoose');

const DepartmentSchema = new mongoose.Schema({
  departmentCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true,
    match: [/^[A-Z0-9]{2,10}$/, 'Code must be 2-10 alphanumeric characters.']
  },
  departmentName: {
    type: String,
    required: true,
    trim: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Department', DepartmentSchema);
```

#### 2. Employee Schema (`models/Employee.js`)
```javascript
const mongoose = require('mongoose');

const EmployeeSchema = new mongoose.Schema({
  employeeNumber: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    uppercase: true
  },
  firstName: {
    type: String,
    required: true,
    trim: true
  },
  lastName: {
    type: String,
    required: true,
    trim: true
  },
  address: {
    type: String,
    default: ''
  },
  position: {
    type: String,
    required: true,
    trim: true
  },
  telephone: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    required: true,
    enum: ['Male', 'Female', 'Other']
  },
  hiredDate: {
    type: String, // ISO String Format: YYYY-MM-DD
    required: true
  },
  departmentId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Department',
    required: true
  }
}, { timestamps: true });

module.exports = mongoose.model('Employee', EmployeeSchema);
```

#### 3. Salary Schema (`models/Salary.js`)
```javascript
const mongoose = require('mongoose');

const SalarySchema = new mongoose.Schema({
  employeeId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Employee',
    required: true
  },
  grossSalary: {
    type: Number,
    required: true,
    min: [0, 'Salary must be a positive number']
  },
  totalDeduction: {
    type: Number,
    required: true,
    min: [0, 'Deductions must be positive or zero']
  },
  netSalary: {
    type: Number,
    required: true
  },
  monthOfPayment: {
    type: String, // MM-YYYY format
    required: true
  },
  createdAt: {
    type: String, // YYYY-MM-DD format for audit-day grouping
    default: () => new Date().toISOString().split('T')[0]
  }
}, { timestamps: true });

// Compound index to guarantee an employee receives only ONE paycheck per month slot
SalarySchema.index({ employeeId: 1, monthOfPayment: 1 }, { unique: true });

module.exports = mongoose.model('Salary', SalarySchema);
```

---

## 🔒 Security & Authentication (JWT Flow)

EPMS uses stateless JSON Web Token (JWT) protocols for security:

1. **Credentials verification**: User inputs username and password. Password hashes are validated using `bcryptjs`.
2. **Access token generation**: A signed JWT is emitted with credentials (8h expiration window), packed using a private secret (`JWT_SECRET`).
3. **Bearer Authorization**: Clients store keys securely inside `localStorage` and intercept outgoing HTTP calls via Axios to set `Authorization: Bearer <TOKEN>`.
4. **Middleware gatekeepers**: Request routes are guarded on the Express server. Expired or forged keys generate clean `401 HTTP` blocks, driving client-side session logouts automatically.

---

## 📡 REST API Specifications

All endpoints are prefixed with `/api` and require a valid Bearer token headers in their parameters (except Login routing).

| Method | Endpoint | Description | Request Body / Parameters |
| :--- | :--- | :--- | :--- |
| **POST** | `/api/auth/login` | Log in administrative manager | `{ username, password }` |
| **GET** | `/api/auth/me` | Fetch active logged profile | *None (Extracts token payload)* |
| **GET** | `/api/departments` | Obtain department directory | `?search=HR` |
| **POST** | `/api/departments` | Create new operational segment | `{ departmentCode, departmentName }` |
| **PUT** | `/api/departments/:id`| Modify department profile | `{ departmentCode, departmentName }` |
| **DELETE**| `/api/departments/:id`| Delete empty department | *None* |
| **GET** | `/api/employees` | Paginated directory of employees | `?search=John&departmentId=dept_hr&page=1` |
| **POST** | `/api/employees` | Log a new employee profile | `{ employeeNumber, firstName, lastName, ... }` |
| **PUT** | `/api/employees/:id` | Modify existing profile field | `{ firstName, position, departmentId, ... }` |
| **DELETE**| `/api/employees/:id` | Archive profile & remove payroll records | *None* |
| **GET** | `/api/salaries` | Searchable paginated paid slips ledger | `?search=Jack&monthOfPayment=05-2026&page=1` |
| **POST** | `/api/salaries` | Calculate & record payroll payouts | `{ employeeId, grossSalary, totalDeduction }` |
| **DELETE**| `/api/salaries/:id` | Void a logged pay slip statement | *None* |
| **GET** | `/api/dashboard/metrics`| Retrieve aggregate bento analytical data| *None* |
| **GET** | `/api/reports/payroll` | Fetch formatted daily/weekly/monthly audits| `?type=monthly&monthOfPayment=05-2026` |

---

## 🛠️ Step-by-Step Installation Instructions

### Prerequisite

- Node.js (v18.0 or younger)
- NPM packager

### Launch Instructions

1. **Verify dependencies and compile codebase build files**:
   ```bash
   npm run build
   ```
2. **Boot the Node server in production mode**:
   ```bash
   npm run start
   ```
   *(Alternatively, run `npm run dev` in sandbox spaces to boot the low-latency hot development servers).*
3. **Inspect the live container URL**:
   Load up the application interface from the developer sandboxing frame block!

### Built-in Administrative Access

- **Demo URL User**: `admin`
- **Demo URL Password**: `Password123`
