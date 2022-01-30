import './App.css';
import { Container, Row } from 'react-bootstrap'
import { PyodideLoader } from './PyodideLoader';
import GaussianProcess from './GaussianProcess';

function App() {
  return (
    <div className="App">
      <Container fluid>
        <Row>
          <PyodideLoader>
            <GaussianProcess />
          </PyodideLoader>
        </Row>
      </Container>
    </div>
  );
}

export default App;
