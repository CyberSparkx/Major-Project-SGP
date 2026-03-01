# Major-Project-SGP

A robust Next.js application featuring intelligent data services including real-time weather monitoring and AI-powered news aggregation.

## 🚀 Features

### 🌤️ Weather Service

- **Real-time Data**: Fetches current weather conditions including temperature, humidity, wind, and visibility.
- **Air Quality Index (AQI)**: Monitors detailed air quality metrics (PM2.5, PM10, CO, NO2, etc.) adhering to US EPA standards.
- **Smart Forecasts**: Provides accurate sunrise and sunset times synchronized with the location's timezone.
- **Resilient Architecture**: Built with fallback mechanisms and comprehensive error handling.

### 📷 IoT Camera Service

- **Real-time Monitoring**: Standalone WebSocket server for live camera interactions.
- **AI Vision**: Analyzes camera feeds using Google Gemini to identify objects, activities, or anomalies.
- **Cloud Storage**: Securely uploads and manages camera captures via Cloudinary.
- **Command & Control**: Remote command execution for IoT devices with real-time feedback.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **AI/ML**: Google Gemini (via LangChain)
- **Data Fetching**: Axios, Cheerio
- **Real-time**: WebSockets (ws)
- **Media Management**: Cloudinary
- **Testing**: Jest, React Testing Library
- **Code Quality**: ESLint, Prettier, Husky

## 🏁 Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn

### Installation

1. **Clone the repository**

   ```bash
   git clone <repository-url>
   cd Major-Project-SGP
   ```

2. **Install all dependencies**
   This command installs dependencies for both the main app and the IoT camera module:

   ```bash
   npm install
   ```

   _Note: If you want to install them manually, you can run `npm run install-all`._

3. **Environment Setup**
   Create a `.env` file in the root directory with the following keys:

   ```env
   # Required for News & Vision Service
   GOOGLE_API_KEY=your_google_gemini_key

   # Required for Weather Service
   WEATHER_API_KEY=your_weatherapi_com_key

   # Required for IoT Camera Service
   CLOUDINARY_CLOUD_NAME=your_cloud_name
   CLOUDINARY_API_KEY=your_api_key
   CLOUDINARY_API_SECRET=your_api_secret
   ```

### Development

Run the development server (starts both Next.js and the IoT WebSocket server):

```bash
npm run dev
```

### Testing

Run the test suite:

```bash
npm test
```

### Linting & Formatting

Check for code quality issues:

```bash
npm run lint
```

Format code automatically:

```bash
npm run format
```

## 📁 Project Structure

```
├── app/                # Next.js App Router (Frontend + API)
├── iot-camera/         # Standalone IoT WebSocket Server
├── public/             # Static Assets
├── .husky/             # Git Hooks
└── ...
```

## 🤝 Contributing

1. Fork the project
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request
