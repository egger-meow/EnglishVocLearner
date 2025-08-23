// frontend/src/components/VocabularyQuiz/VocabularyQuiz.jsx

import React, { useEffect, useState, useRef, useContext, useCallback } from 'react';
import { getVocabularyQuestion, checkAnswer } from '../../services/quizService';
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
import { useNavigate } from 'react-router-dom';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import '../Quiz/Quiz.css'; // Reuse the Quiz styles

import { FontAwesomeIcon } from '@fortawesome/react-fontawesome';
import { faVolumeHigh } from '@fortawesome/free-solid-svg-icons';

export default function VocabularyQuiz({ standalone = true }) {
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

  // Track # answered + # correct in this quiz session
  const [questionsAnswered, setQuestionsAnswered] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);

  const { addMistake } = useContext(MistakesContext);
  const { recordAnswer, getCorrectionRate, getGlobalAverageTime, getAttempted } = useContext(StatsContext);
  const { getAuthHeaders } = useAuth();
  const navigate = useNavigate();
  
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

  function showModalMessage(title, body, correct) {
    setModalTitle(title);
    setModalBody(body);
    setWasCorrect(correct);
    setShowModal(true);

    // Auto close modal and fetch next question after 2 seconds if correct
    if (correct) {
      timerRef.current = setTimeout(() => {
        handleModalClose();
      }, 2000);
    }
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const fetchNewQuestion = useCallback(async () => {
    setLoading(true);
    try {
      const data = await getVocabularyQuestion(getAuthHeaders());
      setWord(removeSymbols(data.word));
      setOptions(data.options);
      setQuestionStart(Date.now());
    } catch (err) {
      console.error(err);
      showModalMessage('Error', 'Failed to load question. You may need at least 4 words in your vocabulary library.', false);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchNewQuestion();
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [fetchNewQuestion]);

  async function handleOptionClick(option) {

    setLoading(true);
    try {
      const result = await checkAnswer(word, option, null, getAuthHeaders()); // No level for vocabulary quiz

      // Time spent
      const now = Date.now();
      const timeSpentSec = questionStart ? (now - questionStart) / 1000 : 0;

      // Mark correct or incorrect
      if (result.correct) {
        setWasCorrect(true);
        showModalMessage('Correct!', `good job.`, true);
        setCorrectCount((prev) => prev + 1);
      } else {
        addMistake(word, result.correctTranslation, 'VOCABULARY');
        setWasCorrect(false);
        showModalMessage('Incorrect', `The correct answer is: ${result.correctTranslation}`, false);
      }

      // Record the answer in stats
      recordAnswer(word, result.correct, timeSpentSec, 'VOCABULARY');

      // NEW: increment local questionsAnswered regardless of correct/incorrect
      setQuestionsAnswered((prev) => prev + 1);

    } catch (err) {
      console.error(err);
      showModalMessage('Error', 'Failed to check answer.', false);
    } finally {
      setLoading(false);
    }
  }

  function handleModalClose() {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
    setShowModal(false);
    fetchNewQuestion(); // Always fetch next question in infinite mode
  }

  function handleBackToVocabulary() {
    navigate('/vocabulary');
  }

  // Calculate local correction rate
  const localCorrectionRate = questionsAnswered > 0 
    ? Math.round((correctCount / questionsAnswered) * 100) 
    : 0;

  // Get global stats for this level (fallback to local if no global stats)
  const attempts = getAttempted('VOCABULARY');
  const correctionRate = attempts > 0 ? getCorrectionRate('VOCABULARY') : 0;

  return (
    <>
      {standalone && (
        <Header 
          currentPage="vocabulary-quiz" 
          onNavHome={() => navigate('/')} 
          onNavResumeQuiz={() => navigate('/quiz')} 
          onNavMistakes={() => navigate('/mistakes')} 
          onOpenAuthModal={() => navigate('/login')} 
        />
      )}
      <Container className="my-4 quiz-container">
        <div className="quiz-header">
          <div className="mb-3">
            <Button variant="secondary" onClick={handleBackToVocabulary} className="quiz-back-button">
              &larr; 返回單字庫
            </Button>
          </div>
          
          <div className="quiz-level-badge mb-3">單字庫測驗</div>

          {/* Show infinite mode stats */}
          <div className="quiz-stats">
            正確率: <strong>{attempts > 0 ? correctionRate : localCorrectionRate}%</strong> &nbsp; 答題數: <strong>{attempts > 0 ? attempts : questionsAnswered}</strong>
          </div>
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
                    disabled={!options[0]}
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
                    disabled={!options[1]}
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
                    disabled={!options[2]}
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
                    disabled={!options[3]}
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
      {standalone && <Footer />}
    </>
  );
}
