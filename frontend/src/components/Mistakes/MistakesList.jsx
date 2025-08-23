// frontend/src/components/Mistakes/MistakesList.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Alert, Badge, Spinner, Toast, ToastContainer, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './MistakesList.css';

// Define API base URL - can be replaced with environment variable in production
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

export default function MistakesList({ standalone = false }) {
  const [mistakes, setMistakes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showToast, setShowToast] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastVariant, setToastVariant] = useState('success');
  const [filterLevel, setFilterLevel] = useState('all');
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Quiz modal state
  const [showQuizModal, setShowQuizModal] = useState(false);
  const [quizLevel, setQuizLevel] = useState('');
  
  const fetchMistakes = useCallback(async (level = 'all') => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError('');
      
      const response = await fetch(`http://localhost:5000/api/user/mistakes?level=${level}`, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMistakes(data.mistakes || []);
      } else {
        setError('無法載入錯誤記錄');
      }
    } catch (error) {
      console.error('Error fetching mistakes:', error);
      setError('網路錯誤，請重試。');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, isAuthenticated]);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchMistakes(filterLevel);
    }
  }, [isAuthenticated, fetchMistakes, filterLevel]);
  
  const handleFilterChange = (e) => {
    const level = e.target.value;
    setFilterLevel(level);
    // Immediately fetch mistakes for the selected level
    fetchMistakes(level);
  };
  
  // Handle starting a quiz with mistake words
  const handleStartQuiz = () => {
    setShowQuizModal(true);
    // Set the initial quiz level based on current filter if it's a specific level
    if (filterLevel !== 'all') {
      setQuizLevel(filterLevel);
    } else {
      setQuizLevel('');
    }
  };
  
  // Navigate to quiz with selected level and mode
  const startQuizWithMode = (mode, count) => {
    setShowQuizModal(false);
    // Navigate to quiz with the selected level and mode
    navigate('/quiz', { state: { level: quizLevel, mode: { type: mode, count } } });
  };
  
  const addToVocabulary = async (word, translation, level) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vocabulary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          word,
          translation,
          level,
          added_from: 'mistakes'
        })
      });
      
      if (response.ok) {
        // Show success toast
        setToastMessage(`「${word}」已成功新增至單字庫！`);
        setToastVariant('success');
        setShowToast(true);
      } else {
        const data = await response.json();
        setToastMessage(data.error || '新增單字失敗');
        setToastVariant('danger');
        setShowToast(true);
      }
    } catch (error) {
      console.error('Error adding word to vocabulary:', error);
      setToastMessage('網路錯誤，請重試');
      setToastVariant('danger');
      setShowToast(true);
    }
  };
  
  // Function to handle clearing mistakes - commented out for now as API endpoint doesn't exist yet
  // const handleClearMistakes = async () => {
  //   await fetchMistakes(filterLevel);
  // };
  
  const formatDate = (dateString) => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getLevelBadgeClass = (level) => {
    switch (level) {
      case 'LEVEL1': return 'level1-badge';
      case 'LEVEL2': return 'level2-badge';
      case 'LEVEL3': return 'level3-badge';
      case 'LEVEL4': return 'level4-badge';
      case 'LEVEL5': return 'level5-badge';
      case 'LEVEL6': return 'level6-badge';
      default: return 'level1-badge';
    }
  };
  
  // Level descriptions for future use in tooltips or expanded views
  // Currently not used but kept for future implementation
  // const getLevelDescription = (level) => {
  //   const descriptions = {
  //     'LEVEL1': '初級單字 - 基礎常用詞彙',
  //     'LEVEL2': '初中級單字 - 日常生活用語',
  //     'LEVEL3': '中級單字 - 一般閱讀所需',
  //     'LEVEL4': '中高級單字 - 進階表達能力',
  //     'LEVEL5': '高級單字 - 專業領域詞彙',
  //     'LEVEL6': '超高級單字 - 學術研究用詞'
  //   };
  //   return descriptions[level] || level;
  // };
  
  const getMistakesSummary = () => {
    if (!mistakes.length) return null;
    
    const totalMistakes = mistakes.length;
    const mistakesByLevel = {};
    let totalMissCount = 0;
    
    mistakes.forEach(mistake => {
      const level = mistake.level;
      if (!mistakesByLevel[level]) {
        mistakesByLevel[level] = 0;
      }
      mistakesByLevel[level]++;
      totalMissCount += mistake.miss_count;
    });
    
    return { totalMistakes, mistakesByLevel, totalMissCount };
  };
  
  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: standalone ? '100vh' : 'auto' }}>
        {standalone && <Header />}
        <div style={{ flex: 1 }}>
          <Container className="py-5 text-center">
            <Alert variant="warning">
              <Alert.Heading>需要登入</Alert.Heading>
              <p>請先登入以查看您的錯誤記錄。</p>
              <div className="d-grid gap-2 d-sm-flex justify-content-sm-center">
                <Button variant="primary" onClick={() => navigate('/')} size="lg">
                  返回首頁登入
                </Button>
              </div>
            </Alert>
          </Container>
        </div>
        {standalone && <Footer />}
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: standalone ? '100vh' : 'auto' }}>
        {standalone && <Header />}
        <div style={{ flex: 1 }}>
          <Container className="py-5 text-center">
            <div className="loading-spinner">
              <Spinner animation="border" variant="primary" />
              <p className="mt-3">載入錯誤記錄中...</p>
            </div>
          </Container>
        </div>
        {standalone && <Footer />}
      </div>
    );
  }
  
  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: standalone ? '100vh' : 'auto' }}>
        {standalone && <Header />}
        <div style={{ flex: 1 }}>
          <Container className="py-5 text-center">
            <Alert variant="danger">
              <Alert.Heading>載入失敗</Alert.Heading>
              <p>{error}</p>
              <Button variant="outline-danger" onClick={() => fetchMistakes(filterLevel)}>
                重試
              </Button>
            </Alert>
          </Container>
        </div>
        {standalone && <Footer />}
      </div>
    );
  }
  
  if (!mistakes || mistakes.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: standalone ? '100vh' : 'auto' }}>
        {standalone && <Header />}
        <div style={{ flex: 1 }}>
          <Container className="py-5 text-center">
            <Alert variant="info">
              <Alert.Heading>尚無錯誤記錄!</Alert.Heading>
              <p>當您在測驗中答錯題目時，錯誤會被記錄在這裡。</p>
              <div className="d-grid gap-2 d-sm-flex justify-content-sm-center mt-3">
                <Button variant="primary" as={Link} to="/" size="lg" className="me-2">
                  開始練習
                </Button>
                <Button variant="warning" onClick={handleStartQuiz} size="lg">
                  選擇難度測驗
                </Button>
              </div>
            </Alert>
          </Container>
        </div>
        {standalone && <Footer />}
      </div>
    );
  }

  const summary = getMistakesSummary();

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: standalone ? '100vh' : 'auto' }}>
      {standalone && (
        <Header 
          currentPage="mistakes" 
          onNavHome={() => navigate('/')} 
          onNavMistakes={() => {}} 
        />
      )}
      
      <div style={{ flex: 1 }} className="mistakes-container">
        <Container className="py-5">
          <Card className="shadow-sm mistakes-card">
            <Card.Body className="p-4">
              <div className="user-greeting">
                <h1 className="mistakes-title">錯誤單字記錄</h1>
                <p className="mistakes-subtitle">記住自己的錯誤，才能不斷進步！</p>
              </div>
              
              {summary && (
                <Row className="mb-4 mt-4">
                  <Col md={4} className="mb-3">
                    <div className="stat-circle">
                      <div className="stat-number">{summary.totalMistakes}</div>
                      <div className="stat-label">總錯誤單字數</div>
                    </div>
                  </Col>
                  
                  <Col md={4} className="mb-3">
                    <div className="stat-circle">
                      <div className="stat-number">{summary.totalMissCount}</div>
                      <div className="stat-label">總答錯次數</div>
                    </div>
                  </Col>
                  
                  <Col md={4} className="mb-3">
                    <div className="stat-circle">
                      <div className="stat-number">{Object.keys(summary.mistakesByLevel).length}</div>
                      <div className="stat-label">包含關卡數</div>
                    </div>
                  </Col>
                </Row>
              )}

              <div className="filter-container">
                <Row className="align-items-center mb-3">
                  <Col md={6}>
                    <h4>依難度級別篩選</h4>
                    <p className="text-muted mb-0">選擇指定級別查看錯誤</p>
                  </Col>
                  
                  <Col md={4} className="text-md-end mt-3 mt-md-0">
                    <Form.Select
                      className="select-level"
                      value={filterLevel}
                      onChange={handleFilterChange}
                    >
                      <option value="all">全部級別</option>
                      <option value="LEVEL1">LEVEL1 - 初級單字</option>
                      <option value="LEVEL2">LEVEL2 - 初中級單字</option>
                      <option value="LEVEL3">LEVEL3 - 中級單字</option>
                      <option value="LEVEL4">LEVEL4 - 中高級單字</option>
                      <option value="LEVEL5">LEVEL5 - 高級單字</option>
                      <option value="LEVEL6">LEVEL6 - 超高級單字</option>
                    </Form.Select>
                  </Col>
                  
                  <Col md={2} className="text-md-end mt-3 mt-md-0">
                    <Button 
                      variant="warning" 
                      className="px-4 w-100"
                      onClick={handleStartQuiz}
                    >
                      開始測驗
                    </Button>
                  </Col>
                </Row>
              </div>
              
              <Table responsive className="mistakes-table mt-4">
                <thead>
                  <tr>
                    <th>單字</th>
                    <th>中文翻譯</th>
                    <th>難度級別</th>
                    <th>錯誤次數</th>
                    <th>最近練習日期</th>
                    <th>操作</th>
                  </tr>
                </thead>
                <tbody>
                  {mistakes.map((mistake, idx) => (
                    <tr key={idx}>
                      <td className="word-cell">{mistake.word}</td>
                      <td className="translation-cell">{mistake.translation}</td>
                      <td>
                        <Badge className={`level-badge ${getLevelBadgeClass(mistake.level)}`}>{mistake.level}</Badge>
                      </td>
                      <td>
                        <Badge pill bg="danger" className="count-badge">
                          {mistake.miss_count}
                        </Badge>
                      </td>
                      <td className="last-practiced">{formatDate(mistake.last_practiced)}</td>
                      <td>
                        <Button 
                          variant="outline-success" 
                          size="sm" 
                          className="add-to-vocab-btn"
                          onClick={() => addToVocabulary(mistake.word, mistake.translation, mistake.level)}
                        >
                          <i className="bi bi-plus-circle me-1"></i> 加入單字庫
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </Table>
              
              <div className="text-center">
                <Button 
                  variant="outline-primary" 
                  className="refresh-button" 
                  onClick={() => fetchMistakes(filterLevel)}
                >
                  🔄 重新整理
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
      
      <ToastContainer position="bottom-end" className="p-3" style={{ zIndex: 1070 }}>
        <Toast 
          show={showToast} 
          onClose={() => setShowToast(false)} 
          delay={3000} 
          autohide
          bg={toastVariant}
        >
          <Toast.Header>
            <strong className="me-auto">{toastVariant === 'success' ? '成功' : '錯誤'}</strong>
          </Toast.Header>
          <Toast.Body className={toastVariant === 'success' ? 'text-white' : ''}>
            {toastMessage}
          </Toast.Body>
        </Toast>
      </ToastContainer>
      
      {/* Modal for starting a quiz */}
      <Modal show={showQuizModal} onHide={() => setShowQuizModal(false)} className="quiz-modal">
        <Modal.Header closeButton>
          <Modal.Title>選擇測驗模式</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>選擇單字難度：</p>
          <Form.Select
            className="mb-4"
            value={quizLevel}
            onChange={(e) => setQuizLevel(e.target.value)}
          >
            <option value="">請選擇難度...</option>
            <option value="LEVEL1">Level 1</option>
            <option value="LEVEL2">Level 2</option>
            <option value="LEVEL3">Level 3</option>
            <option value="LEVEL4">Level 4</option>
            <option value="LEVEL5">Level 5</option>
            <option value="LEVEL6">Level 6</option>
          </Form.Select>
          
          <p>選擇測驗模式：</p>
          <div className="d-grid gap-3">
            <Button 
              variant="primary" 
              size="lg"
              onClick={() => startQuizWithMode('endless')}
              disabled={!quizLevel}
            >
              無限模式
            </Button>
            
            <p className="text-center">或選擇題數：</p>
            
            <div className="d-flex justify-content-around">
              {[10, 20, 30, 50].map(count => (
                <Button
                  key={count}
                  variant="success"
                  onClick={() => startQuizWithMode('fixed', count)}
                  disabled={!quizLevel}
                >
                  {count} 題
                </Button>
              ))}
            </div>
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowQuizModal(false)}>
            取消
          </Button>
        </Modal.Footer>
      </Modal>

      {standalone && <Footer />}
    </div>
  );
}