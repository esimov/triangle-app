import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import { blueGrey200 } from 'material-ui/styles/colors';
import PubSub from 'pubsub-js';
import Settings from './settings-panel';

const style = {
  rightPanel: {
    float: "right"
  },

  customInputStyle: {
    borderColor: blueGrey200,
    color: blueGrey200
  },

  customBtnStyle: {
    margin: 10
  }
};

export default class Process extends Component {
  constructor() {
    super();
    this.state = {
      open : false,
      value : "",
      errorMessage : "",
      btnDisabled: true
    };
    this.image = null;

    PubSub.subscribe('settings', (event, data) => {
      this.options = data;
    });
    PubSub.subscribe('onDroppedImage', (event, data) => {
      this.image = data;
      this.options = Object.assign(this.options, this.image);
      this.setState({
        btnDisabled: false
      })
    });
    PubSub.subscribe('onInvalidImage', (event, data) => {
      this.image = null;
      this.setState({
        btnDisabled: true
      })
    });
  }

  // Restore default settings
  restoreDefaults = () => {
    ReactDOM.findDOMNode(Settings.restoreDefaults.refs.container).click();
  };

  // Preview triangulated image
  onPreview = () => {
    PubSub.publish('onPreview', true);
    //TODO Get request ....then
    window.setTimeout(() => {
      PubSub.publish('onPreview', false);
      PubSub.publish('onResult', this.options);
    }, 2000);
  };

  // Open save modal panel
  onModalOpen = () => {
    this.setState({
      open: true
    });
  };

  // Save triangulated image
  onSave = () => {
    if (this.state.value === "") {
      this.inputName.focus();
      this.setState({
        errorMessage: "This field is required"
      });
      return false;
    }
    this.setState({
      value: "",
      errorMessage: "",
      open: false
    });
    const options = JSON.stringify(this.options);
    console.log(this.options);
  };

  // Close save modal panel
  onClose = () => {
    this.setState({
      open: false
    });
  };

  handleInputChange = (event) => {
    this.setState({
      value : event.target.value
    })
  };

  // Render
  render() {
    const actions = [
      <RaisedButton
        label="Save"
        primary={true}
        onClick={this.onSave}
        keyboardFocused={true}
        style={style.customBtnStyle}
      />,
      <RaisedButton
        label="Cancel"
        secondary={true}
        onClick={this.onClose}
        style={style.customBtnStyle}
      />
    ];

    return (
      <section className="Process">
        <span style={style.leftPanel}>
          <RaisedButton label="Restore Defaults" onClick={this.restoreDefaults} style={style.customBtnStyle} />
        </span>
        <span style={style.rightPanel}>
          <RaisedButton
            label="Preview"
            primary={true}
            onClick={this.onPreview}
            disabled={this.state.btnDisabled}
            style={style.customBtnStyle}
          />
          <RaisedButton
            label="Process"
            secondary={true}
            onClick={this.onModalOpen}
            disabled={this.state.btnDisabled}
            style={style.customBtnStyle}
          />
          <Dialog
            title="Save triangulated image"
            actions={actions}
            modal={false}
            open={this.state.open}
            onRequestClose={this.onClose}
          >
            <span>File name:</span><br />
            <TextField
              hintText="File Name"
              errorText={this.state.errorMessage}
              floatingLabelText="File Name"
              floatingLabelStyle={style.customInputStyle}
              floatingLabelFocusStyle={style.customInputStyle}
              value={this.state.value}
              ref={(inputName) => this.inputName = inputName}
              onChange={this.handleInputChange}
            /><br />
          </Dialog>
        </span>
      </section>
    );
  }
}
