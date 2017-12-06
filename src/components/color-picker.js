import React from 'react'
import { ChromePicker } from 'react-color'

class ColorPicker extends React.Component {
  state = {
    displayColorPicker: false,
  };

  handleClose = () => {
    this.setState({ displayColorPicker: false })
  };

  render() {
    const popover = {
      position: 'absolute',
      zIndex: '2',
    }
    const cover = {
      position: 'fixed',
      top: '0px',
      right: '0px',
      bottom: '0px',
      left: '0px',
    }
    return (
      <div>
        <ChromePicker />
      </div>
    )
  }
}

export default ColorPicker