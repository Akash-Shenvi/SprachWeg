"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const trialRequestController_1 = require("../controllers/trialRequestController");
const router = express_1.default.Router();
// Public route to submit a trial request
router.post('/trials', trialRequestController_1.createTrialRequest);
// Admin routes (should ideally be protected with middleware, but keeping open for now per pattern or user instruction)
router.get('/trials', trialRequestController_1.getTrialRequests);
router.delete('/trials/:id', trialRequestController_1.deleteTrialRequest);
exports.default = router;
