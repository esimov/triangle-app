import React, { Component } from 'react';
import IconButton from "material-ui/IconButton";
import * as colors from 'material-ui/styles/colors';

export default class Webcam extends Component {
  constructor(props) {
    super(props)

    this.state = {
      constraints: { audio: false, video: { width: this.props.width, height: this.props.height } },
      isWebcamEnabled: false,
    };
    this.track = null;

    this.handleStartClick = this.handleStartClick.bind(this);
    this.takePicture = this.takePicture.bind(this);
    this.clearPhoto = this.clearPhoto.bind(this);
  }

  componentWillReceiveProps(webcam) {
    this.setState({
      isWebcamEnabled: webcam.isActive
    });
    if (!webcam.isActive) { return false; }

    const constraints = this.state.constraints;
    const getUserMedia = (params) => (
      new Promise((successCallback, errorCallback) => {
        navigator.getUserMedia.call(navigator, params, successCallback, errorCallback);
      })
    );

    getUserMedia(constraints)
      .then((stream) => {
        const video = document.querySelector('video');
        const vendorURL = window.URL || window.webkitURL;
        this.track = stream.getTracks()[0];  // if only one media track
        video.src = vendorURL.createObjectURL(stream);
        video.play();
      })
      .catch((err) => {
        console.log(err);
      });
    this.clearPhoto();
  }

  clearPhoto() {
    const canvas = document.querySelector('canvas');
    const photo = document.getElementById('photo');
    const context = canvas.getContext('2d');
    const { width, height } = this.state.constraints.video;
    context.fillStyle = '#FFF';
    context.fillRect(0, 0, width, height);

    const data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
  }

  handleStartClick(event) {
    event.preventDefault();
    this.takePicture();
  }

  // Stop webcam on close event
  handleCloseWebcam(event) {
    this.setState({
      isWebcamEnabled: false
    });

    // Pass state value from child to parent component.
    this.props.onWebcamClose(false);
    // Close webcam if media track is open
    if (this.track) {
      this.track.stop();
    }
  }

  handleKeyPress(event) {
    console.log(event)
  }

  takePicture() {
    const canvas = document.querySelector('canvas');
    const context = canvas.getContext('2d');
    const video = document.querySelector('video');
    const photo = document.getElementById('photo');
    const { width, height } = this.state.constraints.video;

    canvas.width = width;
    canvas.height = height;
    context.drawImage(video, 0, 0, width, height);

    const data = canvas.toDataURL('image/png');
    photo.setAttribute('src', data);
  }

  render() {
    const {width, height} = this.state.constraints.video
    const styles = {
      webcam : {
        position: "absolute",
        top: this.state.isWebcamEnabled ? -10 : -height-10, 
        left: -10,
        width: window.innerWidth, height: window.innerHeight,
        zIndex: 999
      },
      close : {
        position: "absolute",
        top: 0, left: 0,
        color: colors.white,
        cursor: "pointer",
        zIndex: 9
      }
    }

    const Camera = (props) => (
      <div className="camera">
        <video id="video" width={width} height={height}/>
        <a id="startButton"
          onClick={props.handleStartClick}

        >Take photo</a>
      </div>
    )
    const Photo = (props) => (
      <div className="output"

      >
        <img id="photo" alt="Your photo"

        />
        <a id="saveButton"
          onClick={props.handleSaveClick}

        >Save Photo</a>
      </div>
    )

    return (
      <section className={"webcam " + (this.state.isWebcamEnabled ? "enabled" : "disabled")} style={styles.webcam} onKeyPress={this.handleKeyPress.bind(this)} >
        <div className="close">
          <IconButton tooltip="Close" 
            style={styles.close} 
            onKeyboardFocus={this.handleCloseWebcam.bind(this)}
            onClick={this.handleCloseWebcam.bind(this)}
          >
            <i className="material-icons">close</i>
          </IconButton>
        </div>
        <Camera
          handleStartClick={this.handleStartClick}
        />
        <canvas id="canvas" hidden/>
        <Photo />
      </section>
    );
  }
}