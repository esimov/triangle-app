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
import placeholderImage from '../image/placeholder.png';

const {remote} = window.require('electron');
// Get remote window width and height
const {width, height} = remote.getCurrentWindow().getBounds();
// Get the saved settings from local storage
const storage = JSON.parse(localStorage.getItem('webcam.state'));

export default class Preview extends Component {
  constructor(props) {
    super(props)

    this.state = Object.assign({}, {
      dragOver  : false,
      isValid   : true,
      accepted  : [],
      rejected  : [],
      loadedImg : placeholderImage,
      rotation  : 0,
      message   : "Drop image here...",
      arrowVisibility : true,
      isWebcamEnabled : false,
      webcamStatus : false,
      windowWidth : width,
      windowHeight : height 
    }, storage);

    this.dropzoneRef = null;
    this.acceptedFile = null;
    this.activateFileMenu(false);

    PubSub.subscribe('webcam_enabled', (event, data) => {
      this.setState({
        isWebcamEnabled: data
      })
    });

    PubSub.subscribe('file-open', (event, data) => {
      this.setState({
        loadedImg : data,
        isValid: true,
        arrowVisibility: false,
        message: ""
      });
      // Send the received image to the result component
      //PubSub.publish('onImageUpload', this.state);
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
    this.acceptedFile = accepted[0]
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
      // Retrieve the EXIF information and rotate the image accordingly.
      // If we don't do this, FileReader will show each image in landscape mode.
      let exif = EXIF.readFromBinaryFile(this.base64ToArrayBuffer(result));
      let orientation;

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
      this.setState({
        loadedImg : result,
        rotation : orientation,
        arrowVisibility : false
      });
      // Send the received image to the result component
      PubSub.publish('onImageUpload', this.state);
      
      // TODO activate it after triangulation is done...
      this.activateFileMenu(true);
    }, err => {
      console.log(err)
    })
  };

  // Handle drop rejected event 
  onDropRejected() {
    this.setState({
      isValid: false,
      loadedImg: placeholderImage,
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
      webcamStatus : true
    })
  }

  // Close the webcam
  closeWebcam(event) {
    this.setState({
      webcamStatus : false
    })
  }

  receiveWebcamCapture(data) {
    this.setState({
      isValid: true,
      loadedImg: data,
      rotation: 0,
      arrowVisibility: false,
      webcamStatus: false,
      accepted: [1],
      message: ""
    })
    PubSub.publish('onImageUpload', this.state);
  }

  // Convert the base64 string to an ArrayBuffer
  base64ToArrayBuffer(base64) {
    base64 = base64.replace(/^data:([^;]+);base64,/gmi, '');
    var binaryString = atob(base64);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);

    for (var i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  // Change Save ans Save As... menu item status at runtime.
  activateFileMenu(status) {
    let menu = remote.Menu.getApplicationMenu();
    let menuItems = process.platform === "darwin" ? menu.items[1].submenu.items : menu.items[0].submenu.items;
    menuItems.map((item) => {
      if (item.sublabel === 'changeable') {
        item.enabled = status ? true : false;
      }
    });
  }

  render() {
    const dropZone = {
      position: "relative",
      width: 200,
      height: 200,
      borderStyle: "dotted",
      borderWidth: 1,
      borderRadius: 5,
      borderColor: this.state.isValid ? "rgba(25, 118, 210, 0.3)" : colors.redA700,
      backgroundColor : this.state.isValid ? "transparent" : colors.red50,
      webcamStyle : {
        position: "absolute",
        bottom: 10, right: 10, padding: 0, zIndex: 9,
        display: this.state.isWebcamEnabled ? "inline-block" : "none",
        iconStyle : {
          fontSize: 30,
          cursor: "pointer",
          color: this.state.accepted.length ? colors.grey200 : colors.blue700
        }
      }
    };

    let textColor = this.state.isValid ? colors.blue700 : colors.redA700;
    let imageWidth = this.state.message === "" ? "100%" : "auto";

    return (
      <section className="imageLeftPanel">
        <div className="dropZone">
          <Dropzone
            ref={(node) => {this.dropzoneRef = node}}
            accept="image/jpeg, image/png"
            multiple={false}
            style={dropZone}
            activeStyle={{backgroundColor:colors.green50}}
            acceptStyle={{backgroundColor:"transparent"}}
            disableClick={true}
            onDrop={this.onDrop.bind(this)}
            onDragOver={this.onDragOver.bind(this)}
            onDragLeave={this.onDragLeave.bind(this)}
            onDropAccepted={this.onDropAccepted.bind(this)}
            onDropRejected={this.onDropRejected.bind(this)}
          >
            <span className="dropIn" style={{display:this.state.arrowVisibility ? "block" : "none"}}>
              <i className="material-icons">get_app</i>
            </span>
            <span className="previewMsg" style={{color:textColor}}>{this.state.message.toUpperCase()}</span>
            <img 
              id="previewImg" 
              className="previewImg" 
              src={this.state.loadedImg} 
              style={{
                width: imageWidth,
                transform: `translateY(-50%) rotate(${this.state.rotation}deg)`
              }}
            />
            <FloatingActionButton 
              mini={true} 
              zDepth={1} 
              style={{margin: 10}} 
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
        </div><br/>
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