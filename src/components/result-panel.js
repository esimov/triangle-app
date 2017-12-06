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
    };

    PubSub.subscribe('is_dark_theme', (event, data) => {
      this.setState({
        isDarkTheme: data
      })
    })

    PubSub.subscribe('onResult', (event, result) => {
      this.setState({
        resultImage: result.img,
        processed: true,
      });
    });
  }

  showBigImage() {
    if (!this.state.processed) {
      return;
    }
    PubSub.publish('showBigImage', this.state.resultImage)
  }

  render() {
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
              maxWidth:"100%", maxHeight:"100%",
              transform: `translate(-50%, -50%)`
            }}
          />
        </Paper>
      </section>
    );
  }
}