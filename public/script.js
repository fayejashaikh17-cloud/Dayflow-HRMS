// API Base URL
const API_BASE = '/api';

// Current user data
let currentUser = null;
let authToken = null;

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
    authToken = localStorage.getItem('authToken');
    currentUser = JSON.parse(localStorage.getItem('currentUser') || 'null');
    
    // Setup form handlers
    setupFormHandlers();
});

// Setup form handlers
function setupFormHandlers() {
    const signinForm = document.getElementById('signin-form');
    const signupForm = document.getElementById('signup-form');
    const personalForm = document.getElementById('personal-form');
    const leaveForm = document.getElementById('leave-form');
    const generatePayrollForm = document.getElementById('generate-payroll-form');

    if (signinForm) {
        signinForm.addEventListener('submit', handleSignIn);
    }

    if (signupForm) {
        signupForm.addEventListener('submit', handleSignUp);
    }

    if (personalForm) {
        personalForm.addEventListener('submit', handleUpdateProfile);
    }

    if (leaveForm) {
        leaveForm.addEventListener('submit', handleLeaveRequest);
    }

    if (generatePayrollForm) {
        generatePayrollForm.addEventListener('submit', handleGeneratePayroll);
    }
}

// API Helper Functions
async function apiCall(endpoint, method = 'GET', body = null) {
    const headers = {
        'Content-Type': 'application/json'
    };

    if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
    }

    const options = {
        method,
        headers
    };

    if (body) {
        options.body = JSON.stringify(body);
    }

    try {
        const response = await fetch(`${API_BASE}${endpoint}`, options);
        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.message || 'Request failed');
        }

        return data;
    } catch (error) {
        console.error('API Error:', error);
        throw error;
    }
}

// Authentication Functions
async function handleSignIn(e) {
    e.preventDefault();
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;

    try {
        const data = await apiCall('/auth/signin', 'POST', { email, password });
        authToken = data.token;
        currentUser = data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Redirect based on role
        if (currentUser.role === 'admin' || currentUser.role === 'hr') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'employee-dashboard.html';
        }
    } catch (error) {
        showError(error.message);
    }
}

async function handleSignUp(e) {
    e.preventDefault();
    const employeeId = document.getElementById('employeeId').value;
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const role = document.getElementById('role').value;

    try {
        const data = await apiCall('/auth/signup', 'POST', { employeeId, email, password, role });
        authToken = data.token;
        currentUser = data.user;
        
        localStorage.setItem('authToken', authToken);
        localStorage.setItem('currentUser', JSON.stringify(currentUser));

        // Redirect based on role
        if (currentUser.role === 'admin' || currentUser.role === 'hr') {
            window.location.href = 'admin-dashboard.html';
        } else {
            window.location.href = 'employee-dashboard.html';
        }
    } catch (error) {
        showError(error.message);
    }
}

function logout() {
    localStorage.removeItem('authToken');
    localStorage.removeItem('currentUser');
    authToken = null;
    currentUser = null;
    window.location.href = 'index.html';
}

function checkAuth() {
    if (!authToken || !currentUser) {
        window.location.href = 'index.html';
        return false;
    }

    // Update user name in nav
    const userNameEl = document.getElementById('user-name');
    if (userNameEl) {
        userNameEl.textContent = currentUser.name || currentUser.employeeId;
    }

    // Set dashboard link
    const dashboardLink = document.getElementById('dashboard-link');
    if (dashboardLink) {
        if (currentUser.role === 'admin' || currentUser.role === 'hr') {
            dashboardLink.href = 'admin-dashboard.html';
        } else {
            dashboardLink.href = 'employee-dashboard.html';
        }
    }

    return true;
}

// Navigation
function navigateTo(page) {
    window.location.href = page;
}

// Error/Success Messages
function showError(message) {
    const errorEl = document.getElementById('error-message');
    if (errorEl) {
        errorEl.textContent = message;
        errorEl.style.display = 'block';
        setTimeout(() => {
            errorEl.style.display = 'none';
        }, 5000);
    } else {
        alert(message);
    }
}

function showSuccess(message) {
    const successEl = document.getElementById('success-message');
    if (successEl) {
        successEl.textContent = message;
        successEl.style.display = 'block';
        setTimeout(() => {
            successEl.style.display = 'none';
        }, 5000);
    }
}

// Employee Dashboard
async function loadEmployeeDashboard() {
    try {
        const attendance = await apiCall('/attendance/today');
        const leaves = await apiCall('/leave/requests');
        const recentLeaves = leaves.slice(0, 5);

        const activityList = document.getElementById('activity-list');
        if (activityList) {
            if (recentLeaves.length === 0) {
                activityList.innerHTML = '<p>No recent activity</p>';
            } else {
                activityList.innerHTML = recentLeaves.map(leave => `
                    <div class="activity-item">
                        <strong>Leave Request:</strong> ${leave.leaveType} - ${leave.days} days
                        <span class="status-badge status-${leave.status}">${leave.status}</span>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Error loading dashboard:', error);
    }
}

// Admin Dashboard
async function loadAdminDashboard() {
    try {
        const employees = await apiCall('/employee/all');
        const leaves = await apiCall('/leave/requests');
        const pendingLeaves = leaves.filter(l => l.status === 'pending');
        const attendance = await apiCall('/attendance/all?startDate=' + new Date().toISOString().split('T')[0]);

        document.getElementById('total-employees').textContent = employees.length;
        document.getElementById('pending-leaves').textContent = pendingLeaves.length;
        document.getElementById('today-attendance').textContent = attendance.length;
    } catch (error) {
        console.error('Error loading admin dashboard:', error);
    }
}

// Profile Management
async function loadProfile() {
    try {
        const user = await apiCall('/auth/me');
        const profile = await apiCall(`/employee/${user._id}`);

        // Personal Details
        document.getElementById('employee-name').textContent = 
            `${profile.personalDetails.firstName} ${profile.personalDetails.lastName}`.trim() || profile.employeeId;
        document.getElementById('employee-id').textContent = `Employee ID: ${profile.employeeId}`;
        document.getElementById('email').value = profile.email;
        document.getElementById('firstName').value = profile.personalDetails.firstName || '';
        document.getElementById('lastName').value = profile.personalDetails.lastName || '';
        document.getElementById('phone').value = profile.personalDetails.phone || '';
        document.getElementById('address').value = profile.personalDetails.address || '';
        if (profile.personalDetails.dateOfBirth) {
            document.getElementById('dateOfBirth').value = new Date(profile.personalDetails.dateOfBirth).toISOString().split('T')[0];
        }
        if (profile.personalDetails.profilePicture) {
            document.getElementById('profile-img').src = profile.personalDetails.profilePicture;
        }

        // Job Details
        document.getElementById('department').textContent = profile.jobDetails.department || '-';
        document.getElementById('position').textContent = profile.jobDetails.position || '-';
        if (profile.jobDetails.joiningDate) {
            document.getElementById('joiningDate').textContent = new Date(profile.jobDetails.joiningDate).toLocaleDateString();
        } else {
            document.getElementById('joiningDate').textContent = '-';
        }
        document.getElementById('employmentType').textContent = profile.jobDetails.employmentType || '-';

        // Salary
        document.getElementById('baseSalary').textContent = 
            `${profile.salary.currency || 'USD'} ${profile.salary.baseSalary || 0}`;
        document.getElementById('allowances').textContent = 
            `${profile.salary.currency || 'USD'} ${profile.salary.allowances || 0}`;
        document.getElementById('deductions').textContent = 
            `${profile.salary.currency || 'USD'} ${profile.salary.deductions || 0}`;
        document.getElementById('currency').textContent = profile.salary.currency || 'USD';
    } catch (error) {
        showError('Error loading profile: ' + error.message);
    }
}

async function handleUpdateProfile(e) {
    e.preventDefault();
    try {
        const user = await apiCall('/auth/me');
        const updateData = {
            personalDetails: {
                firstName: document.getElementById('firstName').value,
                lastName: document.getElementById('lastName').value,
                phone: document.getElementById('phone').value,
                address: document.getElementById('address').value,
                dateOfBirth: document.getElementById('dateOfBirth').value
            }
        };

        await apiCall(`/employee/${user._id}`, 'PUT', updateData);
        showSuccess('Profile updated successfully');
        loadProfile();
    } catch (error) {
        showError('Error updating profile: ' + error.message);
    }
}

function showTab(tabName) {
    // Hide all tabs
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    // Show selected tab
    document.getElementById(`${tabName}-tab`).classList.add('active');
    event.target.classList.add('active');
}

// Attendance Management
async function checkIn() {
    try {
        const data = await apiCall('/attendance/checkin', 'POST');
        showSuccess('Checked in successfully');
        loadTodayStatus();
        document.getElementById('checkin-btn').style.display = 'none';
        document.getElementById('checkout-btn').style.display = 'inline-block';
    } catch (error) {
        showError(error.message);
    }
}

async function checkOut() {
    try {
        const data = await apiCall('/attendance/checkout', 'POST');
        showSuccess('Checked out successfully');
        loadTodayStatus();
        document.getElementById('checkin-btn').style.display = 'inline-block';
        document.getElementById('checkout-btn').style.display = 'none';
    } catch (error) {
        showError(error.message);
    }
}

async function loadTodayStatus() {
    try {
        const attendance = await apiCall('/attendance/today');
        const todayInfo = document.getElementById('today-info');
        
        if (attendance.message) {
            todayInfo.innerHTML = '<p>No attendance record for today</p>';
            document.getElementById('checkin-btn').style.display = 'inline-block';
            document.getElementById('checkout-btn').style.display = 'none';
        } else {
            const checkInTime = attendance.checkIn ? new Date(attendance.checkIn).toLocaleTimeString() : 'Not checked in';
            const checkOutTime = attendance.checkOut ? new Date(attendance.checkOut).toLocaleTimeString() : 'Not checked out';
            const hours = attendance.workingHours || 0;

            todayInfo.innerHTML = `
                <div class="today-info-item">
                    <label>Check In</label>
                    <span>${checkInTime}</span>
                </div>
                <div class="today-info-item">
                    <label>Check Out</label>
                    <span>${checkOutTime}</span>
                </div>
                <div class="today-info-item">
                    <label>Working Hours</label>
                    <span>${hours} hrs</span>
                </div>
                <div class="today-info-item">
                    <label>Status</label>
                    <span class="status-badge status-${attendance.status}">${attendance.status}</span>
                </div>
            `;

            if (attendance.checkIn && !attendance.checkOut) {
                document.getElementById('checkin-btn').style.display = 'none';
                document.getElementById('checkout-btn').style.display = 'inline-block';
            } else {
                document.getElementById('checkin-btn').style.display = 'inline-block';
                document.getElementById('checkout-btn').style.display = 'none';
            }
        }
    } catch (error) {
        console.error('Error loading today status:', error);
    }
}

async function loadAttendance() {
    try {
        const period = document.getElementById('period-select')?.value || 'week';
        const records = await apiCall(`/attendance/records?period=${period}`);

        const tbody = document.getElementById('attendance-tbody');
        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="5">No attendance records found</td></tr>';
        } else {
            tbody.innerHTML = records.map(record => {
                const date = new Date(record.date).toLocaleDateString();
                const checkIn = record.checkIn ? new Date(record.checkIn).toLocaleTimeString() : '-';
                const checkOut = record.checkOut ? new Date(record.checkOut).toLocaleTimeString() : '-';
                const hours = record.workingHours || 0;
                const employeeName = record.employeeId?.personalDetails?.firstName 
                    ? `${record.employeeId.personalDetails.firstName} ${record.employeeId.personalDetails.lastName}`
                    : record.employeeId?.employeeId || '-';

                return `
                    <tr>
                        <td>${date}</td>
                        <td>${checkIn}</td>
                        <td>${checkOut}</td>
                        <td>${hours} hrs</td>
                        <td><span class="status-badge status-${record.status}">${record.status}</span></td>
                    </tr>
                `;
            }).join('');
        }
    } catch (error) {
        showError('Error loading attendance: ' + error.message);
    }
}

// Leave Management
function calculateDays() {
    const startDate = document.getElementById('startDate').value;
    const endDate = document.getElementById('endDate').value;
    
    if (startDate && endDate) {
        const start = new Date(startDate);
        const end = new Date(endDate);
        const days = Math.ceil((end - start) / (1000 * 60 * 60 * 24)) + 1;
        document.getElementById('days').value = days > 0 ? days : 0;
    }
}

async function handleLeaveRequest(e) {
    e.preventDefault();
    try {
        const leaveType = document.getElementById('leaveType').value;
        const startDate = document.getElementById('startDate').value;
        const endDate = document.getElementById('endDate').value;
        const remarks = document.getElementById('remarks').value;

        await apiCall('/leave/apply', 'POST', { leaveType, startDate, endDate, remarks });
        showSuccess('Leave request submitted successfully');
        document.getElementById('leave-form').reset();
        loadLeaveRequests();
    } catch (error) {
        showError(error.message);
    }
}

async function loadLeaveRequests() {
    try {
        const leaves = await apiCall('/leave/requests');
        const leaveList = document.getElementById('leave-list');
        const isAdmin = currentUser && (currentUser.role === 'admin' || currentUser.role === 'hr');

        if (leaves.length === 0) {
            leaveList.innerHTML = '<p>No leave requests found</p>';
        } else {
            leaveList.innerHTML = leaves.map(leave => {
                const employeeName = leave.employeeId?.personalDetails?.firstName 
                    ? `${leave.employeeId.personalDetails.firstName} ${leave.employeeId.personalDetails.lastName}`
                    : leave.employeeId?.employeeId || '-';
                const startDate = new Date(leave.startDate).toLocaleDateString();
                const endDate = new Date(leave.endDate).toLocaleDateString();

                let actions = '';
                if (isAdmin && leave.status === 'pending') {
                    actions = `
                        <div class="leave-item-actions">
                            <button class="btn btn-success btn-small" onclick="approveLeave('${leave._id}')">Approve</button>
                            <button class="btn btn-danger btn-small" onclick="rejectLeave('${leave._id}')">Reject</button>
                        </div>
                    `;
                }

                return `
                    <div class="leave-item">
                        <div class="leave-item-info">
                            <h4>${isAdmin ? employeeName : leave.leaveType}</h4>
                            <p><strong>Type:</strong> ${leave.leaveType}</p>
                            <p><strong>Period:</strong> ${startDate} to ${endDate}</p>
                            <p><strong>Days:</strong> ${leave.days}</p>
                            ${leave.remarks ? `<p><strong>Remarks:</strong> ${leave.remarks}</p>` : ''}
                            ${leave.adminComments ? `<p><strong>Admin Comments:</strong> ${leave.adminComments}</p>` : ''}
                            <p><span class="status-badge status-${leave.status}">${leave.status}</span></p>
                        </div>
                        ${actions}
                    </div>
                `;
            }).join('');
        }
    } catch (error) {
        showError('Error loading leave requests: ' + error.message);
    }
}

async function approveLeave(leaveId) {
    try {
        const comments = prompt('Add comments (optional):');
        await apiCall(`/leave/${leaveId}/approve`, 'PUT', { status: 'approved', adminComments: comments || '' });
        showSuccess('Leave request approved');
        loadLeaveRequests();
    } catch (error) {
        showError(error.message);
    }
}

async function rejectLeave(leaveId) {
    try {
        const comments = prompt('Add rejection reason (optional):');
        await apiCall(`/leave/${leaveId}/approve`, 'PUT', { status: 'rejected', adminComments: comments || '' });
        showSuccess('Leave request rejected');
        loadLeaveRequests();
    } catch (error) {
        showError(error.message);
    }
}

// Payroll Management
async function loadPayroll() {
    try {
        const month = document.getElementById('filter-month')?.value || '';
        const year = document.getElementById('filter-year')?.value || new Date().getFullYear();
        
        let endpoint = `/payroll/records?year=${year}`;
        if (month) {
            endpoint += `&month=${month}`;
        }

        const records = await apiCall(endpoint);
        const tbody = document.getElementById('payroll-tbody');

        if (records.length === 0) {
            tbody.innerHTML = '<tr><td colspan="8">No payroll records found</td></tr>';
        } else {
            tbody.innerHTML = records.map(record => {
                const employeeName = record.employeeId?.personalDetails?.firstName 
                    ? `${record.employeeId.personalDetails.firstName} ${record.employeeId.personalDetails.lastName}`
                    : record.employeeId?.employeeId || '-';
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const monthName = monthNames[record.month - 1];

                return `
                    <tr>
                        <td>${monthName} ${record.year}</td>
                        <td>${employeeName}</td>
                        <td>$${record.baseSalary}</td>
                        <td>$${record.allowances}</td>
                        <td>$${record.deductions}</td>
                        <td>$${record.tax}</td>
                        <td><strong>$${record.netSalary}</strong></td>
                        <td><span class="status-badge status-${record.status}">${record.status}</span></td>
                    </tr>
                `;
            }).join('');
        }
    } catch (error) {
        showError('Error loading payroll: ' + error.message);
    }
}

async function loadEmployeesForPayroll() {
    try {
        const employees = await apiCall('/employee/all');
        const select = document.getElementById('employee-select');
        select.innerHTML = '<option value="">Select Employee</option>' + 
            employees.map(emp => {
                const name = emp.personalDetails?.firstName 
                    ? `${emp.personalDetails.firstName} ${emp.personalDetails.lastName}`
                    : emp.employeeId;
                return `<option value="${emp._id}">${name} (${emp.employeeId})</option>`;
            }).join('');
    } catch (error) {
        console.error('Error loading employees:', error);
    }
}

async function handleGeneratePayroll(e) {
    e.preventDefault();
    try {
        const employeeId = document.getElementById('employee-select').value;
        const month = document.getElementById('month-select').value;
        const year = document.getElementById('year-input').value;

        await apiCall('/payroll/generate', 'POST', { employeeId, month, year });
        showSuccess('Payroll generated successfully');
        document.getElementById('generate-payroll-form').reset();
        loadPayroll();
    } catch (error) {
        showError(error.message);
    }
}

// Employee Management (Admin)
async function loadAllEmployees() {
    try {
        const employees = await apiCall('/employee/all');
        const tbody = document.getElementById('employees-tbody');

        if (employees.length === 0) {
            tbody.innerHTML = '<tr><td colspan="6">No employees found</td></tr>';
        } else {
            tbody.innerHTML = employees.map(emp => {
                const name = emp.personalDetails?.firstName 
                    ? `${emp.personalDetails.firstName} ${emp.personalDetails.lastName}`
                    : '-';
                return `
                    <tr>
                        <td>${emp.employeeId}</td>
                        <td>${name}</td>
                        <td>${emp.email}</td>
                        <td>${emp.jobDetails.department || '-'}</td>
                        <td>${emp.jobDetails.position || '-'}</td>
                        <td>
                            <button class="btn btn-primary btn-small" onclick="viewEmployee('${emp._id}')">View</button>
                        </td>
                    </tr>
                `;
            }).join('');
        }
    } catch (error) {
        showError('Error loading employees: ' + error.message);
    }
}

function viewEmployee(employeeId) {
    window.location.href = `profile.html?employeeId=${employeeId}`;
}

// Reports
async function loadReports() {
    try {
        const year = document.getElementById('report-year')?.value || new Date().getFullYear();
        const analytics = await apiCall(`/payroll/analytics?year=${year}`);

        document.getElementById('total-payroll').textContent = `$${analytics.totalPayroll.toLocaleString()}`;
        document.getElementById('avg-salary').textContent = `$${analytics.avgSalary.toLocaleString()}`;
        document.getElementById('employee-count').textContent = analytics.employeeCount;

        // Monthly breakdown chart
        const chart = document.getElementById('monthly-chart');
        const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                          'July', 'August', 'September', 'October', 'November', 'December'];
        const maxValue = Math.max(...Object.values(analytics.monthlyBreakdown), 1);

        chart.innerHTML = Object.entries(analytics.monthlyBreakdown)
            .sort((a, b) => parseInt(a[0]) - parseInt(b[0]))
            .map(([month, value]) => {
                const percentage = (value / maxValue) * 100;
                return `
                    <div class="chart-bar">
                        <div class="chart-bar-label">${monthNames[parseInt(month) - 1]}</div>
                        <div class="chart-bar-container">
                            <div class="chart-bar-fill" style="width: ${percentage}%">
                                $${value.toLocaleString()}
                            </div>
                        </div>
                    </div>
                `;
            }).join('') || '<p>No data available</p>';
    } catch (error) {
        showError('Error loading reports: ' + error.message);
    }
}

