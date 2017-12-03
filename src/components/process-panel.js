import React, { Component } from 'react';
import ReactDOM from 'react-dom';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import { blueGrey200 } from 'material-ui/styles/colors';
import PubSub from 'pubsub-js';
import Settings from './settings-panel';

const request = require('request-promise');

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
      errorMessage: "",
      btnDisabled: true
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

    const address = "http://localhost:8080";
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

    let callbackEvent = () => {
      let evtSource = new EventSource(address + "/triangle");

      evtSource.addEventListener('image', (e) => {
        let result = JSON.parse(e.data);

        PubSub.publish('onResult', {
          img: result.b64img,
          rotation: this.options.rotation
        });
        // Close event source connection
        evtSource.close();
        PubSub.publish('onProcess', false);
      })

      evtSource.addEventListener("problem", (e) => {
        console.log(e.data)
      })
    }

    // Send ajax request to image server
    request.post({
      url: address + "/images",
      headers: {
        "content-type": "application/x-www-form-urlencoded"
      },
      form: options
    }).then((res) => {
      console.log(res);
    }).catch((err) => {
      // We need to call the callback fucntion on error, 
      // because we handle the response on EventSource
      callbackEvent()
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
            <span>File name:</span><br />
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
        </span>
      </section>
    );
  }
}
