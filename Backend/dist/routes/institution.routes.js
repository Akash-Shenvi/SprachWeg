"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const institution_controller_1 = require("../controllers/institution.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect, (0, auth_middleware_1.authorize)('institution'));
router.get('/dashboard', institution_controller_1.getInstitutionDashboard);
router.get('/submissions', institution_controller_1.getInstitutionSubmissions);
router.post('/submissions', institution_controller_1.createInstitutionSubmission);
exports.default = router;
