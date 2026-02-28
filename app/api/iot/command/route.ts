import { NextRequest, NextResponse } from 'next/server';
import { iotState, setFlag } from '@/app/Server/iot/flagStore';

/**
 * GET /api/iot/command
 *
 * IOT DEVICE polls this endpoint to check whether it should capture a photo.
 * Returns: { flag: 0 } → idle, { flag: 1 } → capture now
 *
 * Example IoT C++ code:
 *   HTTPClient http;
 *   http.begin(commandURL);
 *   int code = http.GET();
 *   String body = http.getString(); // parse JSON flag
 */
export async function GET(): Promise<NextResponse> {
    return NextResponse.json({ flag: iotState.flag });
}

/**
 * POST /api/iot/command
 *
 * BROWSER calls this when the user clicks the Capture button.
 * Sets flag to 1 so the IoT device knows to capture.
 * Returns: { flag: 1, message: "Capture requested" }
 */
export async function POST(req: NextRequest): Promise<NextResponse> {
    // Validate content-type for browser calls (optional body)
    const body = await req
        .json()
        .catch(() => ({})) as Record<string, unknown>;

    // Only set flag if currently idle (prevent double-press)
    if (iotState.flag === 1) {
        return NextResponse.json(
            { flag: 1, message: 'Capture already in progress' },
            { status: 409 }
        );
    }

    const action = (body.action as string) ?? 'capture';
    if (action !== 'capture') {
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    setFlag(1);
    console.log('[IoT] Flag set to 1 — capture requested');

    return NextResponse.json({ flag: 1, message: 'Capture requested' });
}
