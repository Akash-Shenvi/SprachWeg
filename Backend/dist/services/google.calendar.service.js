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
Object.defineProperty(exports, "__esModule", { value: true });
exports.GoogleCalendarService = void 0;
const googleapis_1 = require("googleapis");
const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];
class GoogleCalendarService {
    constructor() {
        this.oauth2Client = new googleapis_1.google.auth.OAuth2(process.env.GOOGLE_CLIENT_ID, process.env.GOOGLE_CLIENT_SECRET, process.env.GOOGLE_REDIRECT_URI);
    }
    getAuthUrl() {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline', // Essential for refresh token
            scope: SCOPES,
            prompt: 'consent' // Force consent to ensure refresh token is returned
        });
    }
    getTokens(code) {
        return __awaiter(this, void 0, void 0, function* () {
            const { tokens } = yield this.oauth2Client.getToken(code);
            return tokens;
        });
    }
    setCredentials(refreshToken) {
        this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    }
    extractMeetLink(eventData) {
        var _a, _b, _c;
        return ((eventData === null || eventData === void 0 ? void 0 : eventData.hangoutLink)
            || ((_c = (_b = (_a = eventData === null || eventData === void 0 ? void 0 : eventData.conferenceData) === null || _a === void 0 ? void 0 : _a.entryPoints) === null || _b === void 0 ? void 0 : _b.find((entryPoint) => (entryPoint === null || entryPoint === void 0 ? void 0 : entryPoint.entryPointType) === 'video')) === null || _c === void 0 ? void 0 : _c.uri)
            || '');
    }
    createMeeting(summary_1, description_1, startTime_1) {
        return __awaiter(this, arguments, void 0, function* (summary, description, startTime, durationMinutes = 60, attendees = []) {
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth: this.oauth2Client });
            const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
            const event = {
                summary: summary,
                description: description,
                start: {
                    dateTime: startTime.toISOString(),
                    timeZone: 'UTC', // Ensure consistency
                },
                end: {
                    dateTime: endTime.toISOString(),
                    timeZone: 'UTC',
                },
                conferenceData: {
                    createRequest: {
                        requestId: Math.random().toString(36).substring(7),
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                },
                attendees: attendees.map(email => ({ email })),
                guestsCanInviteOthers: false,
                guestsCanSeeOtherGuests: false,
            };
            const response = yield calendar.events.insert({
                calendarId: 'primary',
                requestBody: event,
                conferenceDataVersion: 1, // Required to create Google Meet link
                sendUpdates: 'all', // Send emails to attendees
            });
            return {
                meetLink: this.extractMeetLink(response.data),
                eventId: response.data.id || '',
            };
        });
    }
    updateMeeting(eventId_1, summary_1, description_1, startTime_1) {
        return __awaiter(this, arguments, void 0, function* (eventId, summary, description, startTime, durationMinutes = 60, attendees = []) {
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth: this.oauth2Client });
            const endTime = new Date(startTime.getTime() + durationMinutes * 60000);
            const response = yield calendar.events.patch({
                calendarId: 'primary',
                eventId,
                requestBody: {
                    summary,
                    description,
                    start: {
                        dateTime: startTime.toISOString(),
                        timeZone: 'UTC',
                    },
                    end: {
                        dateTime: endTime.toISOString(),
                        timeZone: 'UTC',
                    },
                    attendees: attendees.map((email) => ({ email })),
                    guestsCanInviteOthers: false,
                    guestsCanSeeOtherGuests: false,
                },
                conferenceDataVersion: 1,
                sendUpdates: 'all',
            });
            return {
                meetLink: this.extractMeetLink(response.data),
                eventId: response.data.id || eventId,
            };
        });
    }
    deleteEvent(eventId) {
        return __awaiter(this, void 0, void 0, function* () {
            const calendar = googleapis_1.google.calendar({ version: 'v3', auth: this.oauth2Client });
            try {
                yield calendar.events.delete({
                    calendarId: 'primary',
                    eventId: eventId,
                });
            }
            catch (error) {
                console.error('Error deleting Google Calendar event:', error);
                // Don't throw, just log. The local class deletion should proceed.
            }
        });
    }
}
exports.GoogleCalendarService = GoogleCalendarService;
