import './App.scss';
import { Container, Row } from 'react-bootstrap'
import { PyodideLoader } from './PyodideLoader';
import PyodideApplet from './PyodideApplet';

function App() {
  return (
    <div className="App">
      <Container fluid>
        <Row>
          <PyodideLoader>
            <PyodideApplet src="/pyodide-sandbox/py/sklearn_classifiers.py" title="Scikit-learn Classifiers demo" />
          </PyodideLoader>
        </Row>
      </Container>
    </div>
  );
}

export default App;
