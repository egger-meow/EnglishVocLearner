// frontend/src/components/LevelSelect/LevelSelect.jsx

import React, { useEffect, useState } from 'react';
import { getLevels } from '../../services/quizService';
import { Container, Row, Col, Button, ListGroup, Spinner } from 'react-bootstrap';

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
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <Spinner animation="border" variant="primary" />
            <div className="mt-3">Loading levels...</div>
          </Col>
        </Row>
      </Container>
    );
  }

  if (error) {
    return (
      <Container className="py-5">
        <Row className="justify-content-center">
          <Col md={6} className="text-center">
            <div className="text-danger">Error: {error}</div>
          </Col>
        </Row>
      </Container>
    );
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={6} className="text-center">
          <h2 className="mb-4">Select a Level</h2>

          <ListGroup className="mb-4">
            {levels.map((lvl) => (
              <ListGroup.Item key={lvl} className="p-2">
                <Button variant="primary" onClick={() => onLevelSelect(lvl)}>
                  {lvl}
                </Button>
              </ListGroup.Item>
            ))}
          </ListGroup>
        </Col>
      </Row>
    </Container>
  );
}
