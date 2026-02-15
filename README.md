# Major-Project-SGP

A robust Next.js application featuring intelligent data services including real-time weather monitoring and AI-powered news aggregation.

## 🚀 Features

### 🌤️ Weather Service

- **Real-time Data**: Fetches current weather conditions including temperature, humidity, wind, and visibility.
- **Air Quality Index (AQI)**: Monitors detailed air quality metrics (PM2.5, PM10, CO, NO2, etc.) adhering to US EPA standards.
- **Smart Forecasts**: Provides accurate sunrise and sunset times synchronized with the location's timezone.
- **Resilient Architecture**: Built with fallback mechanisms and comprehensive error handling.

### 📰 AI News Aggregator

- **Smart Scraping**: Fetches latest news on specific topics from across the web.
- **AI Summarization**: Uses Google's Gemini models to generate concise, readable summaries of complex news articles.
- **Source Transparency**: Provides direct links to original sources for verification.

## 🛠️ Tech Stack

- **Framework**: [Next.js 16](https://nextjs.org/) (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4
- **AI/ML**: Google Gemini (via LangChain)
- **Data Fetching**: Axios, Cheerio
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

2. **Install dependencies**

   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory with the following keys:

   ```env
   # Required for News Service
   GOOGLE_API_KEY=your_google_gemini_key

   # Required for Weather Service
   WEATHER_API_KEY=your_weatherapi_com_key
   ```

### Development

Run the development server:

```bash
npm run dev
```

### Testing

Run the test suite to ensure all services are functioning correctly:

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
├── app/
│   ├── api/            # API Route Handlers
│   ├── Server/         # Business Logic & Services
│   └── ...
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
