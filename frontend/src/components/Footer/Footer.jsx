// frontend/src/components/Footer/Footer.jsx

import React from 'react';
import { Container } from 'react-bootstrap';

export default function Footer() {
  return (
    <footer className="bg-light text-center text-lg-start">
      <Container className="p-4">
        <div className="text-center">
          <p className="mb-0">&copy; 2025 Vocabulary App. All rights reserved.</p>
        </div>
      </Container>
    </footer>
  );
}
