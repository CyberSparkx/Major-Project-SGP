# 📸 IoT Camera — Postman Testing Guide

This guide explains how to manually test the IoT camera feature using Postman.

## ⚙️ Setup
1. **Cloudinary**: Ensure `CLOUDINARY_CLOUD_NAME`, `API_KEY`, and `API_SECRET` are set in your `.env`.
2. **Start Servers**: Run `npm run dev` from the project root. This starts both the Next.js app (3000) and the WebSocket server (3001).
3. **Open Browser**: Go to `http://localhost:3000/iot-camera` to see the live UI.

---

## 1. WebSocket Live Test
Postman supports WebSockets!
- **New** -> **WebSocket Request**
- **URL**: `ws://localhost:3001`
- **Click Connect**
- **Expected**: You should see a message `{"type":"connected","message":"WebSocket ready"}`. Leave this tab open.

---

## 2. Check Command Flag (Polling)
Simulates the IoT device checking if it needs to take a photo.
- **Method**: `GET`
- **URL**: `http://localhost:3000/api/iot/command`
- **Expected**: `{"flag": 0}` (Idle)

---

## 3. Trigger Capture (Simulate Button Click)
Simulates the user clicking the "Capture" button in the browser.
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/iot/command`
- **Body**: `raw` -> `JSON`
```json
{
  "action": "capture"
}
```
- **Action**: Check `GET /api/iot/command` again. It returns `{"flag": 1}`.

---

## 4. Upload Image (Simulate IoT Device)
Simulates the IoT device sending the photo to the server.
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/iot/upload`
- **Body**: `form-data`
- **Key**: `image` (Change type from Text to **File**)
- **Value**: Select any `.jpg` or `.png` from your computer.
- **Expected**: 
    - Success JSON response with the Cloudinary URL.
    - **WebSocket Tab**: You should see a message with `type: "image"` and the URL.
    - **Browser**: The image should automatically pop up on the page.

---

## 5. AI Analyze
Analyze the captured image with Gemini.
- **Method**: `POST`
- **URL**: `http://localhost:3000/api/iot/analyze`
- **Body**: `raw` -> `JSON`
```json
{
  "imageUrl": "PASTE_THE_URL_FROM_PREVIOUS_STEP",
  "prompt": "What is in this image? Provide detailed findings."
}
```
- **Expected**: AI-generated text response.

---

## 📡 IoT Device URLs for Code
Use these in your ESP32 or Arduino code:
```cpp
const char* commandURL = "http://<YOUR_IP>:3000/api/iot/command";
const char* uploadURL  = "http://<YOUR_IP>:3000/api/iot/upload";
```
*(Replace `<YOUR_IP>` with your local machine IP)*
