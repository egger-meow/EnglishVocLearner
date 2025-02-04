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

/**
 * Props:
 *  - level: string (e.g. "LEVEL1")
 *  - mode: { type: 'endless' } or { type: 'fixed', count: number }
 *  - onBack: function
 */
export default function Quiz({ level, mode = { type: 'endless' }, onBack }) {
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

  // ============= NEW OR CHANGED =============
  // Track # answered + # correct in this *quiz session*
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  // =========================================

  const { addMistake } = useContext(MistakesContext);
  const { recordAnswer, getCorrectionRate, getGlobalAverageTime, getAttempted } = useContext(StatsContext);
  const globalAvg = getGlobalAverageTime().toFixed(2);

  function speakWord() {
    if (!word) return;
    const utterance = new SpeechSynthesisUtterance(word);
    utterance.lang = 'en-US';
    const voices = window.speechSynthesis.getVoices();
    const englishVoice = voices.find((voice) =>
      voice.lang.startsWith('en') || voice.name.includes('English')
    );
    if (englishVoice) {
      utterance.voice = englishVoice;
      utterance.lang = englishVoice.lang;
    }
    utterance.rate = 1.0;
    utterance.pitch = 0.5;
    utterance.volume = 1.0;
    window.speechSynthesis.cancel();
    window.speechSynthesis.speak(utterance);
  }

  function removeSymbols(str) {
    return str.replace(/^[^\w]+|[^\w]+$/g, '');
  }

  useEffect(() => {
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      // load voices
      window.speechSynthesis.onvoiceschanged = () => {};
      return () => {
        window.speechSynthesis.onvoiceschanged = null;
      };
    }
  }, []);

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
      setWord(removeSymbols(data.word));
      setOptions(data.options);
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

      // Time spent
      const now = Date.now();
      const timeSpentSec = questionStart ? (now - questionStart) / 1000 : 0;

      // Mark correct or incorrect
      if (result.correct) {
        setWasCorrect(true);
        showModalMessage('Correct!', `good job.`, true);
        // NEW: increment local correctCount
        setCorrectCount((prev) => prev + 1);
      } else {
        addMistake(word, result.correctTranslation, level);
        setWasCorrect(false);
        showModalMessage(
          'Incorrect',
          `Correct translation for "${word}" is "${result.correctTranslation}".`,
          false
        );
      }

      // Record attempt in StatsContext
      recordAnswer(level, result.correct, timeSpentSec);

      // NEW: increment local questionsAnswered
      setQuestionsAnswered((prev) => prev + 1);
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
    if (correct) {
      timerRef.current = setTimeout(() => {
        handleModalClose();
      }, 700);
    }
  }

  function handleModalClose() {
    setShowModal(false);
    // If incorrect, user must click 'Close' button
    if (!wasCorrect) {
      // do nothing special
    }
    // Go fetch next question
    fetchNewQuestion();
  }

  // Correction rate for this entire level from StatsContext
  // (But you might prefer local info for the session)
  const correctionRate = getCorrectionRate(level).toFixed(1);
  const attempts = getAttempted(level);

  // ============= NEW OR CHANGED =============
  // If "fixed" mode and we've answered enough => final screen
  if (mode.type === 'fixed' && questionsAnswered >= mode.count) {
    // e.g. 7/10 => 70 分
    const percent = Math.round((correctCount / mode.count) * 100);
    return (
      <Container className="py-5 text-center">
        <h2>
          {correctCount}/{mode.count} => {percent} 分！
        </h2>
        <p>恭喜你已完成 {mode.count} 題</p>
        <Button variant="secondary" onClick={onBack}>
          回到選擇難度
        </Button>
      </Container>
    );
  }
  // =========================================

  return (
    <Container className="py-5 text-center">
      <div className="mb-4">
        <Button variant="secondary" onClick={onBack}>
          &larr; 選擇其他難度
        </Button>
      </div>

      <h4 className="text-muted mb-2">{level}</h4>

      {/* ============= NEW OR CHANGED ============= */}
      {mode.type === 'fixed' ? (
        // Show "目前題數 / 總題數"
        <p className="text-muted mb-4">
          目前題數: {questionsAnswered} / {mode.count}
        </p>
      ) : (
        // Original for "無盡模式"
        <p className="text-muted mb-4">
          正確率: {correctionRate}% &nbsp; 答題數: {attempts}
        </p>
      )}
      {/* ========================================= */}

      {loading ? (
        <>
          <Spinner animation="border" variant="primary" />
          <div className="mt-2">Loading question...</div>
        </>
      ) : (
        <>
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
