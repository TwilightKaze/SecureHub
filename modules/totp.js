/**
 * TOTP Module
 * Manages TOTP tokens using the otpauth library.
 */

window.SecureHub = window.SecureHub || {};
window.SecureHub.Modules = window.SecureHub.Modules || {};

const STORAGE_KEY = 'securehub_vault_v1';

window.SecureHub.Modules.TOTPManager = class TOTPManager {
    constructor(securityModule) {
        this.security = securityModule;
        this.tokens = []; // Array of { id, issuer, account, secretUri }
    }

    /**
     * Loads tokens from encrypted storage.
     * @param {string} password 
     */
    async load(password) {
        const encryptedData = localStorage.getItem(STORAGE_KEY);
        if (!encryptedData) {
            this.tokens = [];
            return true; // No data means new vault
        }

        try {
            const json = await this.security.decrypt(encryptedData, password);
            this.tokens = JSON.parse(json);
            return true;
        } catch (e) {
            console.error(e);
            throw new Error('Incorrect password');
        }
    }

    /**
     * Saves tokens to encrypted storage.
     * @param {string} password 
     */
    async save(password) {
        const json = JSON.stringify(this.tokens);
        const encrypted = await this.security.encrypt(json, password);
        localStorage.setItem(STORAGE_KEY, encrypted);
    }

    /**
     * Adds a new token.
     * @param {string} issuer 
     * @param {string} account 
     * @param {string} secret (Base32)
     */
    add(issuer, account, secret) {
        // Basic validation
        if (!secret) throw new Error('Secret is required');

        // Clean secret
        const cleanSecret = secret.replace(/\s/g, '').toUpperCase();

        // Create URI to validate
        // otpauth://totp/Issuer:Account?secret=SECRET&issuer=Issuer
        const uri = `otpauth://totp/${encodeURIComponent(issuer)}:${encodeURIComponent(account)}?secret=${cleanSecret}&issuer=${encodeURIComponent(issuer)}&algorithm=SHA1&digits=6&period=30`;

        // Validate using OTPAuth
        try {
            window.OTPAuth.URI.parse(uri);
        } catch (e) {
            throw new Error('Invalid secret or parameters');
        }

        const newToken = {
            id: crypto.randomUUID(),
            issuer,
            account,
            secretUri: uri,
            createdAt: Date.now()
        };

        this.tokens.push(newToken);
    }

    /**
     * Removes a token by ID.
     * @param {string} id 
     */
    remove(id) {
        this.tokens = this.tokens.filter(t => t.id !== id);
    }

    /**
     * Generates codes for all tokens.
     * @returns {Array} Array of { id, code, period, remaining }
     */
    generateCodes() {
        return this.tokens.map(t => {
            const totp = window.OTPAuth.URI.parse(t.secretUri);
            const code = totp.generate();

            // Calculate remaining seconds
            const period = totp.period || 30;
            const now = Math.floor(Date.now() / 1000);
            const remaining = period - (now % period);

            return {
                id: t.id,
                code,
                remaining,
                period
            };
        });
    }

    isEmpty() {
        return this.tokens.length === 0;
    }
}
