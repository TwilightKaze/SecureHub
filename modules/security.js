/**
 * Security Module
 * Handles AES-GCM encryption/decryption for the vault.
 */

// Define global namespace if not exists
window.SecureHub = window.SecureHub || {};
window.SecureHub.Modules = window.SecureHub.Modules || {};

const SALT_LEN = 16;
const IV_LEN = 12; // Standard for GCM
const ITERATIONS = 100000;
const HASH_ALGO = 'SHA-256';

window.SecureHub.Modules.Security = class Security {
    /**
     * Derives a cryptographic key from a password and salt.
     * @param {string} password 
     * @param {Uint8Array} salt 
     * @returns {Promise<CryptoKey>}
     */
    static async deriveKey(password, salt) {
        const enc = new TextEncoder();
        const keyMaterial = await window.crypto.subtle.importKey(
            "raw",
            enc.encode(password),
            { name: "PBKDF2" },
            false,
            ["deriveKey"]
        );

        return await window.crypto.subtle.deriveKey(
            {
                name: "PBKDF2",
                salt: salt,
                iterations: ITERATIONS,
                hash: HASH_ALGO
            },
            keyMaterial,
            { name: "AES-GCM", length: 256 },
            false,
            ["encrypt", "decrypt"]
        );
    }

    /**
     * Encrypts text with a password.
     * Returns a JSON string containing salt, iv, and ciphertext (all base64).
     * @param {string} plainText 
     * @param {string} password 
     * @returns {Promise<string>}
     */
    static async encrypt(plainText, password) {
        const salt = window.crypto.getRandomValues(new Uint8Array(SALT_LEN));
        const iv = window.crypto.getRandomValues(new Uint8Array(IV_LEN));
        const key = await this.deriveKey(password, salt);

        const enc = new TextEncoder();
        const encrypted = await window.crypto.subtle.encrypt(
            { name: "AES-GCM", iv: iv },
            key,
            enc.encode(plainText)
        );

        return JSON.stringify({
            salt: this.bufferToBase64(salt),
            iv: this.bufferToBase64(iv),
            data: this.bufferToBase64(encrypted)
        });
    }

    /**
     * Decrypts text with a password.
     * Throws error if decryption fails (wrong password).
     * @param {string} encryptedJson 
     * @param {string} password 
     * @returns {Promise<string>}
     */
    static async decrypt(encryptedJson, password) {
        try {
            const { salt, iv, data } = JSON.parse(encryptedJson);

            const saltBytes = this.base64ToBuffer(salt);
            const ivBytes = this.base64ToBuffer(iv);
            const dataBytes = this.base64ToBuffer(data);

            const key = await this.deriveKey(password, saltBytes);

            const decrypted = await window.crypto.subtle.decrypt(
                { name: "AES-GCM", iv: ivBytes },
                key,
                dataBytes
            );

            const dec = new TextDecoder();
            return dec.decode(decrypted);
        } catch (e) {
            console.error("Decryption failed:", e);
            throw new Error("Invalid password or corrupted data");
        }
    }

    // --- Helpers ---

    static bufferToBase64(buffer) {
        let binary = '';
        const bytes = new Uint8Array(buffer);
        const len = bytes.byteLength;
        for (let i = 0; i < len; i++) {
            binary += String.fromCharCode(bytes[i]);
        }
        return window.btoa(binary);
    }

    static base64ToBuffer(base64) {
        const binary = window.atob(base64);
        const len = binary.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binary.charCodeAt(i);
        }
        return bytes.buffer;
    }
}
