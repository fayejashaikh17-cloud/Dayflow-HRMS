const express = require('express');
const User = require('../models/User');
const { auth, adminAuth } = require('../middleware/auth');

const router = express.Router();

// Get all employees (Admin/HR only)
router.get('/all', adminAuth, async (req, res) => {
  try {
    const employees = await User.find({ role: 'employee' })
      .select('-password')
      .sort({ createdAt: -1 });
    res.json(employees);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get employee by ID
router.get('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;

    // Employees can only view their own profile, admins can view any
    if (user.role === 'employee' && user._id.toString() !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const employee = await User.findById(id).select('-password');
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    res.json(employee);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Update employee profile
router.put('/:id', auth, async (req, res) => {
  try {
    const { id } = req.params;
    const user = req.user;
    const updateData = req.body;

    // Employees can only update limited fields
    if (user.role === 'employee' && user._id.toString() !== id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    const employee = await User.findById(id);
    if (!employee) {
      return res.status(404).json({ message: 'Employee not found' });
    }

    // If employee, only allow updating personal details
    if (user.role === 'employee') {
      if (updateData.personalDetails) {
        employee.personalDetails = {
          ...employee.personalDetails,
          ...updateData.personalDetails
        };
      }
    } else {
      // Admin can update everything
      if (updateData.personalDetails) {
        employee.personalDetails = {
          ...employee.personalDetails,
          ...updateData.personalDetails
        };
      }
      if (updateData.jobDetails) {
        employee.jobDetails = {
          ...employee.jobDetails,
          ...updateData.jobDetails
        };
      }
      if (updateData.salary) {
        employee.salary = {
          ...employee.salary,
          ...updateData.salary
        };
      }
    }

    await employee.save();
    const updatedEmployee = await User.findById(id).select('-password');
    res.json({ message: 'Profile updated successfully', employee: updatedEmployee });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

