import _ from 'lodash';
import React from 'react';
import { Stack, ToggleButton, ToggleButtonGroup, OverlayTrigger, Tooltip, Button, ButtonGroup, ButtonToolbar, Container, Row, Col, Card } from 'react-bootstrap';
import * as Icon from 'react-bootstrap-icons';

function ToolbarButton(props) {
    return (
        <OverlayTrigger placement="right" overlay={<Tooltip id={props.key}>{props.title}</Tooltip>}>
            <Button {...props }/>
        </OverlayTrigger>
    )
}

export default class Plotter extends React.Component {
    static defaultProps = {
        points: [],
        onChange: _.noop
    }

    constructor(props) {
        super(props)

        this.state = {
            action: "add-point",
            selectedClass: 0
        }
    }

    addPointForEvent(e, datumClass) {
        const img = e.target
        const rect = img.getBoundingClientRect();

        return {
            x: (e.clientX - rect.left) * (img.naturalWidth / img.width),
            y: (e.clientY - rect.top) * (img.naturalHeight / img.height),
            clientX: e.clientX - rect.left,
            clientY: e.clientY - rect.top,
            width: img.width,
            height: img.height,
            datumClass: datumClass,
            key: _.uniqueId()
        }
    }

    handlePlotClick(e) {
        if (this.state.action === "add-point") {
            this.props.onChange([...this.props.points, this.addPointForEvent(e, this.state.selectedClass)], 'add')
        }
    }

    handleClear() {
        this.props.onChange([], 'clear')
    }

    handleDragStart(e) {
        this.dragged = e.target
        e.target.style.opacity = 0.5
    }

    handleDragEnd(e) {
        e.target.style.opacity = ""
    }

    handleDrop(e) {
        const key = this.dragged.dataset.key
        let points = this.props.points
        const originalPoint = _.find(points, { key })
        points = [...points, this.addPointForEvent(e, originalPoint.datumClass)]
        points = _.without(points, originalPoint)

        this.props.onChange(points, 'drag')
    }

    handleClassChange(selectedClass) {
        this.setState({selectedClass, action:"add-point"})
    }

    toolbar() {
        const classButtons = [0, 1, 2].map(col =>
            <ToolbarButton onClick={e => this.handleClassChange(col)}
                key={col}
                variant="outline-dark"
                title="Add a new data point of this class"
                className={` class-${col} ${this.state.selectedClass === col ? "active" : ""}`}>
                <Icon.SquareFill />
            </ToolbarButton>
        )

        return (
            <div className="toolbar">
                <ButtonToolbar vertical>
                    <ButtonGroup vertical>
                        {classButtons}
                    </ButtonGroup>
                    <ButtonGroup vertical>
                        <Button onClick={e => this.handleFlagClick()} variant="outline-dark" disabled>
                            <Icon.Flag />
                        </Button>
                    </ButtonGroup>
                    <ButtonGroup vertical>
                        <ToolbarButton onClick={e => this.handleClear()} key="erase" variant="outline-dark" title="Remove all points">
                            <Icon.EraserFill />
                        </ToolbarButton>
                    </ButtonGroup>
                </ButtonToolbar>
            </div>
        )
    }

    render() {
        const addedPoints = this.props['points'].map(p => {
            return (
                <div draggable={true}
                    onDragStart={(e) => this.handleDragStart(e)}
                    onDragEnd={(e) => this.handleDragEnd(e)}
                    className={`point point-${p.datumClass}`}
                    key={p.key}
                    data-key={p.key}
                    style={{
                        width: `${9/window.innerWidth * 100}vw`,
                        height: `${9/window.innerWidth * 100}vw`,
                        left: `${(p['clientX'] - 4) / p['width'] * 100}%`,
                        top: `${(p['clientY'] - 4) / p['height'] * 100}%`,
                        position: 'absolute',
                        opacity: 1,
                        cursor: 'grab'
                    }}></div>
            )
        })

        return (
            <div className="plotter">
                <Container>
                    <Row>
                        <Col>
                            <Card>
                                <Card.Body className="img-container">
                                    {addedPoints}
                                    <img src={this.props.content.data}
                                        alt={this.props['alt']}
                                        style={{ cursor: "crosshair" }}
                                        onClick={e => this.handlePlotClick(e)}
                                        onDrop={e => this.handleDrop(e)}
                                        onDragOver={e => e.preventDefault()}
                                    />
                                </Card.Body>
                            </Card>
                        </Col>
                        {this.toolbar()}

                    </Row>
                </Container>
            </div>
        );
    }
}