// Coffee Logger JavaScript
class CoffeeLogger {
    constructor() {
        this.logs = this.loadLogs();
        this.form = document.getElementById('coffeeForm');
        this.logsContainer = document.getElementById('logsContainer');
        this.clearButton = document.getElementById('clearLogs');
        this.timerBtn = document.getElementById('timerBtn');
        this.timeInput = document.getElementById('time');
        this.groundsInInput = document.getElementById('groundsIn');
        
        // Timer variables
        this.timerInterval = null;
        this.startTime = null;
        this.elapsedTime = 0;
        this.isRunning = false;
        
        // Current user
        this.currentUser = null;
        
        this.initializeEventListeners();
        this.renderLogs();
        this.setDefaultGroundsIn();
        this.setDefaultCoffeeOut();
        this.setDefaultBrand();
        this.setDefaultLastClean();
        
        // Load from cloud on startup (will be called when user logs in)
        
        // Make instance globally available
        window.coffeeLogger = this;
    }

    initializeEventListeners() {
        this.form.addEventListener('submit', (e) => this.handleFormSubmit(e));
        this.clearButton.addEventListener('click', () => this.clearAllLogs());
        this.timerBtn.addEventListener('click', () => this.handleTimerClick());
        document.getElementById('nowBtn').addEventListener('click', () => this.setCurrentDate());
        
        // Add input validation
        this.addInputValidation();
    }

    addInputValidation() {
        const numericInputs = document.querySelectorAll('input[type="number"]');
        numericInputs.forEach(input => {
            input.addEventListener('input', (e) => {
                const value = parseFloat(e.target.value);
                if (value < 0) {
                    e.target.setCustomValidity('Value must be positive');
                } else {
                    e.target.setCustomValidity('');
                }
            });
        });
    }

    setDefaultGroundsIn() {
        if (this.logs.length > 0) {
            // Find the most recent coffee log
            const coffeeLogs = this.logs.filter(log => log.type === 'coffee');
            if (coffeeLogs.length > 0) {
                if (coffeeLogs[0].groundsIn) {
                    this.groundsInInput.value = coffeeLogs[0].groundsIn;
                } else {
                    this.groundsInInput.value = 18;
                }
            } else {
                this.groundsInInput.value = 18;
            }
        } else {
            this.groundsInInput.value = 18;
        }
    }

    setDefaultCoffeeOut() {
        const coffeeOutInput = document.getElementById('coffeeOut');
        if (this.logs.length > 0) {
            // Find the most recent coffee log
            const coffeeLogs = this.logs.filter(log => log.type === 'coffee');
            if (coffeeLogs.length > 0) {
                if (coffeeLogs[0].coffeeOut) {
                    coffeeOutInput.value = coffeeLogs[0].coffeeOut;
                } else {
                    coffeeOutInput.value = 36;
                }
            } else {
                coffeeOutInput.value = 36;
            }
        } else {
            coffeeOutInput.value = 36;
        }
    }

    setDefaultBrand() {
        const brandInput = document.getElementById('brand');
        if (this.logs.length > 0) {
            // Find the most recent coffee log
            const coffeeLogs = this.logs.filter(log => log.type === 'coffee');
            if (coffeeLogs.length > 0) {
                if (coffeeLogs[0].brand) {
                    brandInput.value = coffeeLogs[0].brand;
                }
            }
        }
    }

    setDefaultLastClean() {
        const lastCleanInput = document.getElementById('lastClean');
        if (this.logs.length > 0) {
            // Find the most recent cleaning log
            const cleaningLogs = this.logs.filter(log => log.type === 'cleaning');
            if (cleaningLogs.length > 0) {
                lastCleanInput.value = cleaningLogs[0].lastClean;
            }
        }
    }

    setCurrentDate() {
        const today = new Date().toISOString().split('T')[0];
        document.getElementById('lastClean').value = today;
        
        // Log the cleaning event
        const cleaningData = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            type: 'cleaning',
            lastClean: today
        };
        
        // Add to logs
        this.logs.unshift(cleaningData);
        this.saveLogs();
        this.renderLogs();
        
        // Sync to cloud
        if (this.currentUser) {
            this.syncToCloud(cleaningData);
        }
        
        // Show success notification
        this.showNotification('Cleaning logged successfully!', 'success');
    }

    setUser(user) {
        this.currentUser = user;
        if (user) {
            // Load logs from cloud when user logs in
            this.loadFromCloud();
        }
    }

    async syncToCloud(logData) {
        if (!this.currentUser) return;
        
        try {
            await window.syncToCloud(logData, this.currentUser);
        } catch (error) {
            console.error('Cloud sync error:', error);
            this.showNotification('Failed to sync to cloud. Data saved locally.', 'error');
        }
    }

    async loadFromCloud() {
        if (!this.currentUser) return;
        
        try {
            const cloudLogs = await window.loadFromCloud(this.currentUser);
            
            // Merge with local logs, prioritizing cloud data
            this.logs = this.mergeLogs(this.logs, cloudLogs);
            this.saveLogs();
            this.renderLogs();
            
            console.log('Loaded from cloud:', cloudLogs.length, 'logs');
        } catch (error) {
            console.error('Cloud load error:', error);
            this.showNotification('Failed to load from cloud. Using local data.', 'error');
        }
    }

    mergeLogs(localLogs, cloudLogs) {
        const merged = [...cloudLogs];
        
        // Add local logs that don't exist in cloud
        localLogs.forEach(localLog => {
            const exists = merged.some(cloudLog => cloudLog.id === localLog.id);
            if (!exists) {
                merged.push(localLog);
            }
        });
        
        // Sort by timestamp
        return merged.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));
    }

    handleTimerClick() {
        if (this.timerBtn.classList.contains('timer-start')) {
            this.startTimer();
        } else if (this.timerBtn.classList.contains('timer-stop')) {
            this.stopTimer();
        } else if (this.timerBtn.classList.contains('timer-reset')) {
            this.resetTimer();
        }
    }

    startTimer() {
        this.isRunning = true;
        this.startTime = Date.now() - this.elapsedTime;
        this.timerBtn.textContent = 'Stop';
        this.timerBtn.className = 'timer-btn timer-stop';
        
        this.timerInterval = setInterval(() => {
            this.elapsedTime = Date.now() - this.startTime;
            this.timeInput.value = (this.elapsedTime / 1000).toFixed(1);
        }, 100);
    }

    stopTimer() {
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.timerBtn.textContent = 'Reset';
        this.timerBtn.className = 'timer-btn timer-reset';
        
        // Update the time input with the final value
        this.timeInput.value = (this.elapsedTime / 1000).toFixed(1);
    }

    resetTimer() {
        this.elapsedTime = 0;
        this.startTime = null;
        this.isRunning = false;
        clearInterval(this.timerInterval);
        this.timerBtn.textContent = 'Start';
        this.timerBtn.className = 'timer-btn timer-start';
        this.timeInput.value = '';
    }

    handleFormSubmit(e) {
        e.preventDefault();
        
        const formData = new FormData(this.form);
        const coffeeData = {
            id: Date.now(),
            timestamp: new Date().toISOString(),
            type: 'coffee',
            groundsIn: parseFloat(formData.get('groundsIn')),
            time: parseFloat(formData.get('time')),
            coffeeOut: parseFloat(formData.get('coffeeOut')),
            brand: formData.get('brand') || null
        };

        // Validate required fields
        if (!coffeeData.groundsIn || !coffeeData.time || !coffeeData.coffeeOut) {
            this.showNotification('Please fill in all required fields', 'error');
            return;
        }

        // Add to logs
        this.logs.unshift(coffeeData);
        this.saveLogs();
        this.renderLogs();
        
        // Sync to cloud
        if (this.currentUser) {
            this.syncToCloud(coffeeData);
        }
        
        // Reset form and set defaults
        this.form.reset();
        this.setDefaultGroundsIn();
        this.setDefaultCoffeeOut();
        this.setDefaultBrand();
        
        // Show success notification
        this.showNotification('Coffee logged successfully!', 'success');
    }

    renderLogs() {
        if (this.logs.length === 0) {
            this.logsContainer.innerHTML = this.getEmptyStateHTML();
            return;
        }

        this.logsContainer.innerHTML = this.logs.map(log => this.createLogEntryHTML(log)).join('');
    }

    createLogEntryHTML(log) {
        const date = new Date(log.timestamp);
        const formattedDate = date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        });

        if (log.type === 'cleaning') {
            return `
                <div class="log-entry log-entry-cleaning" data-id="${log.id}">
                    <div class="log-header">
                        <span class="log-date">${formattedDate}</span>
                        <span class="log-type">🧹 Cleaning</span>
                    </div>
                    <div class="log-details">
                        <div class="log-detail">
                            <span class="log-detail-label">Cleaning Date</span>
                            <span class="log-detail-value">${new Date(log.lastClean).toLocaleDateString()}</span>
                        </div>
                    </div>
                </div>
            `;
        } else {
            const ratio = (log.coffeeOut / log.groundsIn).toFixed(1);
            
            return `
                <div class="log-entry log-entry-coffee" data-id="${log.id}">
                    <div class="log-header">
                        <span class="log-date">${formattedDate}</span>
                        <span class="log-ratio">1:${ratio} ratio</span>
                    </div>
                    <div class="log-details">
                        <div class="log-detail">
                            <span class="log-detail-label">Grounds In</span>
                            <span class="log-detail-value">${log.groundsIn}g</span>
                        </div>
                        <div class="log-detail">
                            <span class="log-detail-label">Time</span>
                            <span class="log-detail-value">${log.time}s</span>
                        </div>
                        <div class="log-detail">
                            <span class="log-detail-label">Coffee Out</span>
                            <span class="log-detail-value">${log.coffeeOut}g</span>
                        </div>
                        ${log.brand ? `
                            <div class="log-detail">
                                <span class="log-detail-label">Brand</span>
                                <span class="log-detail-value">${log.brand}</span>
                            </div>
                        ` : ''}
                    </div>
                </div>
            `;
        }
    }

    getEmptyStateHTML() {
        return `
            <div class="empty-state">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5"/>
                </svg>
                <h3>No coffee logs yet</h3>
                <p>Start logging your coffee brewing sessions to track your progress</p>
            </div>
        `;
    }

    clearAllLogs() {
        if (this.logs.length === 0) {
            this.showNotification('No logs to clear', 'info');
            return;
        }

        if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
            this.logs = [];
            this.saveLogs();
            this.renderLogs();
            this.showNotification('All logs cleared', 'success');
        }
    }

    saveLogs() {
        try {
            localStorage.setItem('bestpresso_logs', JSON.stringify(this.logs));
        } catch (error) {
            console.error('Failed to save logs:', error);
            this.showNotification('Failed to save logs', 'error');
        }
    }

    loadLogs() {
        try {
            const savedLogs = localStorage.getItem('bestpresso_logs');
            return savedLogs ? JSON.parse(savedLogs) : [];
        } catch (error) {
            console.error('Failed to load logs:', error);
            return [];
        }
    }

    showNotification(message, type = 'info') {
        // Create notification element
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        // Add styles
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            padding: 12px 20px;
            border-radius: 8px;
            color: white;
            font-weight: 500;
            z-index: 1000;
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;

        // Set background color based on type
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            info: '#3b82f6'
        };
        notification.style.backgroundColor = colors[type] || colors.info;

        // Add to page
        document.body.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 100);

        // Remove after 3 seconds
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, 3000);
    }

    // Export logs as JSON
    exportLogs() {
        const dataStr = JSON.stringify(this.logs, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        
        const link = document.createElement('a');
        link.href = url;
        link.download = `bestpresso-logs-${new Date().toISOString().split('T')[0]}.json`;
        link.click();
        
        URL.revokeObjectURL(url);
    }

    // Import logs from JSON
    importLogs(file) {
        const reader = new FileReader();
        reader.onload = (e) => {
            try {
                const importedLogs = JSON.parse(e.target.result);
                if (Array.isArray(importedLogs)) {
                    this.logs = importedLogs;
                    this.saveLogs();
                    this.renderLogs();
                    this.showNotification('Logs imported successfully', 'success');
                } else {
                    throw new Error('Invalid format');
                }
            } catch (error) {
                this.showNotification('Failed to import logs. Please check the file format.', 'error');
            }
        };
        reader.readAsText(file);
    }
}

// --- Household Management UI Logic (INLINE version) ---
function renderHouseholdUI(user) {
    const syncStatus = document.getElementById('syncStatus');
    const authSection = document.getElementById('authSection');
    // Remove any previous household UI
    let prev = document.getElementById('householdInlineUI');
    if (prev) prev.remove();
    if (!user) {
        syncStatus.classList.remove('unknown', 'known');
        syncStatus.textContent = '🔴 Local only';
        return;
    }
    window.getUserHouseholdId(user).then(async (householdId) => {
        let householdDiv = document.createElement('div');
        householdDiv.id = 'householdInlineUI';
        householdDiv.style.width = '100%';
        if (householdId) {
            // In a household
            const info = await window.getHouseholdInfo(householdId);
            syncStatus.classList.remove('unknown');
            syncStatus.classList.add('known');
            syncStatus.textContent = `🟢 Household: ${info.name}`;
            syncStatus.style.cursor = 'pointer';
            // Toggle details
            let detailsVisible = false;
            let detailsDiv = document.createElement('div');
            detailsDiv.className = 'household-info-toggle';
            detailsDiv.style.display = 'none';
            detailsDiv.innerHTML = `
                <button class="leave-btn" id="leaveHouseholdBtn">Leave household</button>
                <span class="code-info">Household code: ${info.inviteCode}</span>
            `;
            syncStatus.onclick = () => {
                detailsVisible = !detailsVisible;
                detailsDiv.style.display = detailsVisible ? 'block' : 'none';
            };
            householdDiv.appendChild(detailsDiv);
            setTimeout(() => {
                // Attach leave handler after DOM insert
                const btn = document.getElementById('leaveHouseholdBtn');
                if (btn) {
                    btn.onclick = async () => {
                        if (confirm('Are you sure you want to leave this household?')) {
                            await window.leaveHousehold(user);
                            window.showNotification('Left household', 'success');
                            renderHouseholdUI(user);
                            if (window.coffeeLogger) window.coffeeLogger.loadFromCloud();
                        }
                    };
                }
            }, 0);
        } else {
            // Not in a household
            syncStatus.classList.remove('known');
            syncStatus.classList.add('unknown');
            syncStatus.textContent = '🟠 Household: Unknown';
            syncStatus.style.cursor = 'default';
            syncStatus.onclick = null;
            // Create new household row
            const createRow = document.createElement('div');
            createRow.className = 'household-inline-row';
            createRow.innerHTML = `
                <input type="text" id="newHouseholdName" placeholder="Household name" autocomplete="off" />
                <button class="household-btn" id="createHouseholdBtn" disabled>Create new household</button>
            `;
            // Join household row
            const joinRow = document.createElement('div');
            joinRow.className = 'household-inline-row';
            joinRow.innerHTML = `
                <input type="text" id="joinHouseholdCode" placeholder="Invite code" autocomplete="off" />
                <button class="household-btn" id="joinHouseholdBtn" disabled>Join household</button>
            `;
            // Wrap both rows in a box
            const box = document.createElement('div');
            box.className = 'household-box';
            box.appendChild(createRow);
            box.appendChild(joinRow);
            householdDiv.appendChild(box);
            // Enable/disable buttons based on input
            const nameInput = createRow.querySelector('#newHouseholdName');
            const createBtn = createRow.querySelector('#createHouseholdBtn');
            nameInput.addEventListener('input', () => {
                createBtn.disabled = !nameInput.value.trim();
            });
            createBtn.onclick = async () => {
                const name = nameInput.value.trim();
                if (!name) return;
                try {
                    await window.createHousehold(user, name);
                    window.showNotification('Household created!', 'success');
                    renderHouseholdUI(user);
                    if (window.coffeeLogger) window.coffeeLogger.loadFromCloud();
                } catch (err) {
                    window.showNotification(err.message, 'error');
                }
            };
            const codeInput = joinRow.querySelector('#joinHouseholdCode');
            const joinBtn = joinRow.querySelector('#joinHouseholdBtn');
            codeInput.addEventListener('input', () => {
                joinBtn.disabled = !codeInput.value.trim();
            });
            joinBtn.onclick = async () => {
                const code = codeInput.value.trim().toUpperCase();
                if (!code) return;
                try {
                    await window.joinHouseholdByInvite(user, code);
                    window.showNotification('Joined household!', 'success');
                    renderHouseholdUI(user);
                    if (window.coffeeLogger) window.coffeeLogger.loadFromCloud();
                } catch (err) {
                    if (err && (err.message === 'Invalid invite code' || err.message.includes('Missing or insufficient permissions'))) {
                        window.showNotification('Invalid invite code', 'error');
                    } else {
                        window.showNotification(err.message, 'error');
                    }
                }
            };
        }
        // Insert after syncStatus
        authSection.insertBefore(householdDiv, document.getElementById('userInfo'));
    });
}

// Patch CoffeeLogger to re-render household UI on login/logout
const origSetUser = CoffeeLogger.prototype.setUser;
CoffeeLogger.prototype.setUser = function(user) {
    origSetUser.call(this, user);
    renderHouseholdUI(user);
};

// On page load, always initialize household UI
document.addEventListener('DOMContentLoaded', () => {
    new CoffeeLogger();
    renderHouseholdUI(null);
    const params = new URLSearchParams(window.location.search);
    const invite = params.get('invite');
    if (invite) {
        // Wait for login, then prefill join form
        const tryPrefill = () => {
            const joinInput = document.getElementById('inviteCodeInput');
            if (joinInput) {
                joinInput.value = `${window.location.origin}?invite=${invite}`;
            } else {
                setTimeout(tryPrefill, 200);
            }
        };
        tryPrefill();
    }
});

 