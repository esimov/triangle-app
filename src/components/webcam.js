import React, { Component } from 'react';
import IconButton from "material-ui/IconButton";
import FontIcon from "material-ui/FontIcon";
import * as colors from 'material-ui/styles/colors';
import tick from '../sound/tick.mp3';
import shutter from '../sound/camera-shutter-click.mp3';
const { Synth, Player } = require('tone');

export default class Webcam extends Component {
  constructor(props) {
    super(props)

    this.state = {
      constraints: { audio: false, video: { width: this.props.width, height: this.props.height } },
      isWebcamEnabled: false,
      counterIsActive: false,
      videoSrc: null,
      counter: 3,
      blitz: false
    };

    this.track = null;
    this.handleSnapshot = this.handleSnapshot.bind(this);
    this.handleScreenCapture = this.handleScreenCapture.bind(this);
    this.takePicture = this.takePicture.bind(this);
    this.clearPhoto = this.clearPhoto.bind(this);

    // Change webcam screen width and height on window resize
    window.addEventListener('resize', () => {
      const { remote } = window.require('electron');
      // Get remote window width and height
      const { width, height } = remote.getCurrentWindow().getBounds();
      this.setState({
        constraints: {
          video: {
            width: width,
            height: height
          }
        }
      })
    })
  }

  // Focus webcam modal after the component has been rendered.
  componentDidUpdate() {
    this.webcam.focus()
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
        this.setState({
          videoSrc: vendorURL.createObjectURL(stream)
        })
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

  takePicture() {
    let snapshot = new Promise((resolve, reject) => {
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
      resolve(data);
    })
    snapshot.then((image) => {
      // Take the screen capture and send it to the parent (preview) component.
      this.props.onScreenCapture(image);
    })
    snapshot.then(() => {
      this.handleCloseWebcam()
    })
  }

  // This will initiate the countdown event.
  handleSnapshot(event) {
    event.preventDefault();
    this.setState({
      counterIsActive: true
    })
  }

  // Stop webcam on close event
  handleCloseWebcam(event) {
    this.setState({
      isWebcamEnabled: false,
      counterIsActive: false
    });

    // Pass state value from child to parent component.
    this.props.onWebcamClose(false);
    // Close webcam if media track is open
    if (this.track) {
      this.track.stop();
    }
  }

  // Close webcam modal on ESC keypress.
  handleKeyPress(event) {
    if (this.state.isWebcamEnabled && event.keyCode === 27) {
      this.handleCloseWebcam(event)
    }
  }

  // Take the snapshot after countdown is over.
  handleScreenCapture(done) {
    this.setState({
      counterIsActive: false
    })
    if (done) {
      // Need to delay the screenshot capture a fraction of the second, otherwise the `takePicture` method
      // will be triggered at the same moment with the state change, generating an empty image.
      setTimeout(() => {
        this.takePicture()
      }, 50)
    }
  }

  render() {
    const { width, height } = this.state.constraints.video
    const styles = {
      webcam: {
        position: "absolute",
        display: "block",
        left: -10, top: this.state.isWebcamEnabled ? -10 : -height - 10,
        width: window.innerWidth, height: window.innerHeight,
        backgroundColor: colors.black,
        zIndex: 999
      },
      closeBtn: {
        position: "absolute",
        top: 0, left: 0,
        color: colors.white,
        cursor: "pointer",
        zIndex: 99
      },
      captureBtn: {
        position: "absolute",
        left: "50%",
        bottom: 20
      }
    }

    const Camera = (props) => (
      <div className="camera">
        <video id="video" autoPlay="true" src={this.state.videoSrc} width={width} height={height} />
        <Counter
          counterIsActive={this.state.counterIsActive}
          counter={this.state.counter}
          handleScreenCapture={this.handleScreenCapture.bind(this)}
        />
        <IconButton
          disabled={this.state.counterIsActive ? true : false}
          disableTouchRipple={true}
          onClick={props.onWebcamClick}
          style={styles.captureBtn}
          iconStyle={{
            color: colors.white,
            fontSize: 40
          }}
        >
          <FontIcon className={"fa fa-camera pulse white"} />
        </IconButton>
      </div>
    )

    const Photo = (props) => (
      <div className="output">
        <img id="photo" alt="" />
      </div>
    )

    return (
      <section
        className={"webcam " + (this.state.isWebcamEnabled ? "enabled" : "disabled")}
        style={styles.webcam}
        tabIndex="0"
        onKeyDown={this.handleKeyPress.bind(this)}
        ref={(webcam) => { this.webcam = webcam }}
      >
        <div className="close">
          <IconButton tooltip="Close"
            style={styles.closeBtn}
            onKeyboardFocus={this.handleCloseWebcam.bind(this)}
            onClick={this.handleCloseWebcam.bind(this)}
          >
            <i className="material-icons">close</i>
          </IconButton>
        </div>
        <canvas id="canvas" hidden />
        <Camera onWebcamClick={this.handleSnapshot.bind(this)} />
        <Photo />
      </section>
    );
  }
}

// Counter react component activated on webcam snapshot, receiving the state from it's parent (Webcam)
export class Counter extends Component {
  constructor(props) {
    super(props)

    this.synth = new Synth().toMaster();
    this.state = {
      counterIsActive: this.props.counterIsActive,
      counter: this.props.counter,
      screenCaptured: false
    }
  }

  // Mount component on countdown start
  componentDidMount() {
    // A simple time counter, showing the seconds remaining before the webcam snapshot is summoned.
    if (this.state.counterIsActive) {
      let tickSound = new Player({
        "url": tick,
        "autostart": true,
      })
      // Play tick sound.
      tickSound.toMaster()

      let counter = this.state.counter;
      this.interval = setInterval(() => {
        let tickSound = new Player({
          "url": tick,
          "autostart": true,
        })
        if (counter === 1) {
          this.setState({
            blitz: true
          })
        }
        if (counter > 0) {
          counter--;
          this.setState({
            counter: counter
          })
          // Play tick sound.
          tickSound.toMaster()
        } else {
          let shutterSound = new Player({
            "url": shutter,
            "autostart": true,
          }).toMaster();

          clearInterval(this.interval)
          this.setState({
            screenCaptured: true,
            blitz: false
          })
          // Pass state value from child to parent component.
          this.props.handleScreenCapture(this.state.screenCaptured);
        }
      }, 1000)
    }
  }

  // Unmount component on clear interval
  componentWillUnmount() {
    clearInterval(this.interval)
  }

  render() {
    const styles = {
      counter: {
        display: this.state.counterIsActive ? "block" : "none",
        position: "absolute",
        top: "50%",
        left: "47%",
        transform: "translateY(-50%)",
        fontSize: 250,
        fontWeight: 100,
        color: colors.white,
        cursor: "default"
      },
      blitzBtn: {
        top: "50%", left: "50%",
        transform: "translate(-50%, -50%)",
        fontSize: 80,
        color: colors.red500
      }
    }
    let counterValue = (this.state.counter > 0) ? this.state.counter : "";
    return (
      <div className="counter" style={styles.counter}>
        <div className="wrapper">
          <span>{counterValue}</span>
          <FontIcon className={"blitz fa" + (this.state.blitz ? " fa-camera" : "")} style={styles.blitzBtn} />
        </div>
      </div>
    )
  }
}