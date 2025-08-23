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
import { useAuth } from '../../context/AuthContext';
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
  const { getAuthHeaders } = useAuth();
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
      const data = await getQuestion(level, getAuthHeaders());
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
      const result = await checkAnswer(word, option, level, getAuthHeaders());

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
          `The correct answer was: ${result.correctTranslation}`,
          false
        );
      }

      recordAnswer(word, result.correct, timeSpentSec, level);

      // NEW: increment questions answered
      setQuestionsAnswered((prev) => prev + 1);

      // Clear existing timer if any
      if (timerRef.current) {
        clearTimeout(timerRef.current);
      }
      
      // For incorrect answers, we'll set up the timer here
      // For correct answers, the timer is set in showModalMessage
      if (!result.correct) {
        timerRef.current = setTimeout(() => {
          setShowModal(false);
          fetchNewQuestion();
          // Clear the timer reference after executing
          timerRef.current = null;
        }, 2000);
      }
    } catch (err) {
      console.error(err);
      showModalMessage('Error', 'Failed to check answer.', false);
    } finally {
      setLoading(false);
    }
  }

  function showModalMessage(title, body, correct) {
    setModalTitle(title);
    setModalBody(body);
    setWasCorrect(correct);
    setShowModal(true);
    
    // For correct answers, automatically close after a delay
    if (correct) {
      timerRef.current = setTimeout(() => {
        setShowModal(false);
        fetchNewQuestion();
        timerRef.current = null;
      }, 1500); // 1.5 seconds delay
    }
  }

  function handleModalClose() {
    setShowModal(false);
    // Always fetch next question when modal is closed manually
    // Clear any existing timers
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    fetchNewQuestion();
  }

  // Correction rate for this entire level from StatsContext
  // (But you might prefer local info for the session)
  const correctionRate = getCorrectionRate(level)?.toFixed(1) || '0.0';
  const attempts = getAttempted(level) || 0;
  
  // Calculate local session stats as backup
  const localCorrectionRate = questionsAnswered > 0 ? ((correctCount / questionsAnswered) * 100).toFixed(1) : '0.0';

  // ============= NEW OR CHANGED =============
  // If "fixed" mode and we've answered enough => final screen
  if (mode.type === 'fixed' && questionsAnswered >= mode.count) {
    // e.g. 7/10 => 70 分
    const percent = Math.round((correctCount / mode.count) * 100);
    return (
      <Container className="py-5 text-center">
        <h2>
          {correctCount}/{mode.count} =&gt; {percent} 分！
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
    <Container className="py-5 text-center quiz-container">
      <div className="quiz-header">
        <div className="mb-3">
          <Button variant="secondary" onClick={onBack} className="quiz-back-button">
            &larr; 選擇其他難度
          </Button>
        </div>
        
        <div className="quiz-level-badge mb-3">{level}</div>

        {/* ============= NEW OR CHANGED ============= */}
        {mode.type === 'fixed' ? (
          // Show "目前題數 / 總題數"
          <div className="quiz-stats">
            目前題數: <strong>{questionsAnswered}</strong> / <strong>{mode.count}</strong>
          </div>
        ) : (
          // Original for "無盡模式"
          <div className="quiz-stats">
            正確率: <strong>{attempts > 0 ? correctionRate : localCorrectionRate}%</strong> &nbsp; 答題數: <strong>{attempts > 0 ? attempts : questionsAnswered}</strong>
          </div>
        )}
        {/* ========================================= */}
      </div>

      {loading ? (
        <div className="loading-spinner-container">
          <Spinner animation="border" variant="primary" size="lg" />
          <div className="loading-text">正在載入題目...</div>
        </div>
      ) : (
        <>
          <div className="quiz-word-container">
            <Button 
              variant="outline-secondary" 
              onClick={speakWord}
              aria-label="Speak word"
              className="speak-button"
            >
              <FontAwesomeIcon icon={faVolumeHigh} />
            </Button>
            <div className="text-center">
              <h1 className="quiz-word fade-in-text">{word}</h1>
            </div>
          </div>

          {/* 2x2 layout for answer options */}
          <div className="quiz-options-grid">
            <Row className="justify-content-center">
              <Col xs={12} md={6} lg={3} className="mb-3">
                <Button
                  variant="success"
                  size="lg"
                  className="quiz-option-button w-100"
                  onClick={() => handleOptionClick(options[0])}
                >
                  {options[0]}
                </Button>
              </Col>
              <Col xs={12} md={6} lg={3} className="mb-3">
                <Button
                  variant="success"
                  size="lg"
                  className="quiz-option-button w-100"
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
                  className="quiz-option-button w-100"
                  onClick={() => handleOptionClick(options[2])}
                >
                  {options[2]}
                </Button>
              </Col>
              <Col xs={12} md={6} lg={3} className="mb-3">
                <Button
                  variant="success"
                  size="lg"
                  className="quiz-option-button w-100"
                  onClick={() => handleOptionClick(options[3])}
                >
                  {options[3]}
                </Button>
              </Col>
            </Row>
          </div>

          <div className="quiz-time-stats">
            平均答題時間: <strong>{globalAvg} 秒</strong>
          </div>
        </>
      )}

      <Modal show={showModal} onHide={handleModalClose} centered backdrop="static" className="quiz-modal">
        <Modal.Header closeButton className={wasCorrect ? "quiz-modal-header-success" : "quiz-modal-header-error"}>
          <Modal.Title>{modalTitle}</Modal.Title>
        </Modal.Header>
        <Modal.Body className="p-4">{modalBody}</Modal.Body>
        <Modal.Footer>
          <Button variant="primary" onClick={handleModalClose}>
            {wasCorrect ? '下一題' : '知道了'}
          </Button>
        </Modal.Footer>
      </Modal>
    </Container>
  );
}
