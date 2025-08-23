// frontend/src/components/Header/Header.jsx
import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import '../Auth/Auth.css';

function Header({ 
  currentPage, 
  selectedLevel, 
  onNavHome, 
  onNavResumeQuiz, 
  onNavMistakes, 
  onOpenAuthModal 
}) {
  const { user, logout, isAuthenticated } = useAuth();

  const handleAuthAction = () => {
    if (isAuthenticated) {
      logout();
    } else {
      onOpenAuthModal();
    }
  };

  return (
    <Navbar bg="primary" variant="dark" expand="lg" className="px-3">
      <Container fluid>
        <Navbar.Brand href="#" onClick={onNavHome}>
          賽琳娘基本英文單字測驗
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            <Nav.Link 
              href="#" 
              onClick={onNavHome}
            >
              首頁
            </Nav.Link>
            {currentPage === 'mistakes' && selectedLevel && (
              <Nav.Link 
                href="#" 
                onClick={onNavResumeQuiz}
              >
                回到測驗
              </Nav.Link>
            )}
            <Nav.Link 
              href="#" 
              onClick={onNavMistakes}
            >
              錯誤單字紀錄
            </Nav.Link>
            {isAuthenticated && (
              <>
                <Nav.Link as={Link} to="/stats">
                  學習統計
                </Nav.Link>
                <Nav.Link as={Link} to="/vocabulary">
                  單字庫
                </Nav.Link>
              </>
            )}
          </Nav>

          <Nav className="ms-auto">
            {isAuthenticated ? (
              <>
                <Navbar.Text className="me-3">
                  歡迎, {user?.username}!
                </Navbar.Text>
                <Button variant="outline-light" onClick={handleAuthAction}>
                  登出
                </Button>
              </>
            ) : (
              <Button variant="outline-light" onClick={handleAuthAction}>
                登入/註冊
              </Button>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default Header;
