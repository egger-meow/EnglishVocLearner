import React, { useEffect, useState } from 'react';
import { getLevels } from '../../services/quizService';
import { Container, Row, Col, Button, Spinner, Alert, Card } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';
import './LevelSelect.css';
import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faInfo, faUser } from '@fortawesome/free-solid-svg-icons';

export default function LevelSelect({ onLevelSelect, onOpenAuthModal }) {
  const [levels, setLevels] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);
  const { isAuthenticated, user } = useAuth();

  useEffect(() => {
    fetchLevels();
  }, []);

  async function fetchLevels() {
    try {
      const data = await getLevels();
      setLevels(data);
    } catch (err) {
      console.error(err);
      setError('Failed to load levels.');
    } finally {
      setLoading(false);
    }
  }

  const handleLevelClick = (level) => {
    if (!isAuthenticated) {
      onOpenAuthModal();
      return;
    }
    onLevelSelect(level);
  };

  if (loading) {
    return (
      <Container className="py-5 text-center loading-container">
        <div className="loading-spinner">
          <Spinner animation="border" variant="primary" size="lg" />
        </div>
        <div className="loader-text mt-3">正在載入單字難度...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5 text-center">
        <Card className="level-card">
          <Card.Body className="p-5">
            <div className="text-danger"><strong>發生錯誤：</strong> {error}</div>
            <Button variant="primary" className="mt-3" onClick={fetchLevels}>
              重新載入
            </Button>
          </Card.Body>
        </Card>
      </Container>
    );
  }

  return (
    <Container className="py-5 text-center level-select-container">
      <Card className="level-card">
        <Card.Header className="mode-header">
          <h2 className="level-selection-title">選擇單字難度</h2>
        </Card.Header>
        <Card.Body className="p-4">
          {!isAuthenticated && (
            <Alert variant="info" className="auth-alert mb-4">
              <Alert.Heading>
                <FontAwesomeIcon icon={faUser} className="me-2" />
                需要登入
              </Alert.Heading>
              <p>請先登入或註冊帳號才能開始練習單字。</p>
              <Button variant="primary" onClick={onOpenAuthModal}>
                立即登入/註冊
              </Button>
            </Alert>
          )}

          {isAuthenticated && (
            <Alert variant="success" className="welcome-alert mb-4">
              <strong>歡迎回來，{user?.username}！</strong> 選擇一個難度開始練習吧。
            </Alert>
          )}

          <div className="level-info mb-4">
            <FontAwesomeIcon icon={faInfo} className="level-info-icon" />
            難度從簡單到困難，建議從低難度開始練習
          </div>

          <Row className="justify-content-center">
            <Col xs={12} md={8} lg={6}>
              {levels.map((lvl, index) => (
                <Button
                  key={lvl}
                  variant={isAuthenticated ? "primary" : "outline-secondary"}
                  size="lg"
                  className={`level-button level-button-${index + 1} mb-3 w-100`}
                  onClick={() => handleLevelClick(lvl)}
                  disabled={!isAuthenticated}
                >
                  {lvl}
                  <div className="level-description">
                    {index === 0 && "基礎常用詞彙"}
                    {index === 1 && "日常生活用語"}
                    {index === 2 && "一般閱讀所需"}
                    {index === 3 && "進階表達能力"}
                    {index === 4 && "專業領域詞彙"}
                    {index === 5 && "學術研究用詞"}
                  </div>
                </Button>
              ))}
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </Container>
  );
}
