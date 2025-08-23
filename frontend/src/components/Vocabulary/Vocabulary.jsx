// frontend/src/components/Vocabulary/Vocabulary.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Card, Button, Table, Form, Alert, Badge, Spinner, Modal } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';
import './Vocabulary.css';

// Define API base URL - can be replaced with environment variable in production
const API_BASE_URL = process.env.REACT_APP_API_URL || 'http://127.0.0.1:5000';

export default function Vocabulary({ standalone = true }) {
  const [vocabulary, setVocabulary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [filterLevel, setFilterLevel] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [suggestions, setSuggestions] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchResults, setShowSearchResults] = useState(false);
  const { getAuthHeaders, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  
  // Modal state for editing notes
  const [showNotesModal, setShowNotesModal] = useState(false);
  const [selectedWord, setSelectedWord] = useState({ word: '', notes: '' });
  
  // Modal state for delete confirmation
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [wordToDelete, setWordToDelete] = useState('');
  
  const fetchVocabulary = useCallback(async (level = 'all', search = '') => {
    if (!isAuthenticated) return;
    
    try {
      setLoading(true);
      setError('');
      
      let url = `${API_BASE_URL}/api/vocabulary?level=${level}`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      
      const headers = {
        'Content-Type': 'application/json',
        ...getAuthHeaders()
      };
      console.log('Request headers:', headers);
      console.log('Request URL:', url);
      
      const response = await fetch(url, { headers });
      
      if (response.ok) {
        const data = await response.json();
        console.log('Vocabulary API response:', data);
        setVocabulary(data.vocabulary || []);
      } else {
        console.error('API Error - Status:', response.status, 'URL:', url);
        const errorData = await response.json().catch(() => ({}));
        console.error('Error data:', errorData);
        setError(errorData.error || `無法載入單字庫 (HTTP ${response.status})`);
      }
    } catch (error) {
      console.error('Error fetching vocabulary:', error);
      setError('網路錯誤，請重試。');
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders, isAuthenticated]);
  
  // Function to fetch search suggestions from personal vocabulary
  const fetchSuggestions = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2 || !isAuthenticated) {
      setSuggestions([]);
      return;
    }
    
    try {
      let url = `${API_BASE_URL}/api/vocabulary/suggestions?search=${encodeURIComponent(searchQuery)}&level=${filterLevel}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSuggestions(data.suggestions || []);
      } else {
        setSuggestions([]);
      }
    } catch (error) {
      console.error('Error fetching suggestions:', error);
      setSuggestions([]);
    }
  }, [filterLevel, getAuthHeaders, isAuthenticated]);

  // Function to search system vocabulary database
  const searchSystemVocabulary = useCallback(async (searchQuery) => {
    if (!searchQuery || searchQuery.length < 2 || !isAuthenticated) {
      setSearchResults([]);
      setShowSearchResults(false);
      return;
    }
    
    try {
      let url = `${API_BASE_URL}/api/vocabulary/search?search=${encodeURIComponent(searchQuery)}&level=${filterLevel}`;
      
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSearchResults(data.results || []);
        setShowSearchResults(data.results && data.results.length > 0);
      } else {
        setSearchResults([]);
        setShowSearchResults(false);
      }
    } catch (error) {
      console.error('Error searching system vocabulary:', error);
      setSearchResults([]);
      setShowSearchResults(false);
    }
  }, [filterLevel, getAuthHeaders, isAuthenticated]);
  
  useEffect(() => {
    if (isAuthenticated) {
      fetchVocabulary(filterLevel, searchTerm);
    }
  }, [isAuthenticated, fetchVocabulary, filterLevel, searchTerm]);
  
  // Effect for fetching suggestions as user types
  useEffect(() => {
    const debounceTimer = setTimeout(() => {
      if (searchTerm && searchFocused) {
        fetchSuggestions(searchTerm);
        searchSystemVocabulary(searchTerm);
      }
    }, 300); // 300ms debounce
    
    return () => clearTimeout(debounceTimer);
  }, [searchTerm, fetchSuggestions, searchSystemVocabulary, searchFocused]);
  
  const handleSearch = (e) => {
    e.preventDefault();
    // Search both personal vocabulary and system vocabulary
    fetchVocabulary(filterLevel, searchTerm);
    searchSystemVocabulary(searchTerm);
  };
  
  const handleSuggestionClick = (suggestion) => {
    setSearchTerm(suggestion.word);
    setShowSuggestions(false);
    fetchVocabulary(filterLevel, suggestion.word);
    searchSystemVocabulary(suggestion.word);
  };
  
  const handleFilterChange = (e) => {
    setFilterLevel(e.target.value);
  };
  

  
  // Handle adding word from search results to personal vocabulary
  const handleAddWordFromSearch = async (word, translation, level) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vocabulary`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({
          word: word,
          translation: translation,
          level: level,
          added_from: 'search'
        })
      });
      
      if (response.ok) {
        // Refresh the vocabulary list and update search results
        fetchVocabulary(filterLevel, searchTerm);
        searchSystemVocabulary(searchTerm);
        setError('');
      } else {
        const errorData = await response.json();
        setError(errorData.error || '新增單字失敗');
      }
    } catch (error) {
      console.error('Error adding word:', error);
      setError('網路錯誤，請重試。');
    }
  };
  
  const handleRemoveWordClick = (word) => {
    setWordToDelete(word);
    setShowDeleteModal(true);
  };
  
  const handleRemoveWord = async () => {
    const word = wordToDelete;
    setShowDeleteModal(false);
    
    try {
      const response = await fetch(`${API_BASE_URL}/api/vocabulary/${encodeURIComponent(word)}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      
      if (response.ok) {
        // Refresh the vocabulary list after deletion
        fetchVocabulary(filterLevel, searchTerm);
      } else {
        setError('移除單字失敗');
      }
    } catch (error) {
      console.error('Error removing word:', error);
      setError('網路錯誤，請重試。');
    }
  };
  
  // Handle opening notes modal
  const handleOpenNotesModal = (word, notes = '') => {
    setSelectedWord({ word, notes });
    setShowNotesModal(true);
  };
  
  // Handle saving notes
  const handleSaveNotes = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vocabulary/${encodeURIComponent(selectedWord.word)}/notes`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        },
        body: JSON.stringify({ notes: selectedWord.notes })
      });
      
      if (response.ok) {
        setShowNotesModal(false);
        fetchVocabulary(filterLevel, searchTerm);
      } else {
        setError('更新筆記失敗');
      }
    } catch (error) {
      console.error('Error saving notes:', error);
      setError('網路錯誤，請重試。');
    }
  };
  
  // Handle starting vocabulary quiz
  const handleStartVocabularyQuiz = () => {
    // Navigate to vocabulary quiz route with special parameter
    navigate('/vocabulary-quiz');
  };
  
  const formatDate = (dateString) => {
    if (!dateString) return '未知';
    const date = new Date(dateString);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };
  
  const getLevelBadgeClass = (level) => {
    if (!level) return '';
    switch (level) {
      case 'LEVEL1': return 'level1-badge';
      case 'LEVEL2': return 'level2-badge';
      case 'LEVEL3': return 'level3-badge';
      case 'LEVEL4': return 'level4-badge';
      case 'LEVEL5': return 'level5-badge';
      case 'LEVEL6': return 'level6-badge';
      default: return '';
    }
  };
  
  const getAddedFromBadgeClass = (addedFrom) => {
    if (!addedFrom) return '';
    switch (addedFrom) {
      case 'mistakes': return 'added-from-mistakes';
      case 'manual': return 'added-from-manual';
      case 'search': return 'added-from-search';
      default: return '';
    }
  };
  
  const getAddedFromText = (addedFrom) => {
    if (!addedFrom) return '未知來源';
    switch (addedFrom) {
      case 'mistakes': return '從錯誤單字';
      case 'manual': return '手動新增';
      case 'search': return '從搜尋';
      default: return addedFrom;
    }
  };

  // Track word review
  const handleReviewWord = async (word) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/vocabulary/${encodeURIComponent(word)}/review`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders()
        }
      });
      
      if (response.ok) {
        // Optionally refresh the list to show updated review time
        fetchVocabulary(filterLevel, searchTerm);
      }
    } catch (error) {
      console.error('Error recording review:', error);
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        {standalone && (
        <Header 
          currentPage="vocabulary" 
          onNavHome={() => navigate('/')} 
          onNavResumeQuiz={() => navigate('/quiz')} 
          onNavMistakes={() => navigate('/mistakes')} 
          onOpenAuthModal={() => navigate('/login')} 
        />
      )}
        <Container className="my-4 vocabulary-container">
          <Card className="vocabulary-card">
            <Card.Body className="text-center p-5">
              <h2>請先登入</h2>
              <p>您需要登入後才能查看您的單字庫</p>
              <Button as={Link} to="/login" variant="primary">登入</Button>
            </Card.Body>
          </Card>
        </Container>
        {standalone && <Footer />}
      </>
    );
  }

  return (
    <>
      {standalone && (
        <Header 
          currentPage="vocabulary" 
          onNavHome={() => navigate('/')} 
          onNavResumeQuiz={() => navigate('/quiz')} 
          onNavMistakes={() => navigate('/mistakes')} 
          onOpenAuthModal={() => navigate('/login')} 
        />
      )}
      <Container className="my-4 vocabulary-container">
        <h1 className="vocabulary-title text-center">個人單字庫</h1>
        <p className="vocabulary-subtitle text-center">管理您收藏的單字、筆記和學習進度</p>
        
        {error && (
          <Alert variant="danger" className="mt-3" onClose={() => setError('')} dismissible>
            {error}
          </Alert>
        )}

        <Card className="vocabulary-card mb-4">
          <Card.Body>
            <div className="search-container">
              <Form onSubmit={handleSearch} className="mb-4 google-search-container">
                <Row>
                  <Col xs={12} lg={8} className="position-relative mb-3">
                    <div className="search-wrapper">
                      <div className="search-input-container">
                        <span className="search-icon">
                          <i className="bi bi-search"></i>
                        </span>
                        <Form.Control
                          type="text"
                          placeholder="搜尋單字或筆記內容"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          onFocus={() => {
                            setSearchFocused(true);
                            if (searchTerm) setShowSuggestions(true);
                          }}
                          onBlur={() => {
                            // Delay hiding suggestions to allow clicking on them
                            setTimeout(() => setShowSuggestions(false), 200);
                          }}
                          className="search-input"
                          autoComplete="off"
                        />
                        {searchTerm && (
                          <span 
                            className="clear-search" 
                            onClick={() => {
                              setSearchTerm('');
                              setSuggestions([]);
                              setSearchResults([]);
                              setShowSearchResults(false);
                            }}
                          >
                            <i className="bi bi-x-circle"></i>
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Search suggestions */}
                    {showSuggestions && searchFocused && suggestions.length > 0 && (
                      <div className="search-suggestions">
                        {suggestions.map((suggestion, index) => (
                          <div 
                            key={index} 
                            className="suggestion-item" 
                            onMouseDown={() => handleSuggestionClick(suggestion.word)}
                          >
                            <i className="bi bi-search suggestion-icon"></i>
                            <span>{suggestion.word}</span>
                            {suggestion.level && (
                              <Badge 
                                bg={getLevelBadgeClass(suggestion.level)} 
                                className="ms-2 suggestion-level"
                              >
                                {suggestion.level}
                              </Badge>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                    
                    {/* Search results */}
                    {showSearchResults && searchResults.length > 0 && (
                      <div className="search-results-section mt-4">
                        <h5 className="mb-3">
                          <i className="bi bi-search me-2"></i>
                          找到 {searchResults.length} 個可新增的單字
                        </h5>
                        <Row>
                          {searchResults.map((result, index) => (
                            <Col xs={12} md={6} lg={4} key={index} className="mb-3">
                              <Card className="search-result-card h-100">
                                <Card.Body className="d-flex flex-column">
                                  <div className="flex-grow-1">
                                    <h6 className="card-title mb-2">{result.word}</h6>
                                    <p className="card-text text-muted mb-2">{result.translation}</p>
                                    <Badge bg={getLevelBadgeClass(result.level)} className="mb-2">
                                      {result.level}
                                    </Badge>
                                  </div>
                                  <Button 
                                    variant="success" 
                                    size="sm"
                                    onClick={() => handleAddWordFromSearch(result.word, result.translation, result.level)}
                                    className="mt-auto"
                                  >
                                    <i className="bi bi-plus-circle me-1"></i>
                                    新增到單字庫
                                  </Button>
                                </Card.Body>
                              </Card>
                            </Col>
                          ))}
                        </Row>
                      </div>
                    )}
                  </Col>
                </Row>
              </Form>
              
              {/* Filter and action buttons */}
              <div className="filter-controls">
                <Form.Select 
                  className="level-select" 
                  value={filterLevel} 
                  onChange={handleFilterChange}
                >
                  <option value="all">所有等級</option>
                  <option value="LEVEL1">Level 1</option>
                  <option value="LEVEL2">Level 2</option>
                  <option value="LEVEL3">Level 3</option>
                  <option value="LEVEL4">Level 4</option>
                  <option value="LEVEL5">Level 5</option>
                  <option value="LEVEL6">Level 6</option>
                </Form.Select>
                
                <Button 
                  variant="warning" 
                  className="ms-3"
                  onClick={handleStartVocabularyQuiz}
                  disabled={vocabulary.length < 4}
                >
                  <i className="bi bi-lightbulb me-2"></i>
                  單字庫測驗
                </Button>
              </div>
            </div>

            {error && (
              <Alert variant="danger" className="mt-3" onClose={() => setError('')} dismissible>
                {error}
              </Alert>
            )}
            {loading ? (
              <div className="text-center my-4">
                <Spinner animation="border" />
                <p className="mt-2">載入中...</p>
              </div>
            ) : (!vocabulary.length && !loading && !error) && (
              <div className="no-results-container">
                <div className="no-results-icon"><i className="bi bi-emoji-frown"></i></div>
                <h4>找不到符合的單字</h4>
                <p className="text-muted">請嘗試使用不同的搜尋詞或篩選條件</p>
              </div>
            )}

            {vocabulary.length === 0 ? (
              <div className="text-center py-5">
                <h3>您的單字庫是空的</h3>
                <p>您可以通過「新增單字」按鈕來添加單字，或者從錯誤單字列表中添加</p>
              </div>
            ) : (
              <>
                <Row className="mb-4">
                  <Col md={4}>
                    <div className="stat-circle">
                      <div className="stat-number">{vocabulary.length}</div>
                      <div className="stat-label">收藏單字總數</div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="stat-circle">
                      <div className="stat-number">
                        {vocabulary.filter(item => item.added_from === 'mistakes').length}
                      </div>
                      <div className="stat-label">從錯誤中學習</div>
                    </div>
                  </Col>
                  <Col md={4}>
                    <div className="stat-circle">
                      <div className="stat-number">
                        {vocabulary.filter(item => new Date(item.last_reviewed) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)).length}
                      </div>
                      <div className="stat-label">近7日複習</div>
                    </div>
                  </Col>
                </Row>

                <div className="table-responsive vocabulary-table">
                  <Table hover>
                    <thead>
                      <tr>
                        <th>單字</th>
                        <th>翻譯</th>
                        <th>筆記</th>
                        <th>等級</th>
                        <th>來源</th>
                        <th>新增時間</th>
                        <th>最近複習</th>
                        <th>操作</th>
                      </tr>
                    </thead>
                    <tbody>
                      {vocabulary.map((item) => (
                        <tr key={item.id || item.word}>
                          <td className="word-cell">{item.word}</td>
                          <td className="translation-cell">{item.translation || '-'}</td>
                          <td className="notes-cell">
                            {item.notes || '-'}
                            <Button
                              variant="link"
                              size="sm"
                              onClick={() => handleOpenNotesModal(item.word, item.notes)}
                            >
                              {item.notes ? '編輯' : '新增筆記'}
                            </Button>
                          </td>
                          <td>
                            {item.level ? (
                              <Badge className={`level-badge ${getLevelBadgeClass(item.level)}`}>
                                {item.level}
                              </Badge>
                            ) : '-'}
                          </td>
                          <td>
                            <Badge className={`added-from-badge ${getAddedFromBadgeClass(item.added_from)}`}>
                              {getAddedFromText(item.added_from)}
                            </Badge>
                          </td>
                          <td>{formatDate(item.created_at)}</td>
                          <td>{item.last_reviewed ? formatDate(item.last_reviewed) : '尚未複習'}</td>
                          <td className="action-buttons">
                            <div className="d-flex gap-1">
                              <Button 
                                variant="success" 
                                size="sm" 
                                onClick={() => handleReviewWord(item.word)}
                                title="標記為已複習"
                                className="px-2 py-1"
                              >
                                <i className="bi bi-check2"></i>
                              </Button>
                              <Button 
                                variant="danger" 
                                size="sm" 
                                onClick={() => handleRemoveWordClick(item.word)}
                                title="從單字庫中移除"
                                className="px-2 py-1"
                              >
                                <i className="bi bi-trash3"></i>
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </>
            )}

            <div className="text-center">
              <Button 
                variant="outline-primary" 
                className="refresh-button"
                onClick={() => fetchVocabulary(filterLevel, searchTerm)}
                disabled={loading}
              >
                {loading ? '載入中...' : '重新整理'}
              </Button>
            </div>
          </Card.Body>
        </Card>
      </Container>

      {/* Modal for editing notes */}
      <Modal show={showNotesModal} onHide={() => setShowNotesModal(false)} className="edit-notes-modal">
        <Modal.Header closeButton>
          <Modal.Title>編輯「{selectedWord.word}」的筆記</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <Form.Group>
            <Form.Control
              as="textarea"
              rows={5}
              value={selectedWord.notes || ''}
              onChange={(e) => setSelectedWord({...selectedWord, notes: e.target.value})}
              placeholder="在這裡輸入您的筆記、例句或記憶方法..."
            />
          </Form.Group>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowNotesModal(false)}>
            取消
          </Button>
          <Button variant="primary" onClick={handleSaveNotes}>
            儲存筆記
          </Button>
        </Modal.Footer>
      </Modal>

      {/* Modal for delete confirmation */}
      <Modal show={showDeleteModal} onHide={() => setShowDeleteModal(false)}>
        <Modal.Header closeButton>
          <Modal.Title>確認刪除</Modal.Title>
        </Modal.Header>
        <Modal.Body>確定要從單字庫中移除 "{wordToDelete}" 嗎？</Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowDeleteModal(false)}>
            取消
          </Button>
          <Button variant="danger" onClick={handleRemoveWord}>
            確認刪除
          </Button>
        </Modal.Footer>
      </Modal>
      
      {standalone && <Footer />}
    </>
  );
}
