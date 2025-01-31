// frontend/src/components/MistakesList/MistakesList.jsx

import React, { useContext } from 'react';
import { MistakesContext } from '../../context/MistakesContext';
import { Container, Row, Col, Button, Table } from 'react-bootstrap';

export default function MistakesList() {
  const { mistakes, clearMistakes } = useContext(MistakesContext);

  if (mistakes.length === 0) {
    return (
      <Container className="py-4 text-center">
        <h3>No mistakes recorded yet!</h3>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-3">
        <Col>
          <h2>錯誤單字紀錄</h2>
        </Col>
        <Col className="text-end">
          <Button variant="danger" onClick={clearMistakes}>
            清除紀錄
          </Button>
        </Col>
      </Row>

      <Table striped bordered hover>
        <thead>
          <tr>
            <th>單字</th>
            <th>翻譯</th>
            <th>難度</th>
            <th>錯誤次數</th>
          </tr>
        </thead>
        <tbody>
          {mistakes.map((m, idx) => (
            <tr key={idx}>
              <td>{m.word}</td>
              <td>{m.translation}</td>
              <td>{m.level}</td>
              <td>{m.missCount}</td>
            </tr>
          ))}
        </tbody>
      </Table>
    </Container>
  );
}
