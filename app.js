// App Logic
const app = {
    init() {
        this.cacheDOM();
        this.bindEvents();
        this.loadTheme();

        // Start the calculator loop
        this.startCalculatorLoop();
    },

    cacheDOM() {
        this.dom = {
            themeToggle: document.getElementById('theme-toggle'),
            tabs: document.querySelectorAll('.tab-btn'),
            sections: document.querySelectorAll('section'),

            // Calculator Inputs
            secretInput: document.getElementById('secret-key'),
            digitsSelect: document.getElementById('digits'),

            // Calculator Display
            generatedCode: document.getElementById('generated-code'),
            progressFill: document.getElementById('progress-fill'),
            copyTokenBtn: document.getElementById('copy-token-btn'),

            // Password Gen
            passOutput: document.getElementById('password-output'),
            copyPassBtn: document.getElementById('copy-password'),
            togglePassBtn: document.getElementById('toggle-password'),
            strengthBar: document.getElementById('strength-bar'),
            strengthText: document.getElementById('strength-text'),
            lengthSlider: document.getElementById('length-slider'),
            lengthVal: document.getElementById('length-val'),
            genBtn: document.getElementById('generate-btn'),

            opts: {
                upper: document.getElementById('use-uppercase'),
                lower: document.getElementById('use-lowercase'),
                number: document.getElementById('use-numbers'),
                symbol: document.getElementById('use-symbols'),
                exclude: document.getElementById('exclude-similar')
            }
        };
    },

    bindEvents() {
        // Theme
        this.dom.themeToggle.addEventListener('click', () => this.toggleTheme());

        // Tabs
        this.dom.tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                this.dom.tabs.forEach(t => t.classList.remove('active'));
                this.dom.sections.forEach(s => s.classList.remove('active'));

                tab.classList.add('active');
                document.getElementById(tab.dataset.tab).classList.add('active');
            });
        });

        // Calculator Inputs
        ['input', 'change', 'paste'].forEach(evt => {
            this.dom.secretInput.addEventListener(evt, () => this.updateCalculator());
        });
        this.dom.digitsSelect.addEventListener('change', () => this.updateCalculator());

        this.dom.copyTokenBtn.addEventListener('click', () => {
            const code = this.dom.generatedCode.textContent.replace(/\s/g, '');
            if (code && code !== '------' && code !== 'Invalid Key') {
                navigator.clipboard.writeText(code);
                const originalText = this.dom.copyTokenBtn.innerHTML;
                this.dom.copyTokenBtn.textContent = 'Copied!';
                setTimeout(() => {
                    this.dom.copyTokenBtn.innerHTML = originalText;
                }, 1500);
            }
        });

        // Password Gen
        this.dom.lengthSlider.addEventListener('input', (e) => {
            this.dom.lengthVal.textContent = e.target.value;
            this.generatePassword();
        });

        Object.values(this.dom.opts).forEach(opt => {
            opt.addEventListener('change', () => this.generatePassword());
        });

        this.dom.genBtn.addEventListener('click', () => {
            this.generatePassword();
            // Anime bounce effect on generate
            const btn = this.dom.genBtn;
            btn.style.transform = 'scale(0.95)';
            setTimeout(() => btn.style.transform = '', 150);
        });

        this.dom.copyPassBtn.addEventListener('click', () => {
            // Debug 1: Get Content reliably
            const pass = this.dom.passOutput.dataset.rawPassword || this.dom.passOutput.textContent;

            // Debug 2: Check content validity
            if (pass && pass !== 'Click Generate' && pass !== 'Select Options') {
                navigator.clipboard.writeText(pass)
                    .then(() => {
                        this.showCopyFeedback(this.dom.copyPassBtn);
                    })
                    .catch(err => {
                        console.error('Failed to copy text: ', err);
                        // Fallback
                        this.dom.copyPassBtn.style.color = 'var(--danger-color)';
                    });
            } else {
                // Pulse error if empty
                this.dom.passOutput.style.color = 'var(--danger-color)';
                setTimeout(() => this.dom.passOutput.style.color = '', 300);
            }
        });

        this.dom.togglePassBtn.addEventListener('click', () => {
            const isMasked = this.dom.passOutput.classList.contains('masked');
            if (isMasked) {
                this.dom.passOutput.classList.remove('masked');
                this.dom.togglePassBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path><circle cx="12" cy="12" r="3"></circle></svg>'; // Open eye
            } else {
                this.dom.passOutput.classList.add('masked');
                this.dom.togglePassBtn.innerHTML = '<svg viewBox="0 0 24 24" width="20" height="20" stroke="currentColor" stroke-width="2" fill="none"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path><line x1="1" y1="1" x2="23" y2="23"></line></svg>'; // Slashed eye
            }
        });
    },

    showCopyFeedback(btn) {
        // Anime style feedback
        const originalContent = btn.innerHTML;
        // Checkmark for clarity, Sparkle for style. Let's use Sparkle as requested.
        btn.innerHTML = '✨';
        btn.style.borderColor = 'var(--success-color)';
        btn.style.color = 'var(--success-color)';
        btn.style.transform = 'scale(1.2) rotate(15deg)'; // Pop effect

        setTimeout(() => {
            btn.innerHTML = originalContent;
            btn.style.borderColor = '';
            btn.style.color = '';
            btn.style.transform = '';
        }, 1500);
    },

    startCalculatorLoop() {
        this.updateCalculator();
        setInterval(() => this.updateCalculator(), 1000);
    },

    updateCalculator() {
        const secretText = this.dom.secretInput.value.replace(/\s/g, '').toUpperCase();
        const digits = parseInt(this.dom.digitsSelect.value) || 6;
        const period = 30; // Fixed per requirement

        const now = Date.now();
        const seconds = Math.floor(now / 1000);
        const remaining = period - (seconds % period);
        const percent = (remaining / period) * 100;

        // Update Progress Bar
        this.dom.progressFill.style.width = `${percent}%`;

        // Calculate Code if Secret is valid
        if (secretText.length >= 8) { // Basic length check
            try {
                const code = this.generateTOTP(secretText, digits, period);
                this.dom.generatedCode.textContent = code;
                this.dom.generatedCode.style.color = 'var(--primary-color)';
            } catch (e) {
                // console.error(e);
                this.dom.generatedCode.textContent = '------';
            }
        } else {
            this.dom.generatedCode.textContent = '------';
        }
    },

    generateTOTP(secret, digits, period) {
        if (!window.jsSHA) return "Error";

        // Base32 decode
        const base32chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        let bits = '';
        for (let i = 0; i < secret.length; i++) {
            const val = base32chars.indexOf(secret.charAt(i));
            if (val === -1) throw new Error('Invalid Base32 char');
            bits += val.toString(2).padStart(5, '0');
        }

        // Pad
        while (bits.length % 8 !== 0) {
            bits += '0';
        }

        const bytes = new Uint8Array(bits.length / 8);
        for (let i = 0; i < bits.length; i += 8) {
            bytes[i / 8] = parseInt(bits.slice(i, i + 8), 2);
        }

        // Counter
        const epoch = Math.floor(Date.now() / 1000);
        let counter = Math.floor(epoch / period);

        // HMAC-SHA1
        const shaObj = new jsSHA("SHA-1", "UINT8ARRAY");
        shaObj.setHMACKey(bytes, "UINT8ARRAY");

        const counterBytes = new Uint8Array(8);
        for (let i = 7; i >= 0; i--) {
            counterBytes[i] = counter & 0xff;
            counter = counter >>> 8;
        }

        shaObj.update(counterBytes);
        const hmac = shaObj.getHMAC("UINT8ARRAY");

        const offset = hmac[hmac.length - 1] & 0xf;
        const binary =
            ((hmac[offset] & 0x7f) << 24) |
            ((hmac[offset + 1] & 0xff) << 16) |
            ((hmac[offset + 2] & 0xff) << 8) |
            (hmac[offset + 3] & 0xff);

        const otp = binary % Math.pow(10, digits);
        return otp.toString().padStart(digits, '0');
    },

    toggleTheme() {
        const html = document.documentElement;
        const current = html.getAttribute('data-theme');
        const next = current === 'dark' ? 'light' : 'dark';
        html.setAttribute('data-theme', next);
        localStorage.setItem('theme', next);
    },

    loadTheme() {
        const saved = localStorage.getItem('theme') || 'light';
        document.documentElement.setAttribute('data-theme', saved);
    },

    // Password Generation Logic
    generatePassword() {
        // Collect options
        const length = parseInt(this.dom.lengthVal.textContent);
        const useUpper = this.dom.opts.upper.checked;
        const useLower = this.dom.opts.lower.checked;
        const useNumber = this.dom.opts.number.checked;
        const useSymbol = this.dom.opts.symbol.checked;
        const excludeSimilar = this.dom.opts.exclude.checked;

        if (!useUpper && !useLower && !useNumber && !useSymbol) {
            this.dom.passOutput.textContent = 'Select Options';
            this.dom.strengthBar.style.width = '0%';
            this.dom.strengthText.textContent = '';
            return;
        }

        let charset = "";
        if (useUpper) charset += "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
        if (useLower) charset += "abcdefghijklmnopqrstuvwxyz";
        if (useNumber) charset += "0123456789";
        if (useSymbol) charset += "!@#$%^&*()_+~`|}{[]:;?><,./-=";

        if (excludeSimilar) {
            charset = charset.replace(/[il1Lo0O]/g, "");
        }

        let password = "";
        // Cryptographically strong random
        const randomValues = new Uint32Array(length);
        window.crypto.getRandomValues(randomValues);

        for (let i = 0; i < length; i++) {
            password += charset[randomValues[i] % charset.length];
        }

        this.dom.passOutput.textContent = password;
        this.dom.passOutput.dataset.rawPassword = password;

        this.calculateStrength(password);
    },

    calculateStrength(password) {
        let score = 0;
        if (password.length > 8) score += 1;
        if (password.length > 12) score += 1;
        if (/[A-Z]/.test(password)) score += 1;
        if (/[a-z]/.test(password)) score += 1;
        if (/[0-9]/.test(password)) score += 1;
        if (/[^A-Za-z0-9]/.test(password)) score += 1;

        const maxScore = 6;
        const percent = (score / maxScore) * 100;

        let label = 'Weak';
        let color = 'var(--danger-color)';

        if (percent > 40) { label = 'Medium'; color = 'var(--warning-color)'; }
        if (percent > 75) { label = 'Strong'; color = 'var(--success-color)'; }

        this.dom.strengthBar.style.width = `${percent}%`;
        this.dom.strengthBar.style.backgroundColor = color;
        this.dom.strengthText.textContent = label;
    }
};

// Init app
document.addEventListener('DOMContentLoaded', () => {
    app.init();
});
