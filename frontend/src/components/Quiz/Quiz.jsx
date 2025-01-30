// frontend/src/components/Quiz/Quiz.jsx

import React, { useEffect, useState, useRef } from 'react';
import { getQuestion, checkAnswer } from '../../services/quizService';
import { Container, Row, Col, Button, Modal, Spinner } from 'react-bootstrap';

export default function Quiz({ level, onBack }) {
  const [word, setWord] = useState('');
  const [options, setOptions] = useState([]);
  const [score, setScore] = useState(0);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);

  // For feedback popup (modal)
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState('');
  const [wasCorrect, setWasCorrect] = useState(false);

  const timerRef = useRef(null);

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
    };
  }, []);

  // fetch question
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

  useEffect(() => {
    if (level) {
      fetchNewQuestion();
    }
    // eslint-disable-next-line
  }, [level]);

  // user picks an option
  async function handleOptionClick(option) {
    setLoading(true);
    setTotal(prev => prev + 1);
    try {
      const result = await checkAnswer(word, option);
      if (result.correct) {
        setScore(prev => prev + 1);
        showModalMessage(
          'Correct!',
          `You got it right.`,
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
      showModalMessage('Error', 'Problem checking answer.', false);
    } finally {
      setLoading(false);
    }
  }

  // show the feedback modal
  function showModalMessage(title, body, correct) {
    setModalTitle(title);
    setModalBody(body);
    setWasCorrect(correct);
    setShowModal(true);

    if (correct) {
      timerRef.current = setTimeout(() => {
        handleModalClose();
      }, 700);
    }
  }

  // close the modal
  function handleModalClose() {
    setShowModal(false);
    if (!wasCorrect) {
      // user was incorrect, wait for them to click 'Close'
    }
    fetchNewQuestion();
  }

  return (
    <Container className="py-5">
      <Row className="justify-content-center">
        <Col md={8} className="text-center">
          <Button variant="secondary" onClick={onBack} className="mb-3">
            &larr; Back to Levels
          </Button>

          <h4 className="mb-2">Level: {level}</h4>
          <div className="text-muted mb-4">
            Score: {score} / {total}
          </div>

          {loading && (
            <>
              <Spinner animation="border" variant="primary" />
              <div className="mt-3">Loading question...</div>
            </>
          )}

          {!loading && (
            <>
              <h1 className="display-4 mb-4">{word}</h1>
              {options.map((opt) => (
                <Button
                  key={opt}
                  variant="success"
                  className="d-block mx-auto mb-2"
                  style={{ width: '200px' }}
                  onClick={() => handleOptionClick(opt)}
                >
                  {opt}
                </Button>
              ))}
            </>
          )}
        </Col>
      </Row>

      {/* Modal for feedback */}
      <Modal
        show={showModal}
        onHide={handleModalClose}
        centered
        backdrop="static"
      >
        <Modal.Header closeButton>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body style={{ textAlign: "center" }}>{modalBody}</Modal.Body>
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
