// frontend/src/components/Quiz/Quiz.jsx

import React, { useEffect, useState, useRef, useContext } from 'react';
import { getQuestion, checkAnswer } from '../../services/quizService';
import {
  Container,
  Row,
  Col,
  Button,
  Modal,
  Spinner
} from 'react-bootstrap';
import { MistakesContext } from '../../context/MistakesContext';
import { StatsContext } from '../../context/StatsContext';
import './Quiz.css'; // Import the CSS file

export default function Quiz({ level, onBack }) {
  const [word, setWord] = useState('');
  const [options, setOptions] = useState([]);
  const [loading, setLoading] = useState(false);

  // Track start time so we can measure how long the user took
  const [questionStart, setQuestionStart] = useState(null);

  // For modal feedback
  const [showModal, setShowModal] = useState(false);
  const [modalTitle, setModalTitle] = useState('');
  const [modalBody, setModalBody] = useState('');
  const [wasCorrect, setWasCorrect] = useState(false);

  const timerRef = useRef(null);

  const { addMistake } = useContext(MistakesContext);
  const { recordAnswer, getCorrectionRate, getGlobalAverageTime, getAttempted } = useContext(StatsContext);
  const globalAvg = getGlobalAverageTime().toFixed(2);
  // On mount or when level changes, fetch first question
  useEffect(() => {
    if (level) {
      fetchNewQuestion();
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
    // eslint-disable-next-line
  }, [level]);

  async function fetchNewQuestion() {
    setLoading(true);
    try {
      const data = await getQuestion(level);
      setWord(data.word);
      setOptions(data.options);

      // Mark the start time for this question
      setQuestionStart(Date.now());
    } catch (err) {
      console.error(err);
      showModalMessage('Error', 'Failed to load question.', false);
    } finally {
      setLoading(false);
    }
  }

  async function handleOptionClick(option) {
    setLoading(true);

    try {
      const result = await checkAnswer(word, option);

      // Calculate how many seconds user took
      const now = Date.now();
      const timeSpentSec = questionStart
        ? (now - questionStart) / 1000
        : 0;

      if (result.correct) {
        setWasCorrect(true);
        showModalMessage('Correct!', `good job.`, true);
      } else {
        // Record mistake in MistakesContext
        addMistake(word, result.correctTranslation, level);

        setWasCorrect(false);
        showModalMessage(
          'Incorrect',
          `Correct translation for "${word}" is "${result.correctTranslation}".`,
          false
        );
      }

      // Record the attempt in StatsContext
      recordAnswer(level, result.correct, timeSpentSec);

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

    // If correct, auto close after 0.7 second
    if (correct) {
      timerRef.current = setTimeout(() => {
        handleModalClose();
      }, 700);
    }
  }

  function handleModalClose() {
    setShowModal(false);
    if (!wasCorrect) {
      // Wait for user to close if incorrect
    }
    fetchNewQuestion();
  }

  // Now we read the correctionRate for this level from StatsContext
  const correctionRate = getCorrectionRate(level); // e.g. 75 if 3/4
  const attempts = getAttempted(level);

  return (
    <Container className="py-5 text-center">
      <div className="mb-4">
        <Button variant="secondary" onClick={onBack}>
          &larr; 選擇其他難度
        </Button>
      </div>

      <h4 className="text-muted mb-2">{level}</h4>
      <p className="text-muted mb-4">
        正確率: {correctionRate.toFixed(1)}%  答題數: {attempts}
      </p>

      {loading ? (
        <>
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Loading question...</div>
        </>
      ) : (
        <>
          <h1 className="display-3 mb-5 fade-in-text">{word}</h1>

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
          <div className="mt-4 text-muted" style={{ fontSize: "0.8rem" }}>
            平均答題時間: {globalAvg} s
          </div> 
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
