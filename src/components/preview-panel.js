import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import * as colors from 'material-ui/styles/colors';
import PubSub from 'pubsub-js';
import EXIF from 'exif-js';
import Webcam from './webcam'
import dropzoneStyles from '../styles/app.css';

const { remote } = window.require('electron');
const fs = window.require('fs');

// Get remote window width and height
const { width, height } = remote.getCurrentWindow().getBounds();
// Get the saved settings from local storage
const storage = JSON.parse(localStorage.getItem('webcam.state'));

export default class Preview extends Component {
  constructor(props) {
    super(props)

    this.state = Object.assign({}, {
      dragOver: false,
      isValid: true,
      accepted: [],
      rejected: [],
      loadedImg: "",
      imgPath: "",
      imgsize: {},
      message: "Drop image here...",
      webcamStatus: false,
      windowWidth: width,
      windowHeight: height,
      arrowVisibility: true,
      isWebcamEnabled: false
    }, storage);

    this.dropzoneRef = null;
    this.acceptedFile = null;
    activateFileMenu(false);

    PubSub.subscribe('webcam_enabled', (event, data) => {
      this.setState({
        isWebcamEnabled: data
      })
    });

    PubSub.subscribe('file-open', (event, data) => {
      let img = this.getImage(data, (image) => {
        this.setState({
          isValid: true,
          arrowVisibility: false,
          message: "",
          loadedImg: image,
          imgPath: data
        });

        // Send the received image to the process panel
        PubSub.publish('onImageUpload', this.state);
      });
    })
  }

  // Store the current settings in the local storage
  componentDidUpdate() {
    const storage = (({ isWebcamEnabled }) => ({ isWebcamEnabled }))(this.state);
    localStorage.setItem('webcam.state', JSON.stringify(storage));
  }

  // Handle file drop event
  onDrop(accepted, rejected) {
    this.setState({
      accepted: accepted,
      rejected: rejected
    });

    if (accepted.length) {
      this.acceptedFile = accepted[0]
      this.setState({
        imgPath: this.acceptedFile.path
      })
    }
  };

  // Handle drop accepted event
  onDropAccepted(event) {
    this.setState({
      isValid: true,
      message: ""
    });

    const promise = new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(this.acceptedFile);

      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result)
        }
        else {
          reject(Error("Failed converting to base64"))
        }
      }
    });
    promise.then(result => {
      let img = this.getImage(result, (image) => {
        this.setState({
          loadedImg: image,
          arrowVisibility: false
        });

        // Send the received image to the process panel
        PubSub.publish('onImageUpload', this.state);
      });
    }, err => {
      console.log(err)
    })
  };

  // Handle drop rejected event
  onDropRejected() {
    this.setState({
      isValid: false,
      loadedImg: "",
      arrowVisibility: false,
      message: "Wrong file type!"
    });
    PubSub.publish('onInvalidImage', true);
  };

  onDragOver() {
    this.setState({
      dragOver: true
    })
  };

  onDragLeave() {
    this.setState({
      dragOver: false
    })
  };

  // Start the webcam
  startWebcam(event) {
    event.preventDefault();
    this.setState({
      webcamStatus: true
    })
  }

  // Close the webcam
  closeWebcam(event) {
    this.setState({
      webcamStatus: false
    })
  }

  receiveWebcamCapture(data) {
    this.setState({
      isValid: true,
      loadedImg: data,
      webcamStatus: false,
      arrowVisibility: false,
      message: "",
      accepted: [1]
    });

    // Send the received image to the process panel
    PubSub.publish('onImageUpload', this.state);
  }

  /**
   * Convert the base64 string to an ArrayBuffer
   * @param {string} base64
   */
  base64ToArrayBuffer(base64) {
    base64 = base64.replace(/^data:([^;]+);base64,/gmi, '');
    var binaryString = atob(base64);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);

    for (var i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  }

  /**
   * Create and return a new image to obtain it's width & height
   * @param {string} image
   */
  getImage(image, callback) {
    if (!this.isBase64(image)) {
      fs.readFile(image, (err, data) => {
        let b64img = Buffer.from(data).toString('base64')
        this.createNewImage("data:image/jpeg;base64," + b64img, callback)
      })
    } else {
      this.createNewImage(image, callback);
    }
  }

  /**
   * Generate a new image object having as source the provided base64 encoded image.
   * @param {string} image
   * @param {function} callback
   */
  createNewImage(image, callback) {
    const promise = new Promise((resolve, reject) => {
      let img = new Image();
      img.onload = (event) => {
        resolve(img)
      }
      img.src = image;
    })
    promise.then((image) => {
      // Retrieve the image EXIF information and rotate to it's normal position.
      // If we don't do this, FileReader will show each image in landscape mode.
      let exif = EXIF.readFromBinaryFile(this.base64ToArrayBuffer(image.src));
      let orientation = 0;

      // Get the image orientation and rotate it.
      switch (exif.Orientation) {
        case 1:
          orientation = 0;
          break;
        case 3:
          orientation = 180;
          break;
        case 6:
          orientation = 90;
          break;
        case 8:
          orientation = -90;
          break;
      }
      // In order to overcome the uploaded image rotation issue on MacOS,
      // we create a canvas element, draw the image into it and rotate based on exif information.
      let canvas = document.createElement('canvas');
      let ctx = canvas.getContext('2d');
      let result = "";

      var w = image.width;
      var h = image.height;
      var rads = orientation * Math.PI/180;
      var c = Math.cos(rads);
      var s = Math.sin(rads);
      if (s < 0) { s = -s; }
      if (c < 0) { c = -c; }
      // Use translated width and height for new canvas
      canvas.width = h * s + w * c;
      canvas.height = h * c + w * s;
      // Draw the rect in the center of the newly sized canvas
      ctx.translate(canvas.width/2, canvas.height/2);
      ctx.rotate(orientation * Math.PI / 180);
      ctx.drawImage(image, -image.width/2, -image.height/2);
      result = canvas.toDataURL('image/jpeg', 0.8)

      callback(result);
    })
  }

  // Check if the loaded image is base64 encoded
  isBase64(image) {
    if(/data:image\/(jpeg|png);base64/.test(image)) {
      return true;
    }
    return false;
  }

  render() {
    const theme = JSON.parse(localStorage.getItem('settings.state'));
    const dropZone = {
      position: "relative",
      width: 250,
      height: 250,
      borderStyle: "dotted",
      borderWidth: 1,
      borderRadius: 5,
      borderColor: this.state.isValid ? (theme.isDarkTheme ? colors.grey700 : "rgba(25, 118, 210, 0.3)") : colors.redA700,
      backgroundColor: this.state.isValid ? (theme.isDarkTheme ? "rgba(17,17,17, 0.2)" : "transparent") : colors.red50,
      webcamStyle: {
        position: "absolute",
        bottom: 10, right: 10, padding: 0, zIndex: 9,
        display: this.state.isWebcamEnabled ? "inline-block" : "none",
        iconStyle: {
          fontSize: 24,
          cursor: "pointer",
          padding: 8,
          borderWidth: 1,
          borderStyle: "solid",
          borderColor: colors.blue700,
          backgroundColor: colors.white,
          color: colors.blue700
        }
      }
    };

    let textColor = this.state.isValid ? colors.blue700 : colors.redA700;
    const { width, height } = this.state.imgsize;

    return (
      <section className="imageLeftPanel">
        <div className="dropZone">
          <Dropzone
            ref={(node) => { this.dropzoneRef = node }}
            accept="image/jpeg, image/png"
            multiple={false}
            style={dropZone}
            activeStyle={{ backgroundColor: colors.green50 }}
            acceptStyle={{ backgroundColor: "transparent" }}
            disableClick={true}
            onDrop={this.onDrop.bind(this)}
            onDragOver={this.onDragOver.bind(this)}
            onDragLeave={this.onDragLeave.bind(this)}
            onDropAccepted={this.onDropAccepted.bind(this)}
            onDropRejected={this.onDropRejected.bind(this)}
          >
            <span className="dropIn" style={{ display: this.state.arrowVisibility ? "block" : "none" }}>
              <i className="material-icons">get_app</i>
            </span>
            <span className="previewMsg" style={{ color: textColor }}>{this.state.message.toUpperCase()}</span>
            <img
              id="previewImg"
              className="previewImg"
              src={this.state.loadedImg}
              style={{
                maxWidth:"100%", maxHeight:"100%",
                transform: `translate(-50%, -50%)`
              }}
            />
            <FloatingActionButton
              mini={true}
              zDepth={1}
              style={{ margin: 10 }}
              backgroundColor={colors.blue700}
              onClick={() => this.dropzoneRef.open()}
            >
              <ContentAdd />
            </FloatingActionButton>
          </Dropzone>
          <IconButton id="webcam-icon"
            disableTouchRipple={true}
            className={this.state.isWebcamEnabled ? "active" : "inactive"}
            style={dropZone.webcamStyle}
            iconStyle={dropZone.webcamStyle.iconStyle}
            onClick={this.startWebcam.bind(this)}
          >
            <FontIcon className={"fa fa-camera pulse " + (this.state.accepted.length ? "white" : "blue")} />
          </IconButton>
        </div><br />
        <Webcam
          width={this.state.windowWidth}
          height={this.state.windowHeight}
          isActive={this.state.webcamStatus}
          onWebcamClose={this.closeWebcam.bind(this)}
          onScreenCapture={this.receiveWebcamCapture.bind(this)}
        />
      </section>
    );
  }
}

// Change Save ans Save As... menu item status at runtime.
export function activateFileMenu(status) {
  let menu = remote.Menu.getApplicationMenu();
  let menuItems = (navigator.platform.indexOf('Mac') !== -1) ? menu.items[1].submenu.items : menu.items[0].submenu.items;
  menuItems.map((item) => {
    if (item.sublabel === 'changeable') {
      item.enabled = status ? true : false;
    }
  });
  remote.Menu.setApplicationMenu(menu);
}