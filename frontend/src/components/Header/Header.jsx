// frontend/src/components/Header/Header.jsx

import React from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';

export default function Header() {
  return (
    <Navbar bg="primary" variant="dark" expand="lg" sticky="top">
      <Container>
        <Navbar.Brand href="/">Vocabulary Quiz</Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" aria-label="Toggle navigation" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto">
            <Nav.Link href="/">Home</Nav.Link>
            <Nav.Link href="/quiz">Start Quiz</Nav.Link>
            <Nav.Link href="/about">About</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}
