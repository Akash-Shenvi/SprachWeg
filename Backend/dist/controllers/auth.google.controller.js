"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.googleCallback = exports.connectGoogle = void 0;
const google_calendar_service_1 = require("../services/google.calendar.service");
const user_model_1 = __importDefault(require("../models/user.model"));
const googleService = new google_calendar_service_1.GoogleCalendarService();
const connectGoogle = (req, res) => {
    try {
        const url = googleService.getAuthUrl();
        res.json({ url });
    }
    catch (error) {
        res.status(500).json({ message: 'Error generating auth URL', error });
    }
};
exports.connectGoogle = connectGoogle;
const googleCallback = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { code, state } = req.query; // state could be used to pass userId if needed, strictly speaking
        // Ideally we pass userId in state, but simpler flow: 
        // Frontend receives code, sends code + userId (via auth token) to a POST endpoint.
        // OR: We rely on the callback handling it here.
        // BETTER: Frontend handles the redirect, grabs 'code', and sends it to backend via POST /auth/google/callback with Bearer token.
        // Let's assume the frontend sends the code to a POST endpoint.
        const { code: authCode } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a._id;
        const tokens = yield googleService.getTokens(authCode);
        if (tokens.refresh_token) {
            yield user_model_1.default.findByIdAndUpdate(userId, { googleRefreshToken: tokens.refresh_token });
            res.json({ message: 'Google Calendar connected successfully' });
        }
        else {
            // Check if user already has a token (refresh token only sent on first consent)
            // If strictly needed, we force prompt: 'consent' in service.
            res.json({ message: 'Connected (No new refresh token)' });
        }
    }
    catch (error) {
        console.error("Google Auth Error:", error);
        res.status(500).json({ message: 'Error connecting Google Calendar', error });
    }
});
exports.googleCallback = googleCallback;
