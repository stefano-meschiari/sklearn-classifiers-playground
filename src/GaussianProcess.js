import React from 'react';
import { Button } from 'react-bootstrap';
import SandboxSpinner from './Spinner';

import _ from 'lodash';

class GaussianProcess extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    async runComputation() {
        await window.pyodide.runPythonAsync(`output = compute_and_plot_gaussian_process()`)
        return window.pyodide.globals.get("output")
    }

    handleClick() {
        this.setState({ loaded: false })

        _.defer(async () => {
            let imgContent = await this.runComputation()
            this.setState({ imgContent, loaded: true })
        })
    }

    async componentDidMount() {
        console.log("Running Gaussian process script...")
        let pySource = await (await fetch("py/gaussian_processes.py")).text()
        console.log(pySource)
        await window.pyodide.runPythonAsync(pySource)

        _.defer(async () => {
            let imgContent = await this.runComputation()
            this.setState({ imgContent, loaded: true })
        })
        console.log("Done running")
    }

    content() {
        if (!this.state['loaded']) {
            return <SandboxSpinner reason="Computing Gaussian Process..."></SandboxSpinner>
        }
        return (<img src={this.state['imgContent']} alt="Gaussian Process output"/>);
    }

    render() {

        return (
            <div>
                <h1>Gaussian Process Classifier</h1>
                <div>
                    {this.content()}
                </div>
                <Button onClick={() => this.handleClick()}
                    disabled={!this.state['loaded']}>
                    Randomize data!
                </Button>

            </div>
        )
    }
}

export default GaussianProcess;