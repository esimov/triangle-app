import React, { Component } from 'react';
import Paper from 'material-ui/Paper';
import * as colors from 'material-ui/styles/colors';
import PubSub from 'pubsub-js';
import EXIF from "exif-js";
import placeholderImage from '../image/placeholder-image.png';

export default class Result extends Component {
  constructor() {
    super();

    // Get the saved settings from local storage
    this.storage = JSON.parse(localStorage.getItem('settings.state'));
    this.state = {
      resultImage: placeholderImage,
      isDarkTheme: this.storage.isDarkTheme,
      processed: false,
      rotation: 0,
      imgsize: {}
    };

    PubSub.subscribe('is_dark_theme', (event, data) => {
      this.setState({
        isDarkTheme: data
      })
    })

    PubSub.subscribe('onResult', (event, result) => {
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
      let img = this.getImage(result, (image) => {
        this.setState({
          resultImage: result,
          rotation : orientation,
          processed: true,
          imgsize: {width: image.width, height: image.height}
        });
      });
    });
  }

  showBigImage() {
    if (!this.state.processed) {
      return;
    }
    PubSub.publish('showBigImage', this.state.resultImage)
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
  }

  /**
   * Return loaded image width & height
   * @param {string} image
   */
  getImage(image, callback) {
    let img, imgWidth, imgHeight;
    const promise = new Promise((resolve, reject) => {
      img = new Image();
      img.onload = (event) => {
        resolve(img)
      }
      img.src = image;
    })
    promise.then((img) => {
      imgWidth = (img.width > img.height) ? "100%" : "auto";
      imgHeight = (img.height > img.width) ? "100%" : "auto";

      if (img.width === img.height) {
        imgWidth = "100%";
        imgHeight = "100%";
      }

      let resultImg = {
        src    : img.src,
        width  : imgWidth,
        height : imgHeight
      }
      callback(resultImg);
    })
  }

  render() {
    const {width, height} = this.state.imgsize;
    const resultZone = {
      position: "relative",
      borderStyle: "dotted",
      borderWidth: 1,
      borderRadius: 5,
      borderColor: this.state.isDarkTheme ? colors.grey700 : "rgba(25, 118, 210, 0.3)",
      backgroundColor: this.state.isDarkTheme ? "rgba(17,17,17, 0.4)" : "transparent",
      cursor: "default"
    };

    return (
      <section className="imageRightPanel">
        <Paper className="resultZone" style={resultZone} zDepth={0} onClick={this.showBigImage.bind(this)}>
          <img
            src={this.state.resultImage}
            className="resultImg"
            style={{
              width: width, height:height,
              transform: `translate(-50%, -50%) rotate(${this.state.rotation}deg)`
            }}
          />
        </Paper>
      </section>
    );
  }
}