import React from 'react';
import { Button, Form, Container, Row, Col, Card } from 'react-bootstrap';
import SandboxSpinner from './Spinner';

import _ from 'lodash';

class PyodideApplet extends React.Component {
    constructor(props) {
        super(props)
        this.state = { 'parameters': {}, 'values': {} }
    }

    async setupParameters() {
        console.log("Setting up parameters...")
        await window.pyodide.runPythonAsync(`parameters = json.dumps(front_matter())`)
        const parameters = JSON.parse(window.pyodide.globals.get("parameters"))
        const values = Object.fromEntries(parameters["inputs"].map(i => [i['name'], i['value']]))
        console.log("Parameters from script front matter", parameters)
        console.log("Initial parameters:", values)
        this.setState({ parameters, values })
    }

    async compute() {
        this.setState({ loaded: false })
        window.inputs = JSON.stringify(this.state['values'])
        console.log("Running computation with inputs ", window.inputs)
        await window.pyodide.runPythonAsync(`
            from js import inputs

            output = compute(inputs)
        `)
        this.setState({loaded: true, imgContent: window.pyodide.globals.get("output")})
    }

    handleUpdateParameter(name, value, recompute=false) {
        this.setState({ 'values': { ...this.state['values'], [name]: value } })
        if (recompute) {
            this.handleCompute()
        }
    }

    createParametersFormItem(input) {
        const disabled = !this.state['loaded']
        const name = input['name']

        if (input['type'] === "list") {
            const choices = input['values'].map(it => <option key={it} value={it}>{it}</option>)
            const handler = (e) => this.handleUpdateParameter(name, e.target.value, true)

            return (<Form.Select key={input['name']} value={this.state['values'][name]} onChange={handler} disabled={disabled}>{choices}</Form.Select>);
        } else if (input['type'] === "numeric") {
            const handler = (e) => this.handleUpdateParameter(input['name'], e.target.value)
            return (<Form.Control key={input['name']} value={this.state['values'][name]} type="numeric" disabled={disabled} onChange={handler}></Form.Control>)
        } else {
            throw new Error(`Unknown type ${input['type']}`)
        }
    }

    sidebar() {
        // this would be much better if we used a state container, but it's fine for
        // a quick hack
        let formItems = (this.state["parameters"]["inputs"] || []).map(input => {
            let control = this.createParametersFormItem(input)
            return (
                <Form.Group key={"group-" + input['name']} className="mb-3">
                    <Form.Label key={"label-" + input['name']}>{input['description']}</Form.Label>
                    {control}
                </Form.Group>
            )
        })

        let title = <Form.Group className="mb-3">
            <Form.Text>
                {this.state["parameters"]["description"]}
            </Form.Text>
            <hr/>
        </Form.Group>


        return [title, ...formItems];
    }

    async handleCompute() {
        this.setState({ loaded: false })
        _.defer(() => this.compute())
    }

    async componentDidMount() {
        let source = this.props["src"]

        console.log("Running script at ", source)

        let pySource = await (await fetch(source)).text()
        console.log("Source:", pySource)
        await window.pyodide.runPythonAsync(pySource)

        _.defer(async () => {
            await this.setupParameters()
            await this.compute()
            this.setState({ loaded: true })
        })
    }

    content() {
        if (!this.state['loaded']) {
            return <SandboxSpinner reason="Training..."></SandboxSpinner>
        }
        return (<div className="img-container"><img src={this.state['imgContent']} alt="Classifier Output" /></div>);
    }

    render() {
        return (
            <Container fluid>
                <h1>{this.props.title}</h1>
                <Row>
                    <Col xs={8}>
                        <Card>
                            <Card.Body>{this.content()}</Card.Body>
                        </Card>
                    </Col>
                    <Col xs={4}>
                        <Form>
                            {this.sidebar()}
                            <Button
                                onClick={() => this.handleCompute()}
                                disabled={!this.state['loaded']}>
                                Train Classifier
                            </Button>
                        </Form>
                    </Col>
                </Row>
            </Container>
        )
    }
}

export default PyodideApplet;