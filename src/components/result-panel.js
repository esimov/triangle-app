import React, { Component } from 'react';
import Paper from 'material-ui/Paper';
import * as colors from 'material-ui/styles/colors';
import PubSub from 'pubsub-js';
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
      let img = this.getImage(result.img, (data) => {
        this.setState({
          resultImage: result.img,
          rotation: result.rotation,
          processed: true,
          imgsize: { width: data.width, height: data.height }
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

  /**
   * Return loaded image width & height
   * @param {string} image
   */
  getImage(image, callback) {
    const promise = new Promise((resolve, reject) => {
      let img = new Image();
      img.onload = (event) => {
        resolve(img)
      }
      img.src = image;
    })
    promise.then((img) => {
      let imgWidth = (img.width > img.height) ? "100%" : "auto";
      let imgHeight = (img.height > img.width) ? "100%" : "auto";

      if (img.width === img.height) {
        imgWidth = "100%";
        imgHeight = "100%";
      }

      let resultImg = {
        src: img.src,
        width: imgWidth,
        height: imgHeight
      }
      callback(resultImg);
    })
  }

  render() {
    const { width, height } = this.state.imgsize;
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
              width: width, height: height,
              transform: `translate(-50%, -50%) rotate(${this.state.rotation}deg)`
            }}
          />
        </Paper>
      </section>
    );
  }
}