const express = require('express');
const Leave = require('../models/Leave');
const Attendance = require('../models/Attendance');
const { auth, adminAuth } = require('../middleware/auth');
const { sendEmail } = require('../utils/emailService');

const router = express.Router();

// Apply for leave
router.post('/apply', auth, async (req, res) => {
  try {
    const { leaveType, startDate, endDate, remarks } = req.body;

    if (!leaveType || !startDate || !endDate) {
      return res.status(400).json({ message: 'Please provide all required fields' });
    }

    const start = new Date(startDate);
    const end = new Date(endDate);
    const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;

    if (days <= 0) {
      return res.status(400).json({ message: 'End date must be after start date' });
    }

    const leave = new Leave({
      employeeId: req.user._id,
      leaveType,
      startDate: start,
      endDate: end,
      days,
      remarks: remarks || ''
    });

    await leave.save();
    await leave.populate('employeeId', 'employeeId email personalDetails.firstName personalDetails.lastName');

    // Notify admin (non-blocking - don't fail if email fails)
    sendEmail(
      process.env.EMAIL_USER || 'admin@dayflow.com',
      'New Leave Request',
      `Employee ${leave.employeeId.employeeId} has requested ${days} days of ${leaveType} leave.`,
      `<h2>New Leave Request</h2><p>Employee: ${leave.employeeId.employeeId}</p><p>Leave Type: ${leaveType}</p><p>Days: ${days}</p><p>Period: ${startDate} to ${endDate}</p>`
    ).catch(err => {
      console.log('Email sending failed (non-critical):', err.message);
    });

    res.status(201).json({ message: 'Leave request submitted successfully', leave });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Get leave requests
router.get('/requests', auth, async (req, res) => {
  try {
    const query = {};

    // Employees can only see their own requests
    if (req.user.role === 'employee') {
      query.employeeId = req.user._id;
    }

    const leaves = await Leave.find(query)
      .populate('employeeId', 'employeeId personalDetails.firstName personalDetails.lastName')
      .populate('approvedBy', 'employeeId personalDetails.firstName personalDetails.lastName')
      .sort({ createdAt: -1 });

    res.json(leaves);
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// Approve/Reject leave (Admin/HR only)
router.put('/:id/approve', adminAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const { status, adminComments } = req.body;

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status. Must be approved or rejected' });
    }

    const leave = await Leave.findById(id).populate('employeeId');
    if (!leave) {
      return res.status(404).json({ message: 'Leave request not found' });
    }

    leave.status = status;
    leave.approvedBy = req.user._id;
    leave.adminComments = adminComments || '';
    leave.approvedAt = new Date();

    await leave.save();

    // Update attendance records
    if (status === 'approved') {
      const startDate = new Date(leave.startDate);
      const endDate = new Date(leave.endDate);

      for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
        const date = new Date(d);
        date.setHours(0, 0, 0, 0);

        await Attendance.findOneAndUpdate(
          { employeeId: leave.employeeId._id, date },
          {
            employeeId: leave.employeeId._id,
            date,
            status: 'leave',
            remarks: `${leave.leaveType} leave`
          },
          { upsert: true }
        );
      }
    }

    // Notify employee (non-blocking - don't fail if email fails)
    sendEmail(
      leave.employeeId.email,
      `Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}`,
      `Your leave request has been ${status}.`,
      `<h2>Leave Request ${status === 'approved' ? 'Approved' : 'Rejected'}</h2><p>Your leave request for ${leave.days} days has been ${status}.</p>${adminComments ? `<p>Comments: ${adminComments}</p>` : ''}`
    ).catch(err => {
      console.log('Email sending failed (non-critical):', err.message);
    });

    const updatedLeave = await Leave.findById(id)
      .populate('employeeId', 'employeeId personalDetails.firstName personalDetails.lastName')
      .populate('approvedBy', 'employeeId personalDetails.firstName personalDetails.lastName');

    res.json({ message: `Leave request ${status} successfully`, leave: updatedLeave });
  } catch (error) {
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;

