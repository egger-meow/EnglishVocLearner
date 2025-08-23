// frontend/src/components/ModeSelect/ModeSelect.jsx

import React, { useState } from 'react';
import { Container, Row, Col, Button, Modal, Card } from 'react-bootstrap';
import './ModeSelect.css';

export default function ModeSelection({ level, onSelectMode, onBack }) {
  const [showFixedModal, setShowFixedModal] = useState(false);

  const handleEndlessMode = () => {
    onSelectMode({ type: 'endless' });
  };

  const handleFixedMode = () => {
    setShowFixedModal(true);
  };

  const pickQuestionCount = (count) => {
    onSelectMode({ type: 'fixed', count });
  };

  return (
    <Container className="py-5 text-center mode-selection-container">
      <Card className="mode-card">
        <Card.Header className="mode-header">
          <h2>選擇模式</h2>
          <div className="level-label">{level}</div>
        </Card.Header>
        <Card.Body>
          <Row className="justify-content-center">
            <Col md={6} className="mb-3">
              <Button 
                variant="primary" 
                onClick={handleEndlessMode} 
                className="mode-button mode-button-endless"
              >
                🔄 無盡模式
                <div className="small mt-2">持續練習，不限題數</div>
              </Button>
            </Col>
            <Col md={6} className="mb-3">
              <Button 
                variant="warning" 
                onClick={handleFixedMode} 
                className="mode-button mode-button-fixed"
              >
                📝 固定題數模式
                <div className="small mt-2">選擇練習題數</div>
              </Button>
            </Col>
          </Row>
          <div className="mt-4">
            <Button variant="secondary" onClick={onBack} className="back-button">
              &larr; 回到選擇難度
            </Button>
          </div>
        </Card.Body>
      </Card>

      {/* Modal for picking question count */}
      <Modal show={showFixedModal} onHide={() => setShowFixedModal(false)} centered className="quiz-modal">
        <Modal.Header closeButton className="modal-header">
          <Modal.Title>選擇題目數量</Modal.Title>
        </Modal.Header>
        <Modal.Body className="py-4">
          <p className="text-muted mb-3">請選擇您想要練習的題目數量：</p>
          <div className="d-flex flex-wrap justify-content-around">
            {[10, 20, 30, 50].map(num => (
              <Button
                key={num}
                variant="success"
                className="count-button"
                onClick={() => pickQuestionCount(num)}
              >
                {num} 題
              </Button>
            ))}
          </div>
        </Modal.Body>
      </Modal>
    </Container>
  );
}
