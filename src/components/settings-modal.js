import React, { Component } from 'react';
import Dialog from 'material-ui/Dialog';
import Toggle from 'material-ui/Toggle';
import Divider from 'material-ui/Divider';
import IconButton from 'material-ui/IconButton';

export default class SettingsModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      status: this.props.state
    }

    this.modal = {
      titleStyle: {
        fontWeight: 800,
        cursor: "default"
      },
      contentStyle: {
        width: "40%"
      },
      toggleStyle: {
        marginTop: 10,
        marginBottom: 10
      }
    }
  }

  // Update state status in response to prop changes
  componentWillReceiveProps(nextProps) {
    this.setState({
      status: nextProps.state
    })
  }

  handleClose = (event) => {
    this.setState({
      status: false
    });
  };

  handleToggleSwitch = (event) => {

  }

  render() {
    return (
      <Dialog
        title="Settings"
        className="settings-modal"
        modal={false}
        open={this.state.status}
        onRequestClose={this.handleClose.bind(this)}
        titleStyle={this.modal.titleStyle}
        contentStyle={this.modal.contentStyle}
        actions={
          <div className="close">
            <IconButton tooltip="Close" onClick={this.handleClose.bind(this)}>
              <i className="material-icons">close</i>
            </IconButton>
          </div>
        }
      >
        <div className="content">
          <Toggle label="Dark Theme"
            defaultToggled={false}
            style={this.modal.toggleStyle}
            onToggle={this.handleToggleSwitch.bind(this)}
          />
          <Divider />
          <Toggle label="Use Webcam"
            defaultToggled={true}
            style={this.modal.toggleStyle}
            onToggle={this.handleToggleSwitch.bind(this)}
          />
        </div>
      </Dialog>
    );
  }
}