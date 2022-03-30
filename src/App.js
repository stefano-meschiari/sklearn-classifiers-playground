import './App.scss';
import { Container, Row } from 'react-bootstrap'
import { PyodideLoader } from './PyodideLoader';
import PyodideApplet from './PyodideApplet';

function App() {
  return (
    <div className="App">

        <PyodideLoader>
          <PyodideApplet
            src="/pyodide-sandbox/py/sklearn_classifiers.py"
            pythonClass="SklearnClassifiers"
            title="Scikit-Learn Classifiers Playground"
          />
        </PyodideLoader>

    </div>
  );
}

export default App;
