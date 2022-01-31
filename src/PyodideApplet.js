import React from 'react';
import { Button, Form, Container, Row, Col } from 'react-bootstrap';
import SandboxSpinner from './Spinner';

import _ from 'lodash';

class PyodideApplet extends React.Component {
    constructor(props) {
        super(props)
        this.state = {}
    }

    async setupParameters() {
        console.log("Setting up parameters...")
        await window.pyodide.runPythonAsync(`parameters = front_matter()`)
        let parameters = window.pyodide.globals.get("output")
        console.log("Parameters from script front matter", parameters)
        this.setState({ parameters })
    }

    updateParameter(name, value) {
        this.setState({ 'values': {...this.state['values'], [name]: value} })
    }

    createParametersFormItem(item) {
        let disabled = !this.state['loaded']

        if (input['type'] === "list") {
            let choices = input['values'].map(it => <option value={it}>{it}</option>)
            let handler = (e) => this.updateParameter(input['name'], input['value'])

            return (<Form.Select onChange={handler} disabled={disabled}>{choices}</Form.Select>);
        } else if (input['type'] === "numeric") {
            let handler = (e) => this.updateParameter(input['name'], _.toNumber(input['value']))
            return (<Form.Control type="numeric" disabled={disabled} onChange={handler}></Form.Control>)
        } else {
            throw new Error(`Unknown type ${item['type']}`)
        }
    }

    sidebar() {
        // this would be much better if we used a state container, but it's fine for
        // a quick hack
        let formItems = this.state["parameters"]["inputs"].map(input => {
            let control = this.createParametersFormItem(input)
            return (
                <>
                    <Form.Label>{input['description']}</Form.Label>
                    {control}
                </>
            )
        })

        return [<div>{this.state.parameters['description']}</div>, ...formItems];
    }

    handleCompute() {
        this.setState({ loaded: false })

    }

    async componentDidMount() {
        let source = this.props["src"]

        console.log("Running script at ", source)

        let pySource = await (await fetch(source)).text()
        await window.pyodide.runPythonAsync(pySource)

        _.defer(async () => {
            await this.setupParameters()
            await this.runComputation()
            this.setState({ loaded: true })
        })
    }

    content() {
        if (!this.state['loaded']) {
            return <SandboxSpinner reason="Running applet..."></SandboxSpinner>
        }
        return (<img src={this.state['imgContent']} alt="Classifier Output"/>);
    }

    render() {

        return (
            <Container fluid>
                <h1>{this.props.title}</h1>
                <Row>
                    <Col xs={8}>
                        {this.content()}
                    </Col>
                    <Col xs={4}>
                        {this.sidebar()}
                        <Button
                            onClick={() => this.handleCompute()}
                            disabled={!this.state['loaded']}>
                            Run
                        </Button>
                    </Col>
                </Row>
            </Container>
        )
    }
}

export default GaussianProcess;