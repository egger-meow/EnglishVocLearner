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
import './Quiz.css';

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeHigh } from '@fortawesome/free-solid-svg-icons';

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

  function speakWord() {
    if (!word) return;
  
    const utterance = new SpeechSynthesisUtterance(word);
    
    // Force English pronunciation
    utterance.lang = 'en-US'; // or 'en-GB' for British English
    
    // Find an English voice
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find(voice => 
      voice.lang.startsWith('en') || 
      voice.name.includes('English')
    );
  
    if (englishVoice) {
      utterance.voice = englishVoice;
      utterance.lang = englishVoice.lang; // Sync language with voice
    }
  
    // Optional: Adjust speech parameters
    utterance.rate = 1.0; // Normal speed
    utterance.pitch = 1.0; // Neutral pitch
    utterance.volume = 1.0; // Full volume
  
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // Load voices and handle voice changes
      const handleVoicesChanged = () => {
        // Optional: Store voices in state if needed
      };
      
      window.speechSynthesis.onvoiceschanged = handleVoicesChanged;
      
      // Cleanup voices handler on unmount
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []); // Empty dependency array = runs once

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
          {/* Row for the Speak button + the word */}
          <Row className="justify-content-center align-items-center mb-5">
            <Col xs="12" className="text-center">
              <Button 
                variant="outline-secondary" 
                onClick={speakWord}
                aria-label="Speak word"
                className="me-2"
              >
                <FontAwesomeIcon icon={faVolumeHigh} />
              </Button>
            </Col>
            <Col xs="12" className="text-center">

              <h1 className="display-3 mb-0 fade-in-text d-inline">{word}</h1>
            </Col>
          </Row>

          {/* 2x2 layout for answer options */}
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