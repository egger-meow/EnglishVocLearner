import React, { useEffect, useState } from 'react';
import { getLevels } from '../../services/quizService';
import { Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import { useAuth } from '../../context/AuthContext';

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
      <Container className="py-5 text-center">
        <Spinner animation="border" variant="primary" />
        <div className="mt-2">Loading levels...</div>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5 text-center">
        <div className="text-danger">{error}</div>
      </Container>
    );
  }

  return (
    <Container className="py-5 text-center">
      <h2 className="mb-4">選擇單字難度</h2>

      {!isAuthenticated && (
        <Alert variant="info" className="mb-4">
          <Alert.Heading>需要登入</Alert.Heading>
          <p>請先登入或註冊帳號才能開始練習單字。</p>
          <Button variant="primary" onClick={onOpenAuthModal}>
            立即登入/註冊
          </Button>
        </Alert>
      )}

      {isAuthenticated && (
        <Alert variant="success" className="mb-4">
          歡迎回來，{user?.username}！選擇一個難度開始練習吧。
        </Alert>
      )}

      <Row className="justify-content-center">
        <Col xs={12} md={6} lg={4}>
          {levels.map((lvl) => (
            <Button
              key={lvl}
              variant={isAuthenticated ? "primary" : "outline-secondary"}
              size="lg"
              className="mb-3 w-100"
              onClick={() => handleLevelClick(lvl)}
              disabled={!isAuthenticated}
            >
              {lvl}
            </Button>
          ))}
        </Col>
      </Row>
    </Container>
  );
}
