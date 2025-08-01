# CultureCircle Vibes Hub

**AI-Powered Cultural Recommendations for Groups**  
Where shared tastes turn into unforgettable journeys

CultureCircle is a modern web application that leverages AI to provide personalized cultural recommendations for groups. Whether you're planning a trip, creating a playlist, or discovering new restaurants, CultureCircle analyzes your group's collective interests to suggest experiences that everyone will love.

## Features

### Core Functionality
- **Group-Based Recommendations**: Create groups and get AI-powered suggestions based on collective interests
- **Multi-Category Support**: Music artists, movies, books, travel destinations, TV shows, brands, places, people, podcasts, and video games
- **Smart Chat Interface**: Interactive AI assistant for planning and recommendations
- **Cultural Profile Management**: Build detailed profiles with your favorite cultural elements
- **Real-time Collaboration**: Share and discuss recommendations with group members

### User Experience
- **Beautiful Modern UI**: Gradient backgrounds, smooth animations, and responsive design
- **Dark/Light Mode**: Automatic theme switching with system preferences
- **Mobile-First Design**: Optimized for all device sizes
- **Intuitive Navigation**: Clean, accessible interface with clear user flows

### AI Integration
- **Google Gemini AI**: Advanced language model for natural conversation and recommendations
- **Qloo API**: Cultural intelligence platform for entity recognition and insights
- **Smart Aggregation**: Combines group member interests for optimal suggestions
- **Contextual Responses**: AI remembers conversation history and group preferences

### Technical Features
- **Real-time Chat Sessions**: Persistent chat history with local storage
- **Firebase Integration**: User authentication, data storage, and real-time updates
- **TypeScript**: Full type safety and better development experience
- **Vercel Deployment**: Serverless functions for API endpoints
- **Responsive Design**: Works seamlessly across all devices

## Quick Start

### Prerequisites
- Node.js 18+ 
- npm or yarn
- Firebase project
- Google Gemini API key
- Qloo API key (optional, for enhanced recommendations)

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/lakshsharda/culture-circle-vibes-hub.git
   cd culture-circle-vibes-hub
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Environment Setup**
   Create a `.env` file in the root directory:
   ```env
   # Firebase Configuration
   VITE_FIREBASE_API_KEY=your_firebase_api_key
   VITE_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
   VITE_FIREBASE_PROJECT_ID=your_project_id
   VITE_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
   VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
   VITE_FIREBASE_APP_ID=your_app_id

   # AI APIs
   VITE_GEMINI_API_KEY=your_gemini_api_key
   VITE_QLOO_API_KEY=your_qloo_api_key

   # Vercel (for production)
   FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account
   GEMINI_API_KEY=your_gemini_api_key
   QLOO_API_KEY=your_qloo_api_key
   ```

4. **Firebase Setup**
   - Create a Firebase project at [Firebase Console](https://console.firebase.google.com/)
   - Enable Authentication (Email/Password)
   - Create a Firestore database
   - Download your service account key and encode it as base64 for Vercel

5. **Start Development Server**
   ```bash
   npm run dev
   ```
   This starts both the Vite dev server and Vercel functions locally.

## Project Structure

```
culture-circle-vibes-hub/
├── api/                    # Vercel serverless functions
│   ├── recommend.ts       # Main recommendation API
│   └── recommendations.ts # Enhanced recommendation logic
├── public/                # Static assets
├── src/
│   ├── components/        # Reusable UI components
│   │   ├── ui/           # shadcn/ui components
│   │   └── Navbar.tsx    # Navigation component
│   ├── hooks/            # Custom React hooks
│   ├── lib/              # Utility libraries
│   │   ├── firebase.ts   # Firebase configuration
│   │   ├── gemini.ts     # Gemini AI integration
│   │   └── qloo.ts       # Qloo API integration
│   ├── pages/            # Application pages
│   │   ├── Home.tsx      # Landing page
│   │   ├── Dashboard.tsx # User dashboard
│   │   ├── Groups.tsx    # Group management
│   │   ├── Recommendations.tsx # AI chat interface
│   │   └── ...           # Other pages
│   └── main.tsx          # Application entry point
├── package.json          # Dependencies and scripts
├── vite.config.ts        # Vite configuration
└── vercel.json           # Vercel deployment config
```

## Usage Guide

### 1. Getting Started
1. **Sign Up**: Create an account with your email and password
2. **Build Your Profile**: Add your favorite music, movies, books, and travel destinations
3. **Create or Join Groups**: Connect with friends who share similar interests

### 2. Getting Recommendations
1. **Select a Group**: Choose from your groups in the recommendations page
2. **Choose Categories**: Select the types of recommendations you want (music, travel, food, etc.)
3. **Chat with AI**: Ask for specific recommendations or let the AI suggest based on your group's interests
4. **Save & Share**: Save interesting recommendations and share them with your group

### 3. Example Prompts
- "Plan a 3-day Tokyo trip for my group"
- "Create a playlist for our road trip"
- "Suggest restaurants for our foodie night"
- "What movies should we watch together?"
- "Find cultural activities for our weekend"

## Development

### Available Scripts
```bash
npm run dev          # Start development server with API
npm run dev:vite     # Start Vite dev server only
npm run dev:vercel   # Start Vercel functions only
npm run build        # Build for production
npm run build:dev    # Build for development
npm run lint         # Run ESLint
npm run preview      # Preview production build
```

### Tech Stack
- **Frontend**: React 18, TypeScript, Vite
- **UI Framework**: shadcn/ui, Tailwind CSS
- **Backend**: Vercel Serverless Functions
- **Database**: Firebase Firestore
- **Authentication**: Firebase Auth
- **AI**: Google Gemini, Qloo API
- **Deployment**: Vercel

### Key Dependencies
- `react-router-dom`: Client-side routing
- `firebase`: Backend services
- `@tanstack/react-query`: Data fetching and caching
- `lucide-react`: Icon library
- `class-variance-authority`: Component variants
- `tailwindcss-animate`: CSS animations

## Deployment

### Vercel Deployment
1. **Connect Repository**: Link your GitHub repository to Vercel
2. **Environment Variables**: Add all required environment variables in Vercel dashboard
3. **Deploy**: Vercel automatically deploys on push to main branch

### Environment Variables for Production
```env
FIREBASE_SERVICE_ACCOUNT_BASE64=your_base64_encoded_service_account
GEMINI_API_KEY=your_gemini_api_key
QLOO_API_KEY=your_qloo_api_key
```

## Contributing

1. **Fork the repository**
2. **Create a feature branch**: `git checkout -b feature/amazing-feature`
3. **Commit your changes**: `git commit -m 'Add amazing feature'`
4. **Push to the branch**: `git push origin feature/amazing-feature`
5. **Open a Pull Request**

### Development Guidelines
- Follow TypeScript best practices
- Use conventional commit messages
- Ensure responsive design works on all devices
- Add proper error handling
- Write meaningful commit messages

## API Documentation

### Main Endpoints

#### POST `/api/recommendations`
Get AI-powered recommendations for a group.

**Request Body:**
```json
{
  "groupId": "string",
  "categories": ["urn:entity:artist", "urn:entity:movie"],
  "type": "standard" | "itinerary"
}
```

**Response:**
```json
{
  "gemini": {
    "recommendation": "string",
    "alternative": "string", 
    "harmonyScore": 85,
    "vibeAnalysis": "string"
  }
}
```

#### POST `/api/recommend` (Legacy)
Simplified recommendation endpoint.

## Security

- Firebase Authentication for user management
- Environment variables for sensitive API keys
- Input validation and sanitization
- CORS configuration for API endpoints
- Rate limiting on AI API calls

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

### Common Issues

1. **Firebase Connection Error**
   - Verify environment variables are set correctly
   - Check Firebase project configuration
   - Ensure Firestore rules allow read/write access

2. **AI API Errors**
   - Verify API keys are valid and have sufficient quota
   - Check network connectivity
   - Review API rate limits

3. **Build Errors**
   - Clear node_modules and reinstall: `rm -rf node_modules && npm install`
   - Check TypeScript compilation: `npx tsc --noEmit`
   - Verify all dependencies are compatible


## Acknowledgments

- [shadcn/ui](https://ui.shadcn.com/) for the beautiful component library
- [Vercel](https://vercel.com/) for hosting and serverless functions
- [Firebase](https://firebase.google.com/) for backend services
- [Google Gemini](https://ai.google.dev/) for AI capabilities
- [Qloo](https://qloo.com/) for cultural intelligence data

---

**Made with ❤️ by the CultureCircle Team**
