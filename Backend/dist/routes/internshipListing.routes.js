"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const internshipListing_controller_1 = require("../controllers/internshipListing.controller");
const auth_middleware_1 = require("../middlewares/auth.middleware");
const router = express_1.default.Router();
router.get('/', internshipListing_controller_1.getPublicInternships);
router.get('/admin', auth_middleware_1.protect, auth_middleware_1.isAdmin, internshipListing_controller_1.getAdminInternships);
router.post('/admin', auth_middleware_1.protect, auth_middleware_1.isAdmin, internshipListing_controller_1.createInternship);
router.put('/admin/:id', auth_middleware_1.protect, auth_middleware_1.isAdmin, internshipListing_controller_1.updateInternship);
router.delete('/admin/:id', auth_middleware_1.protect, auth_middleware_1.isAdmin, internshipListing_controller_1.deleteInternship);
router.get('/:slug', internshipListing_controller_1.getInternshipBySlug);
exports.default = router;
