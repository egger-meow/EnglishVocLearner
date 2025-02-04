// frontend/src/components/ModeSelect/ModeSelect.jsx

import React, { useState } from 'react';
import { Container, Row, Col, Button, Modal } from 'react-bootstrap';

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
    <Container className="py-5 text-center">
      <h2 className="mb-4">選擇模式 - {level}</h2>
      <Row className="justify-content-center">
        <Col xs="auto">
          <Button variant="primary" onClick={handleEndlessMode} className="m-3">
            無盡模式
          </Button>
          <Button variant="warning" onClick={handleFixedMode} className="m-3">
            固定題數模式
          </Button>
        </Col>
      </Row>
      <div className="mt-4">
        <Button variant="secondary" onClick={onBack}>
          &larr; 回到選擇難度
        </Button>
      </div>

      {/* Modal for picking question count */}
      <Modal show={showFixedModal} onHide={() => setShowFixedModal(false)} centered>
        <Modal.Header closeButton>
          <Modal.Title>選擇題目數量</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="d-flex flex-wrap justify-content-around">
            {[10, 20, 30, 50].map(num => (
              <Button
                key={num}
                variant="success"
                className="m-2"
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
