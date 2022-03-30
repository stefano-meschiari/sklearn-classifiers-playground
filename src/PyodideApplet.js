import React from 'react';
import { Button, Form, Container, Row, Col, Card, Spinner } from 'react-bootstrap';
import _ from 'lodash';

import SandboxSpinner from './Spinner';
import Plotter from './Plotter';


class PyodideApplet extends React.Component {
    constructor(props) {
        super(props)
        this.state = {
            'parameters': {},
            'values': {},
            'computing': false
        }
        this.debouncedHandleCompute = _.debounce(() => this.handleCompute(), 750)
    }

    async setupParameters() {
        console.log("Setting up parameters...")
        await window.pyodide.runPythonAsync(`
        applet = ${this.props['pythonClass']}()
        parameters = json.dumps(applet.front_matter())
        `)
        const parameters = JSON.parse(window.pyodide.globals.get("parameters"))
        const values = Object.fromEntries(parameters["inputs"].map(i => [i['name'], i['value']]))
        console.log("Parameters from script front matter", parameters)
        console.log("Initial parameters:", values)
        this.setState({ parameters, values })
    }

    async compute() {
        window.inputs = JSON.stringify(this.state['values'])
        console.log("Running computation with inputs ", window.inputs)
        await window.pyodide.runPythonAsync(`
            from js import inputs
            output = applet.compute(inputs)
        `)
        const output = JSON.parse(window.pyodide.globals.get("output"))

        this.setState({
            computing: false,
            plotContent: output
        })
    }

    handleUpdateParameter(name, value, recompute=false) {
        this.setState({
            'values': {
                ...this.state['values'],
                [name]: value
            }
        })
        if (recompute) {
            this.setState({'computing': true})
            this.debouncedHandleCompute()
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
        } else if (input['type'] === "data") {
            // do nothing
            return null
        } else {
            throw new Error(`Unknown type ${input['type']}`)
        }
    }

    sidebar() {
        // this would be much better if we used a state container, but it's fine for
        // a quick hack
        let formItems = (this.state["parameters"]["inputs"] ?? []).map(input => {
            let control = this.createParametersFormItem(input)
            if (control == null) {
                return(<></>)
            }
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
        this.setState({computing: true})
        _.defer(() => this.compute())
    }

    handlePointsChange(points, action) {
        this.handleUpdateParameter('added_points', points, true)
    }

    async componentDidMount() {
        let source = this.props["src"]

        console.log("Running script at ", source)

        let pySource = await (await fetch(source)).text()

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

        const spinner = (this.state['computing'] ?
            <Spinner animation="grow" className="spinner-computing" /> :
            <></>)

        return (
            <>

                <Plotter points={this.state['values']['added_points']}
                    content={this.state.plotContent}
                    onChange={(...args) => this.handlePointsChange(...args)}
                />
                {spinner}
            </>
        );
    }

    handleSubmit(e) {
        this.handleCompute()
        e.preventDefault()
    }

    render() {
        return (
            <Container fluid>
                <Row>
                    <Col xs={9}>
                        {this.content()}
                    </Col>
                    <Col xs={3} className="sidebar">
                        <h1>
                            {this.props.title}
                        </h1>
                        <Form onSubmit={this.handleSubmit}>
                            {this.sidebar()}
                            <Button
                                onClick={() => this.handleCompute()}
                                disabled={!this.state['loaded']}
                                variant="dark">
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