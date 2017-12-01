import React, { Component } from 'react';
import IconButton from "material-ui/IconButton";
import * as colors from 'material-ui/styles/colors';
import PubSub from 'pubsub-js';
import EXIF from "exif-js";

export default class ResultModal extends Component {
  constructor() {
    super();
    this.state = {
      result: null,
      imgsize: {},
      rotation: 0
    };

    PubSub.subscribe('showBigImage', (event, img) => {
      console.log(img);
      this.setState({
        result: img
      })
    })

    PubSub.subscribe('onResult', (event, result) => {
      let img = new Image();
      img.onload = (event) => {
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        let imgWidth = (img.width > window.innerWidth) ? "100%" : img.width;
        let imgHeight = (img.height > window.innerHeight) ? "100%" : img.height;

        if (img.height > img.width) {
          imgWidth = "auto";
        }

        this.setState({
          result: img.src,
          imgsize: {width: imgWidth, height: imgHeight},
          rotation: result.rotation
        })
      }
      img.src = result.img;
    })
  }

  // Focus result modal after the component has been updated.
  componentDidUpdate() {
    this.result.focus()
  }

  // Close result modal.
  handleClose(event) {
    this.setState({
      result: null
    });
  }

  // Close result modal by pressing ESC key.
  handleKeyPress(event) {
    if (this.state.result && event.keyCode === 27) {
      this.handleClose(event)
    }
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

  render() {
    const {width, height} = this.state.imgsize;
    const styles = {
      closeBtn : {
        position: "absolute",
        top: 0, left: 0,
        color: colors.white,
        cursor: "pointer",
        zIndex: 99
      }
    }

    return (
      <section
        id="resultImg"
        tabIndex="0"
        onKeyDown={this.handleKeyPress.bind(this)}
        ref={(result) => {this.result = result}}
        className={this.state.result ? "visible" : "hidden" }
      >
        <div className="close">
          <IconButton tooltip="Close"
            style={styles.closeBtn}
            onKeyboardFocus={this.handleClose.bind(this)}
            onClick={this.handleClose.bind(this)}
          >
            <i className="material-icons">close</i>
          </IconButton>
        </div>
        <div className="container">
          <img src={this.state.result} style={{width: width, height:height, transform: `translate(-50%, -50%) rotate(${this.state.rotation}deg)`}} />
        </div>
      </section>
    );
  }
}