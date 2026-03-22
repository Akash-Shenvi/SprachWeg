"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const institution_controller_1 = require("../controllers/institution.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.use(auth_middleware_1.protect, auth_middleware_1.isAdmin);
router.get('/requests', institution_controller_1.getAdminInstitutionRequests);
router.post('/requests/:id/approve', institution_controller_1.approveInstitutionRequest);
router.post('/requests/:id/reject', institution_controller_1.rejectInstitutionRequest);
exports.default = router;
