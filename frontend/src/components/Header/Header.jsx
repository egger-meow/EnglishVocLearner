// frontend/src/components/Header/Header.jsx
import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';

export default function Header({ 
  currentPage,
  selectedLevel,    
  onNavHome, 
  onNavResumeQuiz, 
  onNavMistakes 
}) {
  return (
    <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
      <Container>
        {/* Clickable brand that goes 'Home' */}
        <Navbar.Brand style={{ cursor: 'pointer' }} onClick={onNavHome}>
          賽琳娘基本英文單字測驗
        </Navbar.Brand>

        <Navbar.Toggle aria-controls="basic-navbar-nav" aria-label="Toggle navigation" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            {/* Home link */}
            <Nav.Link onClick={onNavHome}>首頁</Nav.Link>

            {/* Conditionally show "Resume Quiz" only if showResumeQuiz === true */}
            {currentPage === 'mistakes' && selectedLevel && (
              <Nav.Link onClick={onNavResumeQuiz}>回到測驗</Nav.Link>
            )}

            {/* Mistakes link */}
            <Nav.Link onClick={onNavMistakes}>錯誤單字紀錄</Nav.Link>

            {/* About link */}
            <Nav.Link href="https://www.instagram.com/jjmow_1203/?hl=zh-tw">關於</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
