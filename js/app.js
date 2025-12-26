document.addEventListener('DOMContentLoaded', () => {
    // Mock Data
    const users = [
        { email: 'admin@nexusiot.com', password: 'adminpassword', role: 'admin' },
        { email: 'customer@nexusiot.com', password: 'customerpassword', role: 'customer' }
    ];

    let devices = [
        { id: 1, name: 'Temperature Sensor', serial: 'TS-001', type: 'Sensor', status: 'Online', customer: 'customer@nexusiot.com' },
        { id: 2, name: 'GPS Tracker', serial: 'GPS-002', type: 'Tracker', status: 'Offline', customer: 'customer@nexusiot.com' },
        { id: 3, name: 'Smart Lock', serial: 'SL-003', type: 'Actuator', status: 'Online', customer: 'anothercustomer@email.com' }
    ];

    // --- Authentication Logic (login.html) ---
    // IMPORTANT: This is a mock authentication for UI demonstration ONLY.
    // In a real application, never store credentials or handle authentication client-side.
    const authForm = document.getElementById('auth-form');
    if (authForm) {
        authForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const email = authForm.email.value;
            const password = authForm.password.value;
            const user = users.find(u => u.email === email && u.password === password);

            if (user) {
                localStorage.setItem('loggedInUser', JSON.stringify(user));
                if (user.role === 'admin') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'customer.html';
                }
            } else {
                document.querySelector('.message').textContent = 'Invalid credentials. Please try again.';
            }
        });

        const signupBtn = document.getElementById('signup-btn');
        signupBtn.addEventListener('click', () => {
            // In a real app, this would lead to a separate sign-up flow.
            // For this mock, we'll just show a message.
            document.querySelector('.message').textContent = 'Sign-up functionality is not implemented in this demo.';
        });
    }

    // --- Check login status and redirect ---
    const loggedInUser = JSON.parse(localStorage.getItem('loggedInUser'));
    const isDashboardPage = window.location.pathname.includes('admin.html') || window.location.pathname.includes('customer.html');

    if (isDashboardPage && !loggedInUser) {
        window.location.href = 'login.html'; // Redirect if not logged in
    }

    // --- Admin Dashboard Logic (admin.html) ---
    const deviceTableBody = document.getElementById('device-table-body');
    if (deviceTableBody && loggedInUser && loggedInUser.role === 'admin') {
        const populateAdminTable = () => {
            deviceTableBody.innerHTML = ''; // Clear existing rows
            devices.forEach(device => {
                const row = document.createElement('tr');
                row.innerHTML = `
                    <td>${device.name}</td>
                    <td>${device.id}</td>
                    <td>${device.type}</td>
                    <td class="${device.status.toLowerCase()}">${device.status}</td>
                `;
                deviceTableBody.appendChild(row);
            });
        };

        const modal = document.getElementById('add-device-modal');
        const addDeviceBtn = document.getElementById('add-device-btn');
        const closeButton = document.querySelector('.close-button');

        addDeviceBtn.onclick = () => modal.style.display = 'block';
        closeButton.onclick = () => modal.style.display = 'none';
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };

        const addDeviceForm = document.getElementById('add-device-form');
        addDeviceForm.addEventListener('submit', (e) => {
            e.preventDefault();
            const newDevice = {
                id: devices.length + 1,
                name: addDeviceForm['device-name'].value,
                serial: addDeviceForm['serial-number'].value, // Capture serial number
                type: addDeviceForm['device-type'].value,   // Capture device type
                status: 'Offline',
                customer: addDeviceForm['customer-email'].value
            };
            devices.push(newDevice);
            populateAdminTable();
            modal.style.display = 'none';
            addDeviceForm.reset();
        });

        populateAdminTable();
    }


    // --- Customer Dashboard Logic (customer.html) ---
    const deviceGrid = document.getElementById('device-grid');
    if (deviceGrid && loggedInUser && loggedInUser.role === 'customer') {
        const customerDevices = devices.filter(d => d.customer === loggedInUser.email);

        customerDevices.forEach(device => {
            const card = document.createElement('div');
            card.className = `device-card ${device.status.toLowerCase()}`;
            card.innerHTML = `
                <h3>${device.name}</h3>
                <p>ID: ${device.id}</p>
                <p>Status: ${device.status}</p>
            `;
            card.onclick = () => {
                document.querySelector('.dashboard').classList.add('hidden');
                const detailView = document.getElementById('device-detail-view');
                document.getElementById('device-detail-name').textContent = device.name;
                detailView.classList.remove('hidden');
            };
            deviceGrid.appendChild(card);
        });

        const backButton = document.getElementById('back-to-grid');
        backButton.onclick = () => {
            document.querySelector('.dashboard').classList.remove('hidden');
            document.getElementById('device-detail-view').classList.add('hidden');
        };
    }

    // --- Logout Logic ---
    const logoutLinks = document.querySelectorAll('a[href="index.html"]');
    logoutLinks.forEach(link => {
        // Only apply to logout links in the header of dashboard pages
        if (link.closest('header')) {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                localStorage.removeItem('loggedInUser');
                window.location.href = 'index.html';
            });
        }
    });
});
