"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ensureStorageDirectory = exports.getFileServeRoot = void 0;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const env_1 = require("../config/env");
const productionRoot = '/home/sovirtraining/file_serve';
const developmentRoot = path_1.default.resolve(process.cwd(), 'uploads');
const getFileServeRoot = () => (env_1.env.NODE_ENV === 'production' ? productionRoot : developmentRoot);
exports.getFileServeRoot = getFileServeRoot;
const ensureStorageDirectory = (...segments) => {
    const directory = path_1.default.join((0, exports.getFileServeRoot)(), ...segments);
    if (!fs_1.default.existsSync(directory)) {
        fs_1.default.mkdirSync(directory, { recursive: true });
    }
    return directory;
};
exports.ensureStorageDirectory = ensureStorageDirectory;
