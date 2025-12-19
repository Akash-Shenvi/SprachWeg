import { google } from 'googleapis';
import { OAuth2Client } from 'google-auth-library';

const SCOPES = ['https://www.googleapis.com/auth/calendar.events'];

export class GoogleCalendarService {
    private oauth2Client: OAuth2Client;

    constructor() {
        this.oauth2Client = new google.auth.OAuth2(
            process.env.GOOGLE_CLIENT_ID,
            process.env.GOOGLE_CLIENT_SECRET,
            process.env.GOOGLE_REDIRECT_URI
        );
    }

    public getAuthUrl(): string {
        return this.oauth2Client.generateAuthUrl({
            access_type: 'offline', // Essential for refresh token
            scope: SCOPES,
            prompt: 'consent' // Force consent to ensure refresh token is returned
        });
    }

    public async getTokens(code: string): Promise<any> {
        const { tokens } = await this.oauth2Client.getToken(code);
        return tokens;
    }

    public setCredentials(refreshToken: string) {
        this.oauth2Client.setCredentials({ refresh_token: refreshToken });
    }

    public async createMeeting(
        summary: string,
        description: string,
        startTime: Date,
        durationMinutes: number = 60,
        attendees: string[] = []
    ): Promise<{ meetLink: string; eventId: string }> {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });

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

        const response = await calendar.events.insert({
            calendarId: 'primary',
            requestBody: event,
            conferenceDataVersion: 1, // Required to create Google Meet link
            sendUpdates: 'all', // Send emails to attendees
        });

        return {
            meetLink: response.data.hangoutLink || '',
            eventId: response.data.id || '',
        };
    }

    public async deleteEvent(eventId: string) {
        const calendar = google.calendar({ version: 'v3', auth: this.oauth2Client });
        try {
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: eventId,
            });
        } catch (error) {
            console.error('Error deleting Google Calendar event:', error);
            // Don't throw, just log. The local class deletion should proceed.
        }
    }
}
