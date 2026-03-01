/**
 * app/Server/iot/flagStore.ts
 *
 * In-memory shared state for the IoT capture flag and the last uploaded image.
 * This module-level singleton persists for the life of the Next.js dev process.
 *
 * flag = 0 → idle (IoT device should do nothing / button enabled)
 * flag = 1 → capture requested (IoT device should capture and upload)
 */

export interface IotState {
    flag: 0 | 1;
    lastImageUrl: string | null;
    lastPublicId: string | null;
}

// Attach to globalThis so Hot Module Replacement doesn't reset the state in dev.
const g = globalThis as typeof globalThis & { __iotState?: IotState };

if (!g.__iotState) {
    g.__iotState = {
        flag: 0,
        lastImageUrl: null,
        lastPublicId: null,
    };
}

export const iotState: IotState = g.__iotState;

export function setFlag(value: 0 | 1): void {
    iotState.flag = value;
}

export function setLastImage(url: string, publicId: string): void {
    iotState.lastImageUrl = url;
    iotState.lastPublicId = publicId;
}

export function clearLastImage(): void {
    iotState.lastImageUrl = null;
    iotState.lastPublicId = null;
}
