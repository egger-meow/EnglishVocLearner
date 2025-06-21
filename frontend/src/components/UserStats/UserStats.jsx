// frontend/src/components/UserStats/UserStats.jsx

import React, { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { Container, Row, Col, Card, Button, Alert, ProgressBar, Badge, Navbar, Nav } from 'react-bootstrap';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './UserStats.css';

const UserStats = () => {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { getAuthHeaders, isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const fetchUserStats = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetch('http://localhost:5000/api/user/stats', {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
      });

      if (response.ok) {
        const data = await response.json();
        setStats(data);
        setError('');
      } else {
        setError('無法載入統計資料');
      }
    } catch (error) {
      console.error('Error fetching stats:', error);
      setError('網路錯誤，請重試。');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    if (isAuthenticated) {
      fetchUserStats();
    }
  }, [isAuthenticated, fetchUserStats]);

  const calculateOverallStats = () => {
    if (!stats?.level_stats?.length) return null;

    const totalWords = stats.level_stats.reduce((sum, level) => sum + level.words_practiced, 0);
    const totalCorrect = stats.level_stats.reduce((sum, level) => sum + level.total_correct, 0);
    const totalIncorrect = stats.level_stats.reduce((sum, level) => sum + level.total_incorrect, 0);
    const totalAnswers = totalCorrect + totalIncorrect;
    const overallAccuracy = totalAnswers > 0 ? (totalCorrect / totalAnswers * 100) : 0;
    
    // Calculate study streak (days)
    const studyDays = stats.study_days || 0;
    
    // Calculate estimated vocabulary size
    const estimatedVocabSize = Math.round(totalCorrect * 1.2);

    return {
      totalWords,
      totalCorrect,
      totalIncorrect,
      totalAnswers,
      overallAccuracy,
      studyDays,
      estimatedVocabSize
    };
  };

  // Get current date in Taiwan format
  const getCurrentDateTW = () => {
    const options = { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    };
    return new Date().toLocaleDateString('zh-TW', options);
  };

  // Calculate grade based on accuracy
  const getGrade = (accuracy) => {
    if (accuracy >= 90) return { grade: 'A', color: '#28a745', description: '優秀' };
    if (accuracy >= 80) return { grade: 'B', color: '#20c997', description: '良好' };
    if (accuracy >= 70) return { grade: 'C', color: '#17a2b8', description: '普通' };
    if (accuracy >= 60) return { grade: 'D', color: '#fd7e14', description: '需加強' };
    return { grade: 'F', color: '#dc3545', description: '需大幅改進' };
  };

  // Get level description in Chinese
  const getLevelDescription = (level) => {
    const descriptions = {
      'LEVEL1': '初級單字 - 基礎常用詞彙',
      'LEVEL2': '初中級單字 - 日常生活用語',
      'LEVEL3': '中級單字 - 一般閱讀所需',
      'LEVEL4': '中高級單字 - 進階表達能力',
      'LEVEL5': '高級單字 - 專業領域詞彙',
      'LEVEL6': '超高級單字 - 學術研究用詞'
    };
    return descriptions[level] || `${level} 單字`;
  };

  // Get study recommendation based on performance
  const getStudyRecommendation = (accuracy, level) => {
    if (accuracy < 60) {
      return {
        type: 'warning',
        message: `建議：${level} 需要更多練習來鞏固基礎。建議每天練習 15-20 分鐘。`
      };
    } else if (accuracy < 80) {
      return {
        type: 'info',
        message: `建議：${level} 表現不錯！繼續練習以提高熟練度，可以嘗試增加練習時間。`
      };
    } else {
      return {
        type: 'success',
        message: `建議：${level} 掌握得很好！可以嘗試挑戰更高級別的單字了。`
      };
    }
  };

  const overallStats = calculateOverallStats();

  if (!isAuthenticated) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <div style={{ flex: 1 }}>
          <Container className="py-5">
            <Card className="shadow-sm">
              <Card.Body className="text-center p-5">
                <h2 className="mb-4">📊 學習統計資料</h2>
                <Alert variant="info">
                  <Alert.Heading>需要登入</Alert.Heading>
                  <p className="mb-0">請先登入或註冊帳號才能查看您的學習進度。</p>
                </Alert>
                <div className="mt-4">
                  <Link to="/" className="btn btn-primary">
                    返回首頁
                  </Link>
                </div>
              </Card.Body>
            </Card>
          </Container>
        </div>
        <Footer />
      </div>
    );
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <div style={{ flex: 1 }}>
          <Container className="py-5">
            <Card className="shadow-sm">
              <Card.Body className="text-center p-5">
                <h2 className="mb-4">📊 學習統計資料</h2>
                <div className="loading-spinner">
                  <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">載入中...</span>
                  </div>
                  <p className="mt-3">載入您的學習統計資料中...</p>
                </div>
              </Card.Body>
            </Card>
          </Container>
        </div>
        <Footer />
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <div style={{ flex: 1 }}>
          <Container className="py-5">
            <Card className="shadow-sm">
              <Card.Body className="text-center p-5">
                <h2 className="mb-4">📊 學習統計資料</h2>
                <Alert variant="danger">
                  <Alert.Heading>載入錯誤</Alert.Heading>
                  <p>{error}</p>
                </Alert>
                <Button 
                  variant="primary" 
                  onClick={fetchUserStats} 
                  className="mt-3"
                >
                  重試
                </Button>
              </Card.Body>
            </Card>
          </Container>
        </div>
        <Footer />
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <Navbar bg="primary" variant="dark" expand="lg" className="px-3">
        <Container fluid>
          <Navbar.Brand as={Link} to="/">
            賽琳娘基本英文單字測驗
          </Navbar.Brand>

          <Navbar.Toggle aria-controls="basic-navbar-nav" />
          <Navbar.Collapse id="basic-navbar-nav">
            <Nav className="me-auto">
              <Nav.Link as={Link} to="/">
                首頁
              </Nav.Link>
              <Nav.Link as={Link} to="/mistakes">
                錯誤單字紀錄
              </Nav.Link>
              <Nav.Link as={Link} to="/stats" active>
                學習統計
              </Nav.Link>
            </Nav>

            <Nav className="ms-auto">
              {isAuthenticated ? (
                <>
                  <Navbar.Text className="me-3">
                    歡迎, {user?.username}!
                  </Navbar.Text>
                  <Button variant="outline-light" onClick={() => logout()}>
                    登出
                  </Button>
                </>
              ) : (
                <Button variant="outline-light" onClick={() => navigate('/')}>
                  登入/註冊
                </Button>
              )}
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <div style={{ flex: 1 }}>
        <Container className="py-5">
          <Card className="shadow-sm main-stats-card">
            <Card.Body>
              <div className="user-greeting mb-4">
                <h2 className="stats-title">📊 {user?.username} 的學習統計</h2>
                <p className="current-date text-muted">{getCurrentDateTW()}</p>
              </div>

              {overallStats && (
                <Card className="mb-4 overall-stats-card">
                  <Card.Header as="h3" className="text-center bg-primary text-white">
                    整體學習概況
                  </Card.Header>
                  <Card.Body>
                    <Row className="stats-summary text-center">
                      <Col md={3} className="mb-3">
                        <div className="stat-circle">
                          <div className="stat-number text-primary">{overallStats.totalWords}</div>
                          <div className="stat-label">已練習單字</div>
                        </div>
                      </Col>
                      <Col md={3} className="mb-3">
                        <div className="stat-circle">
                          <div className="stat-number text-success">{overallStats.overallAccuracy.toFixed(1)}%</div>
                          <div className="stat-label">整體正確率</div>
                        </div>
                      </Col>
                      <Col md={3} className="mb-3">
                        <div className="stat-circle">
                          <div className="stat-number text-info">{overallStats.estimatedVocabSize}</div>
                          <div className="stat-label">預估詞彙量</div>
                        </div>
                      </Col>
                      <Col md={3} className="mb-3">
                        <div className="stat-circle">
                          <div className="stat-number text-warning">{overallStats.studyDays}</div>
                          <div className="stat-label">學習天數</div>
                        </div>
                      </Col>
                    </Row>

                    <Row className="mt-4">
                      <Col md={6} className="mb-3">
                        <Card className="h-100 border-success">
                          <Card.Body className="text-center">
                            <h5 className="text-success">✅ 答對題數</h5>
                            <h3 className="text-success">{overallStats.totalCorrect}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                      <Col md={6} className="mb-3">
                        <Card className="h-100 border-danger">
                          <Card.Body className="text-center">
                            <h5 className="text-danger">❌ 答錯題數</h5>
                            <h3 className="text-danger">{overallStats.totalIncorrect}</h3>
                          </Card.Body>
                        </Card>
                      </Col>
                    </Row>
                  </Card.Body>
                </Card>
              )}

              {stats?.level_stats?.length > 0 ? (
                <div className="level-stats">
                  <h3 className="level-stats-title mb-4">各級別學習進度</h3>
                  {stats.level_stats.map((level, index) => {
                    const accuracy = ((level.total_correct / (level.total_correct + level.total_incorrect)) * 100) || 0;
                    const grade = getGrade(accuracy);
                    const levelDescription = getLevelDescription(level.level);
                    const studyRecommendation = getStudyRecommendation(accuracy, levelDescription);
                    
                    return (
                      <Card key={index} className="mb-3 level-card">
                        <Card.Header>
                          <div className="d-flex justify-content-between align-items-center">
                            <h4 className="mb-0">{levelDescription}</h4>
                            <Badge 
                              style={{ backgroundColor: grade.color }} 
                              className="grade-badge fs-6"
                            >
                              {grade.grade}級 - {grade.description}
                            </Badge>
                          </div>
                        </Card.Header>
                        <Card.Body>
                          <div className="level-accuracy mb-3">
                            <span className="accuracy-label fw-bold">正確率: </span>
                            <span className="accuracy-value fs-5" style={{ color: grade.color }}>
                              {accuracy.toFixed(1)}%
                            </span>
                          </div>
                          
                          <ProgressBar 
                            now={accuracy} 
                            variant={accuracy >= 70 ? "success" : accuracy >= 60 ? "warning" : "danger"}
                            className="mb-3"
                            style={{ height: '20px' }}
                          />
                          
                          <Row className="level-details">
                            <Col md={4} className="mb-2">
                              <div className="detail-item">
                                <span className="detail-label text-muted">已練習單字:</span>
                                <span className="detail-value fw-bold ms-2">{level.words_practiced}</span>
                              </div>
                            </Col>
                            <Col md={4} className="mb-2">
                              <div className="detail-item">
                                <span className="detail-label text-muted">答對次數:</span>
                                <span className="detail-value text-success fw-bold ms-2">{level.total_correct}</span>
                              </div>
                            </Col>
                            <Col md={4} className="mb-2">
                              <div className="detail-item">
                                <span className="detail-label text-muted">答錯次數:</span>
                                <span className="detail-value text-danger fw-bold ms-2">{level.total_incorrect}</span>
                              </div>
                            </Col>
                          </Row>
                          
                          <Alert variant={studyRecommendation.type} className="mt-3 mb-0">
                            <small>{studyRecommendation.message}</small>
                          </Alert>
                        </Card.Body>
                      </Card>
                    );
                  })}
                </div>
              ) : (
                <Alert variant="info" className="text-center p-4">
                  <Alert.Heading>🎯 開始您的學習之旅</Alert.Heading>
                  <p>您還沒有開始練習單字。選擇一個難度級別開始學習，您的進度將會顯示在這裡！</p>
                  <div className="mt-3">
                    <Link to="/" className="btn btn-primary btn-lg">
                      🚀 開始練習單字
                    </Link>
                  </div>
                </Alert>
              )}

              <div className="text-center mt-4">
                <Button 
                  variant="outline-primary" 
                  onClick={fetchUserStats} 
                  className="refresh-button"
                  size="lg"
                >
                  🔄 更新統計資料
                </Button>
              </div>
            </Card.Body>
          </Card>
        </Container>
      </div>
      <Footer />
    </div>
  );
};

export default UserStats;
