// frontend/src/components/Mistakes/MistakesList.jsx
import React, { useContext, useState } from 'react';
import { MistakesContext } from '../../context/MistakesContext';
import { Container, Row, Col, Button, Table, Form, Alert } from 'react-bootstrap';
import Header from '../Header/Header';
import Footer from '../Footer/Footer';

export default function MistakesList({ standalone = false }) {
  const { mistakes, clearMistakes } = useContext(MistakesContext);
  const [filterLevel, setFilterLevel] = useState('all'); // State for filtering by difficulty

  // Filter mistakes based on the selected difficulty
  const filteredMistakes = mistakes.filter((m) =>
    filterLevel === 'all' ? true : m.level === filterLevel
  );

  // Check if mistakes is defined and has length property
  if (!mistakes || mistakes.length === 0) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', minHeight: standalone ? '100vh' : 'auto' }}>
        {standalone && <Header />}
        <div style={{ flex: 1 }}>
          <Container className="py-5 text-center">
            <Alert variant="info">
              <h3>尚無錯誤記錄!</h3>
              <p>當您在測驗中答錯題目時，錯誤會被記錄在這裡。</p>
            </Alert>
          </Container>
        </div>
        {standalone && <Footer />}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', minHeight: standalone ? '100vh' : 'auto' }}>
      {standalone && <Header />}
      <div style={{ flex: 1 }}>
        <Container className="py-5">
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
      </div>
      {standalone && <Footer />}
    </div>
  );
}