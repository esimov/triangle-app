import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Snackbar from 'material-ui/Snackbar';
import Dialog from 'material-ui/Dialog';
import PubSub from 'pubsub-js';
import Settings from './settings-panel';
import { activateFileMenu } from './preview-panel';

const { remote } = window.require('electron');
const request = require('request-promise');
const fs = require('fs');

const TRIANGLE_PROCESS_URL =
    process.env.NODE_ENV === 'development' ?
    'http://localhost:8080' : 'http://localhost:8080';

const style = {
  rightPanel: {
    float: "right"
  },

  customBtnStyle: {
    margin: 10
  }
};

export default class Process extends Component {
  constructor() {
    super();
    this.state = {
      value: "",
      serverError: false,
      errorMessage: "",
      processBtnDisabled: true,
      saveBtnDisabled: true,
      autoHideDuration: 4000,
      snackbarMessage: 'The image has been triangulated successfully',
      snackbarOpen: false,
      triangulatedImg: ""
    };
    this.image = null;

    PubSub.subscribe('settings', (event, data) => {
      this.options = data;
    });
    PubSub.subscribe('onImageUpload', (event, data) => {
      this.image = data;
      this.options = Object.assign(this.options, this.image);
      this.setState({
        processBtnDisabled: false
      })
    });
    PubSub.subscribe('onInvalidImage', (event, data) => {
      this.image = null;
      this.setState({
        processBtnDisabled: true
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
      'strokeWidth': parseInt(this.options.strokeWidth, 10),
      'wireframeType': parseInt(this.options.wireframeType, 10),
      'wireframeColor': JSON.stringify(this.options.solidWireframeColor),
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
        img: result.b64img
      });
      this.setState({
        saveBtnDisabled: false,
        snackbarOpen: true,
        triangulatedImg: result.b64img
      })
      activateFileMenu(true);
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

  // Open electron save dialog
  onSaveHandle() {
    remote.dialog.showSaveDialog({
      filters: [{
        name:'Image',
        extensions: ['jpg', 'png']
      }]
    }, (filePath) => {
      // Send request only when saved is pressed.
      if (filePath) {
        // Because we cannot access `fs` inside react we will save the image on Go backend, send as a post request.
        request.post({
          url: TRIANGLE_PROCESS_URL + "/save",
          headers: {
            "content-type": "application/x-www-form-urlencoded"
          },
          form: {
            url: filePath,
            b64img: this.state.triangulatedImg
          }
        }).then((res) => {
          console.log(res)
        }).catch((err) => {
          if (err.error) {
            this.setState({
              serverError: true
            })
          }
        });
      }
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
      autoHideDuration: value.length > 0 ? parseInt(value, 10) : 0,
    });
  };

  handleRequestClose() {
    this.setState({
      snackbarOpen: false,
    });
  };

  // Render
  render() {
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
            disabled={this.state.processBtnDisabled}
            style={style.customBtnStyle}
          />
          <RaisedButton
            label="Save"
            secondary={true}
            onClick={this.onSaveHandle.bind(this)}
            disabled={this.state.saveBtnDisabled}
            style={style.customBtnStyle}
          />
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
