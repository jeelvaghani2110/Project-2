# Tourist Destination Recommender Frontend

A React-based single-page application for finding personalized tourist destination recommendations.

## Features

- 🔍 Advanced search form with multiple criteria
- 📱 Responsive design (mobile-first)
- 🎯 Real-time API integration with fallback options
- 💾 Save destinations to local storage
- 🔄 Client-side sorting and filtering
- ♿ Keyboard accessible interface
- 🌐 Offline demo mode with sample data

## Quick Start

\`\`\`bash
# Install dependencies
npm install

# Start development server
npm start
\`\`\`

The app will open at `http://localhost:3000`

## Configuration

### Backend URL
Change the backend base URL in `src/api.js`:

\`\`\`javascript
const BASE_URL = 'http://127.0.0.1:8000'; // Change this to your backend URL
\`\`\`

### API Endpoints

The app expects these backend endpoints:

- `GET /encoders` - Returns dropdown options
- `GET /states?country=India` - Returns Indian states (optional)
- `POST /recommend` - Returns destination recommendations

## API Request/Response Format

### Request Example
\`\`\`json
{
  "Location": "India",
  "State": "Goa",
  "Climate": "Tropical",
  "BudgetLevel": "Low",
  "AvgCostINR": 12000,
  "PopularityScore": 85,
  "AvgTempC": 28,
  "Rating": 4.5,
  "SafetyIndex": 8.0,
  "Accessibility": "Easy",
  "TransportCostINR": 4000
}
\`\`\`

### Response Example
\`\`\`json
[
  {
    "Destination": "Destination_12",
    "Country": "India",
    "State": "Goa",
    "SourceCity": "Pune",
    "Climate": "Tropical",
    "BudgetLevel": "Low",
    "AvgCostINR": 10536.19,
    "Activities": "Beaches",
    "Rating": 4.7,
    "SafetyIndex": 8.1,
    "TransportCostINR": 2500
  }
]
\`\`\`

## Project Structure

\`\`\`
src/
├── components/
│   ├── Header.jsx          # App header
│   ├── SearchForm.jsx      # Search form with validation
│   ├── ResultsGrid.jsx     # Results display with sorting
│   └── Loader.jsx          # Loading spinner
├── api.js                  # API integration functions
├── App.jsx                 # Main app component
├── index.jsx               # React DOM render
└── styles.css              # Responsive CSS styles

public/
├── sample_data.json        # Offline demo data
└── index.html              # HTML template
\`\`\`

## Form Fields

All form fields match the backend schema:

- **Location**: India / Outside India (required)
- **State**: Indian states dropdown (when India selected)
- **Climate**: Tropical, Temperate, Arid, etc. (required)
- **BudgetLevel**: Low, Medium, High (required)
- **AvgCostINR**: Average cost in INR (required)
- **PopularityScore**: 0-100 slider
- **AvgTempC**: Average temperature in Celsius (required)
- **Rating**: 0-5 slider
- **SafetyIndex**: Safety rating 0-10 (required)
- **Accessibility**: Easy, Moderate, Difficult (required)
- **TransportCostINR**: Transport cost in INR (required)
- **top_k**: Number of results (default: 10)

## Features

### Fallback Handling
- If `/encoders` endpoint fails, uses hardcoded dropdown options
- If `/states` endpoint fails, uses predefined Indian states list
- Sample data available in `public/sample_data.json` for offline testing

### Local Storage
- Saves user's favorite destinations
- Persists across browser sessions
- Shows saved status on destination cards

### Responsive Design
- Mobile-first CSS approach
- Grid layouts adapt to screen size
- Touch-friendly interface elements

### Accessibility
- Keyboard navigation support
- ARIA labels and roles
- Screen reader friendly
- High contrast colors

## Browser Support

- Chrome 60+
- Firefox 60+
- Safari 12+
- Edge 79+

## Development

### Available Scripts

- `npm start` - Development server
- `npm build` - Production build
- `npm test` - Run tests
- `npm eject` - Eject from Create React App

### Dependencies

- React 18.2+
- No external UI frameworks
- Plain CSS (no preprocessors)
- Fetch API (no axios)

## Deployment

Build the app for production:

\`\`\`bash
npm run build
\`\`\`

The `build` folder contains the optimized production files ready for deployment.
