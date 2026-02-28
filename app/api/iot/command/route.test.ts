/**
 * Tests for GET /api/iot/command and POST /api/iot/command
 *
 * We import the route handlers directly and test them as plain functions.
 */

import { GET, POST } from '@/app/api/iot/command/route';
import { iotState, setFlag } from '@/app/Server/iot/flagStore';
import { NextRequest } from 'next/server';

// ── Helpers ───────────────────────────────────────────────────────────────────

function makePostRequest(body: Record<string, unknown>): NextRequest {
    return new NextRequest('http://localhost:3000/api/iot/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    });
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe('GET /api/iot/command', () => {
    beforeEach(() => {
        setFlag(0); // reset to idle before each test
    });

    it('returns flag 0 when idle', async () => {
        const res = await GET();
        const data = await res.json() as { flag: number };
        expect(res.status).toBe(200);
        expect(data.flag).toBe(0);
    });

    it('returns flag 1 after a capture has been requested', async () => {
        setFlag(1);
        const res = await GET();
        const data = await res.json() as { flag: number };
        expect(res.status).toBe(200);
        expect(data.flag).toBe(1);
    });
});

describe('POST /api/iot/command', () => {
    beforeEach(() => {
        setFlag(0);
    });

    it('sets flag to 1 when action is "capture"', async () => {
        const req = makePostRequest({ action: 'capture' });
        const res = await POST(req);
        const data = await res.json() as { flag: number; message: string };

        expect(res.status).toBe(200);
        expect(data.flag).toBe(1);
        expect(data.message).toBe('Capture requested');
        expect(iotState.flag).toBe(1);
    });

    it('returns 409 when capture is already in progress', async () => {
        setFlag(1); // simulate an in-progress capture
        const req = makePostRequest({ action: 'capture' });
        const res = await POST(req);
        const data = await res.json() as { flag: number; message: string };

        expect(res.status).toBe(409);
        expect(data.flag).toBe(1);
        expect(data.message).toContain('already in progress');
    });

    it('returns 400 for an unknown action', async () => {
        const req = makePostRequest({ action: 'delete' });
        const res = await POST(req);
        const data = await res.json() as { error: string };

        expect(res.status).toBe(400);
        expect(data.error).toBeDefined();
    });

    it('defaults to "capture" action when no body is sent', async () => {
        // NextRequest with empty body that can't be parsed as JSON
        const req = new NextRequest('http://localhost:3000/api/iot/command', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: '{}',
        });
        const res = await POST(req);
        const data = await res.json() as { flag: number };
        // Empty body → action defaults to "capture"
        expect(res.status).toBe(200);
        expect(data.flag).toBe(1);
    });
});
