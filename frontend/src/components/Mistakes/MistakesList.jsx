// frontend/src/components/MistakesList/MistakesList.jsx
import React, { useContext, useState } from 'react';
import { MistakesContext } from '../../context/MistakesContext';
import { Container, Row, Col, Button, Table, Form } from 'react-bootstrap';

export default function MistakesList() {
  const { mistakes, clearMistakes } = useContext(MistakesContext);
  const [filterLevel, setFilterLevel] = useState('all'); // State for filtering by difficulty

  // Filter mistakes based on the selected difficulty
  const filteredMistakes = mistakes.filter((m) =>
    filterLevel === 'all' ? true : m.level === filterLevel
  );

  if (mistakes.length === 0) {
    return (
      <Container className="py-4 text-center">
        <h3>No mistakes recorded yet!</h3>
      </Container>
    );
  }

  return (
    <Container className="py-4">
      <Row className="mb-3 align-items-center">
        <Col>
          <h2>錯誤單字紀錄</h2>
        </Col>
        <Col className="text-end">
          {/* Filter by Difficulty */}
          <Form.Select
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            style={{ width: 'auto', display: 'inline-block', marginRight: '10px' }}
          >
            <option value="all">全部</option>
            <option value="LEVEL1">LEVEL1</option>
            <option value="LEVEL2">LEVEL2</option>
            <option value="LEVEL3">LEVEL3</option>
            <option value="LEVEL4">LEVEL4</option>
            <option value="LEVEL5">LEVEL5</option>
            <option value="LEVEL6">LEVEL6</option>
          </Form.Select>

          {/* Clear Mistakes Button */}
          <Button variant="danger" onClick={clearMistakes}>
            清除紀錄
          </Button>
        </Col>
      </Row>

      {/* Mistakes Table */}
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
          {filteredMistakes.map((m, idx) => (
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