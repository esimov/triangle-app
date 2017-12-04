import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Snackbar from 'material-ui/Snackbar';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import { blueGrey200 } from 'material-ui/styles/colors';
import PubSub from 'pubsub-js';
import Settings from './settings-panel';

const request = require('request-promise');
const TRIANGLE_PROCESS_URL = process.env.NODE_ENV === 'development' ? 'http://localhost:8080' : 'http://localhost:8080';

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
      open: false,
      value: "",
      serverError: false,
      errorMessage: "",
      btnDisabled: true,
      autoHideDuration: 4000,
      snackbarMessage: 'The image has been triangulated successfully !',
      snackbarOpen: false,
    };
    this.image = null;

    PubSub.subscribe('settings', (event, data) => {
      this.options = data;
    });
    PubSub.subscribe('onImageUpload', (event, data) => {
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
  restoreDefaults() {
    ReactDOM.findDOMNode(Settings.restoreDefaults.refs.container).click();
  };

  // Process triangulated image
  onProcess() {
    PubSub.publish('onProcess', true);
    let options = {},
      sliders = {},
      toggleItems = {}

    this.options.sliders.forEach((slider) => {
      sliders[slider.name] = slider.currentVal;
    }, this);

    this.options.toggleItems.forEach((toggleItem) => {
      toggleItems[toggleItem.name] = toggleItem.status;
    }, this);


    Object.assign(options, {
      'image': this.options.loadedImg,
      'imagePath': this.options.imgPath || "Webcam",
      'wireframeType': parseInt(this.options.wireframeType, 10),
      'strokeWidth': parseInt(this.options.strokeWidth, 10),
      ...sliders,
      ...toggleItems
    })

    // Send ajax request to image server
    request.post({
      url: TRIANGLE_PROCESS_URL + "/images",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      form: options
    }).then((res) => {
      let result = JSON.parse(res);

      PubSub.publish('onResult', {
        img: result.b64img,
        rotation: this.options.rotation,
      });
      this.setState({
        snackbarOpen: true
      })
      PubSub.publish('onProcess', false);
    }).catch((err) => {
      PubSub.publish('onProcess', false);
      if (err.error) {
        this.setState({
          serverError: true
        })  
      }
    })
  };

  // Open save modal panel
  onModalOpen() {
    this.setState({
      open: true
    });
  };

  // Save triangulated image
  onSave() {
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
  onClose() {
    this.setState({
      open: false
    });
  };

  handleInputChange(event) {
    this.setState({
      value: event.target.value
    })
  };

  handleCloseModal(event) {
    this.setState({serverError: false});
  };

  handleActionTouchTap() {
    this.setState({
      snackbarOpen: false,
    });
  };

  handleChangeDuration(event) {
    const value = event.target.value;
    this.setState({
      autoHideDuration: value.length > 0 ? parseInt(value) : 0,
    });
  };

  handleRequestClose() {
    this.setState({
      snackbarOpen: false,
    });
  };

  // Render
  render() {
    const actions = [
      <RaisedButton
        label="Save"
        secondary={true}
        onClick={this.onSave.bind(this)}
        keyboardFocused={true}
        style={style.customBtnStyle}
      />,
      <RaisedButton
        label="Cancel"
        primary={true}
        onClick={this.onClose.bind(this)}
        style={style.customBtnStyle}
      />
    ];

    return (
      <section className="Process">
        <span style={style.leftPanel}>
          <RaisedButton label="Restore Defaults" onClick={this.restoreDefaults.bind(this)} style={style.customBtnStyle} />
        </span>
        <span style={style.rightPanel}>
          <RaisedButton
            label="Process"
            primary={true}
            onClick={this.onProcess.bind(this)}
            disabled={this.state.btnDisabled}
            style={style.customBtnStyle}
          />
          <RaisedButton
            label="Save"
            secondary={true}
            onClick={this.onModalOpen.bind(this)}
            disabled={this.state.btnDisabled}
            style={style.customBtnStyle}
          />
          <Dialog
            title="Save triangulated image"
            actions={actions}
            modal={false}
            open={this.state.open}
            onRequestClose={this.onClose.bind(this)}
          >
            <TextField
              hintText="File Name"
              errorText={this.state.errorMessage}
              floatingLabelText="File Name"
              floatingLabelStyle={style.customInputStyle}
              floatingLabelFocusStyle={style.customInputStyle}
              value={this.state.value}
              ref={(inputName) => this.inputName = inputName}
              onChange={this.handleInputChange.bind(this)}
            /><br />
          </Dialog>
          <Dialog
            title="Server Error"
            actions={
              <FlatButton
                label="OK"
                primary={true}
                keyboardFocused={true}
                onClick={this.handleCloseModal.bind(this)}
              />
            }
            modal={false}
            open={this.state.serverError}
            onRequestClose={this.handleCloseModal.bind(this)}
          >
            The server is down or stopped handling requests. Please contact the server administrator.
          </Dialog>
          <Snackbar
            open={this.state.snackbarOpen}
            message={this.state.snackbarMessage}
            autoHideDuration={this.state.autoHideDuration}
            onActionTouchTap={this.handleActionTouchTap.bind(this)}
            onRequestClose={this.handleRequestClose.bind(this)}
          />
        </span>
      </section>
    );
  }
}
