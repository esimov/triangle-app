import React, { Component } from 'react';
import IconButton from "material-ui/IconButton";
import * as colors from 'material-ui/styles/colors';
import ReactImageMagnify from 'react-image-magnify';
import PubSub from 'pubsub-js';

export default class ResultModal extends Component {
  constructor() {
    super();
    this.state = {
      result: null,
      imgSize: {}
    };

    PubSub.subscribe('showBigImage', (event, img) => {
      this.setState({
        result: img
      })
    })

    PubSub.subscribe('onResult', (event, result) => {
      let img = new Image();
      img.onload = (event) => {
        this.setState({
          result: img.src,
          imgSize: { width: img.width, height: img.height }
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

  render() {
    const { width, height } = this.state.imgSize;
    const styles = {
      closeBtn: {
        position: "absolute",
        top: 0, left: 0,
        color: colors.white,
        cursor: "pointer",
        zIndex: 99
      },
      image: {
        display: this.state.result ? "block" : "none"
      }
    }

    return (
      <section
        id="resultImg"
        tabIndex="0"
        onKeyDown={this.handleKeyPress.bind(this)}
        ref={(result) => { this.result = result }}
        className={this.state.result ? "visible" : "hidden"}
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
          <ReactImageMagnify {...{
            smallImage: {
              alt: 'Triangulated Image',
              isFluidWidth: true,
              src: `${this.state.result}`
            },
            largeImage: {
              alt: 'Triangulated Image',
              src: `${this.state.result}`,
              width: `${width}`,
              height: `${height}`,
            },
            isHintEnabled: true,
            enlargedImagePosition: 'over'
          }}
          imageStyle={{
            maxWidth: `${window.innerWidth}`+"px",
            maxHeight: `${window.innerHeight}`+"px"
          }}
          imageClassName="smallImage"
          />
        </div>
      </section>
    );
  }
}