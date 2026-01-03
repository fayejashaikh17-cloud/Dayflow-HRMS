const express = require('express');
const Payroll = require('../models/Payroll');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Get payroll records
router.get('/records', auth, async (req, res) => {
  try {
    const { employeeId, month, year } = req.query;
    const query = {};

    // Employees can only view their own payroll
    if (req.user.role === 'employee') {
      query.employeeId = req.user._id;
    } else if (employeeId) {
      query.employeeId = employeeId;
    }

    if (month) query.month = parseInt(month);
    if (year) query.year = parseInt(year);

    const records = await Payroll.find(query)
      .populate('employeeId', 'employeeId personalDetails.firstName personalDetails.lastName email')
      .sort({ year: -1, month: -1 });

    res.json(records);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Generate payroll (Admin/HR only)
router.post('/generate', adminAuth, async (req, res) => {
  try {
    const { employeeId, month, year } = req.body;

    if (!employeeId || !month || !year) {
      return res.status(400).json({ message: 'Please provide employeeId, month, and year' });
    }

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // Check if payroll already exists
    const existing = await Payroll.findOne({ employeeId, month, year });
    if (existing) {
      return res.status(400).json({ message: 'Payroll for this month already exists' });
    }

    const baseSalary = employee.salary.baseSalary || 0;
    const allowances = employee.salary.allowances || 0;
    const deductions = employee.salary.deductions || 0;
    const tax = Math.round((baseSalary + allowances) * 0.1); // 10% tax (simplified)
    const netSalary = baseSalary + allowances - deductions - tax;

    const payroll = new Payroll({
      employeeId,
      month,
      year,
      baseSalary,
      allowances,
      deductions,
      tax,
      netSalary,
      status: 'processed'
    });

    await payroll.save();
    await payroll.populate('employeeId', 'employeeId email personalDetails.firstName personalDetails.lastName');

    // Send salary slip email (non-blocking - don't fail if email fails)
    sendEmail(
      employee.email,
      `Salary Slip - ${month}/${year}`,
      `Your salary slip for ${month}/${year} is ready.`,
      `<h2>Salary Slip - ${month}/${year}</h2>
       <p>Employee: ${employee.employeeId}</p>
       <p>Base Salary: ${baseSalary}</p>
       <p>Allowances: ${allowances}</p>
       <p>Deductions: ${deductions}</p>
       <p>Tax: ${tax}</p>
       <p><strong>Net Salary: ${netSalary}</strong></p>`
    ).catch(err => {
      console.log('Email sending failed (non-critical):', err.message);
    });

    res.status(201).json({ message: 'Payroll generated successfully', payroll });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update salary structure (Admin/HR only)
router.put('/salary/:employeeId', adminAuth, async (req, res) => {
  try {
    const { employeeId } = req.params;
    const { baseSalary, allowances, deductions, currency } = req.body;

    const employee = await User.findById(employeeId);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    if (baseSalary !== undefined) employee.salary.baseSalary = baseSalary;
    if (allowances !== undefined) employee.salary.allowances = allowances;
    if (deductions !== undefined) employee.salary.deductions = deductions;
    if (currency) employee.salary.currency = currency;

    await employee.save();

    res.json({ message: 'Salary structure updated successfully', employee });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get analytics/reports
router.get('/analytics', adminAuth, async (req, res) => {
  try {
    const { year } = req.query;
    const currentYear = year ? parseInt(year) : new Date().getFullYear();

    const payrolls = await Payroll.find({ year: currentYear })
      .populate('employeeId', 'employeeId personalDetails.firstName personalDetails.lastName');

    const totalPayroll = payrolls.reduce((sum, p) => sum + p.netSalary, 0);
    const avgSalary = payrolls.length > 0 ? totalPayroll / payrolls.length : 0;
    const monthlyBreakdown = {};

    payrolls.forEach(p => {
      if (!monthlyBreakdown[p.month]) {
        monthlyBreakdown[p.month] = 0;
      }
      monthlyBreakdown[p.month] += p.netSalary;
    });

    res.json({
      year: currentYear,
      totalPayroll,
      avgSalary: Math.round(avgSalary),
      employeeCount: payrolls.length,
      monthlyBreakdown
    });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

