/**
 * Password Generator Module
 */

window.SecureHub = window.SecureHub || {};
window.SecureHub.Modules = window.SecureHub.Modules || {};

window.SecureHub.Modules.PasswordGenerator = class PasswordGenerator {
    static get CHAR_SETS() {
        return {
            uppercase: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
            lowercase: 'abcdefghijklmnopqrstuvwxyz',
            numbers: '0123456789',
            symbols: '!@#$%^&*()_+-=[]{}|;:,.<>?',
            similar: 'Il1O0'
        };
    }

    /**
     * Generates a random password based on options.
     * @param {number} length 
     * @param {object} options { uppercase, lowercase, numbers, symbols, excludeSimilar }
     * @returns {string}
     */
    static generate(length, options) {
        let chars = '';
        if (options.uppercase) chars += this.CHAR_SETS.uppercase;
        if (options.lowercase) chars += this.CHAR_SETS.lowercase;
        if (options.numbers) chars += this.CHAR_SETS.numbers;
        if (options.symbols) chars += this.CHAR_SETS.symbols;

        if (options.excludeSimilar) {
            for (const char of this.CHAR_SETS.similar) {
                // Global replace
                chars = chars.split(char).join('');
            }
        }

        if (chars.length === 0) return '';

        let password = '';
        const array = new Uint32Array(length);
        window.crypto.getRandomValues(array);

        for (let i = 0; i < length; i++) {
            password += chars[array[i] % chars.length];
        }

        return password;
    }

    /**
     * Calculates rough entropy of the password in bits.
     * @param {string} password 
     * @returns {number}
     */
    static calculateStrength(password) {
        if (!password) return 0;

        let poolSize = 0;
        if (/[A-Z]/.test(password)) poolSize += 26;
        if (/[a-z]/.test(password)) poolSize += 26;
        if (/[0-9]/.test(password)) poolSize += 10;
        if (/[^A-Za-z0-9]/.test(password)) poolSize += 30; // approx symbol count

        if (poolSize === 0) return 0;

        return Math.floor(Math.log2(Math.pow(poolSize, password.length)));
    }
}
