# Home Monitoring Frontend

A real-time electrical monitoring dashboard built with Next.js, React, and TypeScript. This application provides live visualization of power consumption data from SDM230 energy meters.

## Tech Stack

- **Framework:** Next.js 14 (App Router)
- **Language:** TypeScript
- **UI:** React 18, Tailwind CSS, Radix UI
- **Charts:** Recharts, react-gauge-component
- **Data Export:** jsPDF, jspdf-autotable

## Features

- **Real-time Gauges:** Live voltage, current, power, and power factor displays
- **Power Charts:** Interactive line charts for power consumption over time
- **Energy Consumption:** Daily, weekly, and monthly energy usage visualization
- **Power Quality:** Frequency, power factor, and phase angle monitoring
- **Data Export:** Export readings to CSV or PDF format
- **Authentication:** JWT-based login with protected routes
- **WebSocket:** Real-time data updates via WebSocket connection

## Project Structure

```
src/
├── app/                    # Next.js App Router pages
│   ├── layout.tsx         # Root layout
│   ├── page.tsx           # Dashboard page
│   └── login/page.tsx     # Login page
├── components/
│   ├── auth/              # Authentication components
│   │   ├── AuthGuard.tsx  # Protected route wrapper
│   │   └── LoginForm.tsx  # Login form
│   ├── dashboard/         # Dashboard components
│   │   ├── Dashboard.tsx
│   │   ├── DataExport.tsx
│   │   ├── EnergyConsumptionCharts.tsx
│   │   ├── PowerQualityCharts.tsx
│   │   ├── RealtimeGauges.tsx
│   │   ├── RealtimePowerChart.tsx
│   │   └── SinglePhaseDashboard.tsx
│   └── ui/                # Reusable UI components
├── contexts/
│   └── AuthContext.tsx    # Authentication state management
├── hooks/
│   └── useWebSocket.ts    # WebSocket connection hook
├── lib/
│   ├── api.ts             # API client utilities
│   └── utils.ts           # Helper functions
└── types/                 # TypeScript type definitions
```

## Setup

### Prerequisites

- Node.js 18+ or Bun
- Running backend API server

### Installation

```bash
# Install dependencies
npm install
# or
bun install

# Set environment variables
cp .env.example .env.local
# Edit .env.local with your API endpoints

# Run development server
npm run dev
# or
bun dev
```

### Environment Variables

```env
NEXT_PUBLIC_API_BASE_URL=https://your-api-domain.com
NEXT_PUBLIC_WS_HOST=your-api-domain.com
```

## Build

```bash
# Production build
npm run build

# Start production server
npm start
```

## Docker

```bash
docker build -t homemonitoring-frontend .
docker run -p 3000:3000 homemonitoring-frontend
```

## Related Repositories

- [homemonitoring-backend](https://github.com/yourusername/homemonitoring-backend) - Django API & Data Logger
- [personal-infrastructure](https://github.com/yourusername/personal-infrastructure) - Docker & Traefik Configuration

## License

MIT
