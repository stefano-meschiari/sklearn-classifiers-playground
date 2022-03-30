import React from 'react'
import { Row, Col, Spinner } from 'react-bootstrap'

function SandboxSpinner({reason}) {
    return (
        <Row>
            <Col className="align-self-center">
                <Spinner animation="border" />
                {' '}
                {reason}
            </Col>
        </Row>
    )
}

export default SandboxSpinner;