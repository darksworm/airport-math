# ✈️ Airport Math - Planning Your Departure

A modern web application built with Svelte that helps you calculate the optimal departure time for your flight based on your location, selected airport, and travel preferences.

## 🚀 Features

- **Smart Location Detection**: Uses browser geolocation API to find your current position
- **Nearby Airport Discovery**: Finds airports near you using distance calculations
- **Multiple Transport Options**: Calculate travel times for driving, walking, cycling, and public transit
- **Real-time Route Calculation**: Integration with OSRM (Open Source Routing Machine) for accurate travel times
- **Intelligent Time Calculation**: Automatically calculates when to leave based on:
  - Flight departure time
  - Check-in buffer (2h domestic, 3h international)
  - Travel time to airport
  - Safety margin (15 minutes)
- **Responsive Design**: Works seamlessly on desktop and mobile devices
- **Real-time Updates**: Countdown timer shows time remaining until departure

## 🛠️ Technology Stack

### Core Framework
- **SvelteKit**: Modern web framework with server-side rendering
- **TypeScript**: Type-safe development
- **Vite**: Fast build tool and development server

### Data Sources & APIs
- **Browser Geolocation API**: For user location detection
- **OurAirports Dataset**: Open-source airport database with global coverage
- **OSRM (Open Source Routing Machine)**: For accurate routing and travel times
- **OpenStreetMap Data**: Powers the routing calculations

### Architecture
- **Component-based**: Modular Svelte components for reusability
- **Store Pattern**: Centralized state management for location data
- **Service Layer**: Separate services for airports, routing, and calculations
- **Type-safe**: Full TypeScript coverage for better developer experience

## 📱 How It Works

1. **Location Detection**: App detects your current location using the browser's geolocation API
2. **Airport Discovery**: Finds nearby airports and ranks them by distance
3. **Flight Input**: Enter your flight time and specify if it's international
4. **Transport Selection**: Choose your preferred method of transportation
5. **Route Calculation**: Calculates travel time using real routing data
6. **Departure Time**: Shows exactly when you need to leave

### Calculation Formula

```
leave_time = flight_time - (travel_time + check_in_buffer + safety_margin)
```

Where:
- `check_in_buffer` = 2 hours (domestic) or 3 hours (international)
- `safety_margin` = 15 minutes
- `travel_time` = Calculated via OSRM routing engine

## 🏗️ Project Structure

```
src/
├── lib/
│   ├── components/          # Reusable Svelte components
│   │   ├── LocationSelector.svelte
│   │   ├── AirportSelector.svelte
│   │   ├── FlightForm.svelte
│   │   ├── TransportSelector.svelte
│   │   └── DepartureResults.svelte
│   ├── services/           # Business logic services
│   │   ├── airports.ts     # Airport data and search
│   │   ├── routing.ts      # OSRM integration and travel times
│   │   └── departure.ts    # Departure time calculations
│   ├── stores/             # Svelte stores for state management
│   │   └── location.ts     # Location state management
│   ├── types/              # TypeScript type definitions
│   │   └── airport.ts      # Core data types
│   └── utils/              # Utility functions
│       └── distance.ts     # Haversine distance calculations
├── routes/                 # SvelteKit pages
│   ├── +layout.svelte      # App layout and global styles
│   └── +page.svelte        # Main application page
└── app.html               # HTML template
```

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- npm or yarn

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Open your browser and navigate to `http://localhost:5173`

### Building for Production

```bash
npm run build
```

### Type Checking

```bash
npm run check
```

## 🌍 Data Sources

### Airport Data
Currently using a curated list of major international airports. In a production environment, this would be replaced with:
- **OurAirports Dataset**: https://ourairports.com/data/
- **OpenFlights Airport Database**: https://openflights.org/data.html

### Routing Data
- **OSRM Demo Server**: Used for development (https://router.project-osrm.org)
- **Production**: Should host your own OSRM instance with OpenStreetMap data

## 🔧 Configuration

### Environment Variables
- None required for basic functionality
- For production, configure your own OSRM server endpoint

### Customization
- **Check-in Times**: Modify buffer times in `src/lib/services/departure.ts`
- **Safety Margin**: Adjust safety buffer in departure calculations
- **Airport List**: Replace sample data with full OurAirports dataset
- **Transport Modes**: Add or modify transport options in `src/lib/services/routing.ts`

## 🎯 Future Enhancements

- **Real Flight Data**: Integration with flight APIs (AviationStack, FlightAware)
- **Live Traffic Data**: Real-time traffic conditions
- **Airport-specific Buffers**: Custom check-in times for specific airports
- **Public Transit**: Integration with transit APIs for better public transport routing
- **Historical Data**: Learn from user feedback to improve predictions
- **Notifications**: Push notifications for departure reminders
- **Offline Support**: PWA capabilities for offline usage

## 📜 Implementation Notes

This project demonstrates the implementation described in the "Airport Math – Planning Your Departure" guide, using open-source tools and datasets as recommended:

- ✅ Browser geolocation API for user location
- ✅ Distance-based airport discovery using Haversine formula
- ✅ OSRM integration for routing and travel times
- ✅ Configurable check-in buffers (2h/3h)
- ✅ Modern Svelte/TypeScript architecture
- ✅ Mobile-responsive design
- ✅ Free and open-source stack

## 🙏 Acknowledgments

- **OurAirports**: For providing open airport data
- **OpenStreetMap**: For global mapping data
- **OSRM**: For open-source routing engine
- **Svelte Team**: For the excellent framework
- **Aviation Community**: For check-in time guidelines

---

Built with 💙 using modern web technologies and open-source data.
