"use strict";
// src/services/proxy/index.ts - Export proxy services
// Timestamp: 2024-12-09
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = exports.resetProxyManager = exports.getProxyManager = exports.ProxyManager = exports.createPacketstreamProvider = exports.PacketstreamProvider = void 0;
// Providers
var packetstream_1 = require("./packetstream");
Object.defineProperty(exports, "PacketstreamProvider", { enumerable: true, get: function () { return packetstream_1.PacketstreamProvider; } });
Object.defineProperty(exports, "createPacketstreamProvider", { enumerable: true, get: function () { return packetstream_1.createPacketstreamProvider; } });
// Manager
var manager_1 = require("./manager");
Object.defineProperty(exports, "ProxyManager", { enumerable: true, get: function () { return manager_1.ProxyManager; } });
Object.defineProperty(exports, "getProxyManager", { enumerable: true, get: function () { return manager_1.getProxyManager; } });
Object.defineProperty(exports, "resetProxyManager", { enumerable: true, get: function () { return manager_1.resetProxyManager; } });
// Default export: singleton manager
var manager_2 = require("./manager");
Object.defineProperty(exports, "default", { enumerable: true, get: function () { return __importDefault(manager_2).default; } });
