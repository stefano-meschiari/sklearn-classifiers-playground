import React from 'react'
import Spinner from 'react-bootstrap/Spinner'

function SandboxSpinner({reason}) {
    return (
        <div>
            <Spinner animation="grow" />
            {reason}
        </div>
    )
}

export default SandboxSpinner;