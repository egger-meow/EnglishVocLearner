import React, { useEffect, useState, useRef } from 'react';
import { getQuestion, checkAnswer } from '../../services/quizService';
import {
  Container,
  Row,
  Col,
  Button,
  Modal,
  Spinner
} from 'react-bootstrap';

export default function Quiz({ level, onBack }) {
  const [word, setWord] = useState('');
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // For modal feedback
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState('');
  const [wasCorrect, setWasCorrect] = useState(false);

  const timerRef = useRef(null);

  // Cleanup any pending timer on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);

  useEffect(() => {
    if (level) {
      fetchNewQuestion();
    }
    // eslint-disable-next-line
  }, [level]);

  async function fetchNewQuestion() {
    setLoading(true);
    try {
      const data = await getQuestion(level);
      setWord(data.word);
      setOptions(data.options);
    } catch (err) {
      console.error(err);
      showModalMessage('Error', 'Failed to load question.', false);
    } finally {
      setLoading(false);
    }
  }

  async function handleOptionClick(option) {
    setLoading(true);
    setTotal(prev => prev + 1);

    try {
      const result = await checkAnswer(word, option);
      if (result.correct) {
        setScore(prev => prev + 1);
        showModalMessage(
          'Correct!',
          `good job.`,
          true
        );
      } else {
        showModalMessage(
          'Incorrect',
          `Correct translation for "${word}" is "${result.correctTranslation}".`,
          false
        );
      }
    } catch (err) {
      console.error(err);
      showModalMessage('Error', 'Problem checking your answer.', false);
    } finally {
      setLoading(false);
    }
  }

  function showModalMessage(title, body, correct) {
    setModalTitle(title);
    setModalBody(body);
    setWasCorrect(correct);
    setShowModal(true);

    // If correct, auto close after 1 second
    if (correct) {
      timerRef.current = setTimeout(() => {
        handleModalClose();
      }, 700);
    }
  }

  function handleModalClose() {
    setShowModal(false);
    if (!wasCorrect) {
      // Wait for the user to close the modal if they're incorrect
    }
    fetchNewQuestion();
  }

  return (
    <Container className="py-5 text-center">
      <div className="mb-4">
        <Button variant="secondary" onClick={onBack}>
          &larr; Back to Levels
        </Button>
      </div>

      <h4 className="text-muted mb-2">Level: {level}</h4>
      <p className="text-muted mb-4">
        Score: {score} / {total}
      </p>

      {loading ? (
        <>
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Loading question...</div>
        </>
      ) : (
        <>
          <h1 className="display-3 mb-5">{word}</h1>

          {/* 2 rows x 2 columns layout for exactly 4 options */}
          <Row className="justify-content-center">
            <Col xs={12} md={6} lg={3} className="mb-3">
              <Button
                variant="success"
                size="lg"
                className="w-100"
                onClick={() => handleOptionClick(options[0])}
              >
                {options[0]}
              </Button>
            </Col>
            <Col xs={12} md={6} lg={3} className="mb-3">
              <Button
                variant="success"
                size="lg"
                className="w-100"
                onClick={() => handleOptionClick(options[1])}
              >
                {options[1]}
              </Button>
            </Col>
          </Row>

          <Row className="justify-content-center">
            <Col xs={12} md={6} lg={3} className="mb-3">
              <Button
                variant="success"
                size="lg"
                className="w-100"
                onClick={() => handleOptionClick(options[2])}
              >
                {options[2]}
              </Button>
            </Col>
            <Col xs={12} md={6} lg={3} className="mb-3">
              <Button
                variant="success"
                size="lg"
                className="w-100"
                onClick={() => handleOptionClick(options[3])}
              >
                {options[3]}
              </Button>
            </Col>
          </Row>
        </>
      )}

      {/* Modal feedback */}
      <Modal show={showModal} onHide={handleModalClose} centered backdrop="static">
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body>{modalBody}</Modal.Body>
        <Modal.Footer>
          {!wasCorrect && (
            <Button variant="primary" onClick={handleModalClose}>
              Close
            </Button>
          )}
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
