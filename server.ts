import express from 'express';
import path from 'path';
import { createServer as createViteServer } from 'vite';
import { authenticateToken, errorHandler } from './server/middleware';
import { connectMongo } from './server/mongoDb';
import {
  login,
  getCurrentUser,
  getDepartments,
  getDepartmentById,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  getEmployees,
  getEmployeeById,
  createEmployee,
  updateEmployee,
  deleteEmployee,
  getSalaries,
  getSalaryById,
  createSalary,
  updateSalary,
  deleteSalary,
  getPayrollReports,
  getDashboardMetrics
} from './server/controllers';

async function startServer() {
  // Initialize Database Connectors (MongoDB or Local Fallback)
  await connectMongo();

  const app = express();
  const PORT = 3000;

  // Global Middlewares
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));

  // Debug logger helper
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    next();
  });

  // ==========================================
  // REST API ENDPOINTS
  // ==========================================

  // Public Endpoints
  app.post('/api/auth/login', login);

  // Protected Endpoints (authenticateToken required)
  app.get('/api/auth/me', authenticateToken as any, getCurrentUser as any);

  // Departments CRUD
  app.get('/api/departments', authenticateToken as any, getDepartments);
  app.get('/api/departments/:id', authenticateToken as any, getDepartmentById);
  app.post('/api/departments', authenticateToken as any, createDepartment);
  app.put('/api/departments/:id', authenticateToken as any, updateDepartment);
  app.delete('/api/departments/:id', authenticateToken as any, deleteDepartment);

  // Employees CRUD
  app.get('/api/employees', authenticateToken as any, getEmployees);
  app.get('/api/employees/:id', authenticateToken as any, getEmployeeById);
  app.post('/api/employees', authenticateToken as any, createEmployee);
  app.put('/api/employees/:id', authenticateToken as any, updateEmployee);
  app.delete('/api/employees/:id', authenticateToken as any, deleteEmployee);

  // Salaries CRUD
  app.get('/api/salaries', authenticateToken as any, getSalaries);
  app.get('/api/salaries/:id', authenticateToken as any, getSalaryById);
  app.post('/api/salaries', authenticateToken as any, createSalary);
  app.put('/api/salaries/:id', authenticateToken as any, updateSalary);
  app.delete('/api/salaries/:id', authenticateToken as any, deleteSalary);

  // Dashboard & Analytical Data
  app.get('/api/dashboard/metrics', authenticateToken as any, getDashboardMetrics);

  // Payroll Reports Generator
  app.get('/api/reports/payroll', authenticateToken as any, getPayrollReports);

  // ==========================================
  // VITE & FRONTEND INTEGRATION
  // ==========================================
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
    console.log('Vite middleware loaded in DEVELOPMENT mode.');
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
    console.log('Serving compiled static frontend from /dist in PRODUCTION mode.');
  }

  // Error Controller Middleware
  app.use(errorHandler);

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EPMS PayMaster Server booting at http://localhost:${PORT}`);
  });
}

startServer();
