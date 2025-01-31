import React, { useEffect, useState } from 'react';
import { getLevels } from '../../services/quizService';
import { Container, Row, Col, Button, Spinner } from 'react-bootstrap';

export default function LevelSelect({ onLevelSelect }) {
  const [levels, setLevels] = useState([]);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(true);

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

      {/* We can stack the buttons in a single column,
          or in multiple columns. This example uses 1 column
          for simplicity but big, wide buttons. */}
      <Row className="justify-content-center">
        <Col xs={12} md={6} lg={4}>
          {levels.map((lvl) => (
            <Button
              key={lvl}
              variant="primary"
              size="lg"
              className="mb-3 w-100"  // 100% wide
              onClick={() => onLevelSelect(lvl)}
            >
              {lvl}
            </Button>
          ))}
        </Col>
      </Row>
    </Container>
  );
}
