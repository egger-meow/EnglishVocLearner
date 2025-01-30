// frontend/src/App.jsx
import React, { useState } from 'react';
import Header from './components/Header/Header';
import Footer from './components/Footer/Footer';
import LevelSelect from './components/LevelSelect/LevelSelect';
import Quiz from './components/Quiz/Quiz';

function App() {
  const [selectedLevel, setSelectedLevel] = useState(null);

  const handleLevelSelect = (level) => {
    setSelectedLevel(level);
  };

  const handleBack = () => {
    setSelectedLevel(null);
  };

  return (
    // 1) The top-level container uses flex layout
    <div style={{ 
      display: 'flex', 
      flexDirection: 'column', 
      minHeight: '100vh' 
    }}>
      <Header />

      {/* 2) The "main" area that grows/shrinks, pushing Footer to bottom if content is short */}
      <div style={{ flex: 1 }}>
        {!selectedLevel ? (
          <LevelSelect onLevelSelect={handleLevelSelect} />
        ) : (
          <Quiz level={selectedLevel} onBack={handleBack} />
        )}
      </div>

      <Footer />
    </div>
  );
}

export default App;
