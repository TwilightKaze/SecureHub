# SecureHub 使用说明

## 概述
**SecureHub** 是一个离线优先的 **TOTP 验证器** 与 **密码生成器** Web 应用，所有功能在本地浏览器中运行。

---

## 核心特性
- **离线运行**：无服务器、无外部网络请求  
- **本地加密**：AES-GCM 256 位加密（使用 Web Crypto API）  
- **现代 UI**：毛玻璃风格，支持深色 / 浅色模式  
- **密码生成器**：可配置规则与强度评估  

---

## 安全性
- **CSP**：`default-src 'self'`
- **存储**：`localStorage` 中仅保存加密数据
- **加密**：使用 `window.crypto`，不使用 `Math.random()`

---

## 安全验证
- Network 面板：无外部请求  
- Local Storage：仅加密数据，无明文  

