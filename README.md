# English Vocabulary Learner 📚

A comprehensive web application for English vocabulary learning, featuring interactive quizzes, personalized vocabulary management, and detailed learning analytics.

## 🎯 Project Overview

This application was developed as a side project to support a senior colleague (學長) who creates online courses and is planning to publish vocabulary learning materials. The project serves as both a practical learning tool and a demonstration of modern full-stack web development skills.

## ✨ Key Features

### 🧠 Smart Quiz System
- **Multiple Difficulty Levels**: 6 progressive levels (LEVEL1-LEVEL6) from basic to advanced vocabulary
- **Adaptive Learning**: Questions adapt based on user performance and mistakes
- **Multiple Quiz Modes**: 
  - Endless practice mode
  - Fixed-count sessions (10, 20, 30, 50 questions)
  - Personal vocabulary review mode

### 👤 User Management
- **Secure Authentication**: JWT-based login system with session management
- **Activation Code System**: Controlled user registration for course participants
- **User Profiles**: Personalized learning experience with progress tracking

### 📊 Learning Analytics
- **Comprehensive Statistics**: Track accuracy rates, words practiced, and learning streaks
- **Level-wise Performance**: Detailed breakdown of performance across difficulty levels
- **Visual Progress Tracking**: Interactive charts and progress bars
- **Learning Recommendations**: Personalized study suggestions based on performance

### 📖 Personal Vocabulary Library
- **Smart Word Collection**: Automatically save missed words from quizzes
- **Manual Word Addition**: Search and add words from the system database
- **Personal Notes**: Add custom notes, examples, and memory aids for each word
- **Review Tracking**: Monitor when words were last reviewed
- **Search & Filter**: Advanced search with suggestions and level filtering

### 📝 Mistake Tracking
- **Error Analysis**: Detailed tracking of incorrect answers
- **Retry Opportunities**: Practice specific mistake words
- **Progress Monitoring**: See improvement over time on previously missed words

## 🛠️ Technical Stack

### Frontend
- **React 18** with functional components and hooks
- **React Router** for client-side routing
- **React Bootstrap** for responsive UI components
- **Custom CSS** for enhanced styling and animations
- **Context API** for state management (Auth, Mistakes, Stats)

### Backend
- **Python Flask** with RESTful API architecture
- **SQLite** database for development, easily scalable to PostgreSQL
- **JWT Authentication** for secure session management
- **CORS** configured for frontend-backend communication

### Development & Deployment
- **Modular Architecture**: Clean separation of concerns
- **Centralized API Configuration**: Easy environment switching
- **Responsive Design**: Mobile-first approach
- **Error Handling**: Comprehensive error boundaries and user feedback
- **Production Ready**: Deployed on Render with environment-based configuration

## 📁 Project Structure

```
EnglishVocLearner/
├── frontend/                 # React frontend application
│   ├── public/              # Static assets
│   ├── src/
│   │   ├── components/      # Reusable React components
│   │   │   ├── Auth/       # Authentication components
│   │   │   ├── Quiz/       # Quiz functionality
│   │   │   ├── Vocabulary/ # Vocabulary management
│   │   │   ├── Mistakes/   # Error tracking
│   │   │   └── UserStats/  # Analytics dashboard
│   │   ├── context/        # React Context providers
│   │   ├── config/         # API configuration
│   │   └── services/       # API service functions
├── backend/                 # Flask backend API
│   ├── app/
│   │   ├── models/         # Database models
│   │   ├── routes/         # API endpoints
│   │   └── services/       # Business logic
│   └── requirements.txt    # Python dependencies
└── README.md               # Project documentation
```

## 🚀 Key Technical Achievements

### 🔧 Clean Architecture
- **Component-based Design**: Modular, reusable React components
- **Custom Hooks**: Efficient state management and API calls
- **Centralized Configuration**: Environment-aware API management
- **Error Boundaries**: Graceful error handling and user experience

### 📱 User Experience
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **Real-time Feedback**: Instant quiz results and progress updates
- **Intuitive Navigation**: Clean, accessible interface design
- **Progressive Enhancement**: Features that work across different browsers

### ⚡ Performance Optimization
- **Lazy Loading**: Efficient component rendering
- **Debounced Search**: Optimized search functionality
- **Caching Strategy**: Smart data fetching and storage
- **Optimistic Updates**: Smooth user interactions

### 🔒 Security & Best Practices
- **JWT Authentication**: Secure token-based authentication
- **Input Validation**: Frontend and backend validation layers
- **SQL Injection Prevention**: Parameterized queries
- **CORS Configuration**: Proper cross-origin resource sharing

## 🎓 Educational Context

This application was created to support online English learning courses. The system allows instructors to:
- Monitor student progress across different vocabulary levels
- Identify common learning challenges through mistake analysis
- Provide personalized learning recommendations
- Track engagement and learning patterns

## 🌟 Skills Demonstrated

### Frontend Development
- Modern React patterns with hooks and context
- Responsive web design with Bootstrap
- State management and component lifecycle
- API integration and error handling
- User interface design and accessibility

### Backend Development
- RESTful API design and implementation
- Database design and optimization
- Authentication and authorization
- Error handling and logging
- API documentation and testing

### Full-Stack Integration
- Frontend-backend communication
- Authentication flow implementation
- Real-time data synchronization
- Environment configuration management
- Deployment and production optimization

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- Python 3.8+
- Git

### Frontend Setup
```bash
cd frontend
npm install
npm start
```

### Backend Setup
```bash
cd backend
pip install -r requirements.txt
python run.py
```

### Environment Configuration
The application automatically switches between development and production APIs:
- **Development**: `http://127.0.0.1:5000`
- **Production**: `https://englishvoclearner-backend.onrender.com`

## 🔧 API Configuration

The application uses a centralized API configuration system located in `frontend/src/config/api.js`. This allows for:
- Easy environment switching
- Consistent endpoint management
- Simplified maintenance and updates
- Type-safe API calls

## 📈 Future Enhancements

- **Spaced Repetition**: Implement spaced repetition algorithms for optimal learning
- **Audio Pronunciation**: Add text-to-speech for word pronunciation
- **Social Features**: Leaderboards and peer comparison
- **Advanced Analytics**: Machine learning-based learning recommendations
- **Mobile App**: React Native version for iOS and Android
- **Offline Mode**: Progressive Web App capabilities for offline learning

## 🤝 Contributing

This project showcases modern web development practices and is designed to demonstrate technical proficiency in full-stack development. The codebase emphasizes:
- Clean, maintainable code
- Comprehensive documentation
- User-centered design
- Scalable architecture
- Best practices in security and performance

## 📄 License

This project is developed as a portfolio demonstration and educational tool.

---

**Created by**: A passionate full-stack developer showcasing modern web development skills  
**Purpose**: Side project supporting online education and demonstrating technical expertise  
**Tech Stack**: React, Flask, SQLite, Bootstrap, JWT Authentication  
**Deployment**: Production-ready with environment-based configuration
