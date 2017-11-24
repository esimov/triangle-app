import React, { Component } from 'react';
import Dialog from 'material-ui/Dialog';
import Toggle from 'material-ui/Toggle';
import Divider from 'material-ui/Divider';
import IconButton from 'material-ui/IconButton';
import PubSub from 'pubsub-js';

export default class SettingsModal extends Component {
  constructor(props) {
    super(props);

    const storage = JSON.parse(localStorage.getItem('settings.state'));
    this.state = Object.assign({}, {
      status: this.props.state,
      isDarkTheme : false,
      isWebcamEnabled : true,
    }, storage);

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

  // Store the current settings in the local storage
  componentDidUpdate() {
    const storage = (({ isDarkTheme, isWebcamEnabled }) => ({ isDarkTheme, isWebcamEnabled }))(this.state);
    localStorage.setItem('settings.state', JSON.stringify(storage));
  }

  handleClose = (event) => {
    this.setState({
      status: false
    });
  };

  handleThemeSwitch = (event, status) => {
    this.setState({
      isDarkTheme: status
    })
  }

  handleWebcamSwitch = (event, status) => {
    this.setState({
      isWebcamEnabled: status
    })
    PubSub.publish('webcam_enabled', status);
  }

  render() {
    const {isDarkTheme, isWebcamEnabled} = this.state
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
            defaultToggled={isDarkTheme}
            style={this.modal.toggleStyle}
            onToggle={this.handleThemeSwitch.bind(this)}
          />
          <Divider />
          <Toggle label="Use Webcam"
            defaultToggled={isWebcamEnabled}
            style={this.modal.toggleStyle}
            onToggle={this.handleWebcamSwitch.bind(this)}
          />
        </div>
      </Dialog>
    );
  }
}