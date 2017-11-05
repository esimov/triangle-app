import React, { Component } from 'react';
import Paper from 'material-ui/Paper';
import * as colors from 'material-ui/styles/colors';
import PubSub from 'pubsub-js';
import EXIF from "exif-js";

export default class Result extends Component {
  constructor() {
    super();
    this.state = {
      processResult: "#",
      rotation: 0,
    };

    PubSub.subscribe('onResult', (event, result) => {
      let exif = EXIF.readFromBinaryFile(this.base64ToArrayBuffer(result.loadedImg));
      let orientation;

      // Get the image orientation and rotate it.
      switch (exif.Orientation) {
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
        processResult: result.loadedImg,
        rotation: orientation
      })
    });
  }

  // Convert the base64 string to an ArrayBuffer
  base64ToArrayBuffer = (base64) => {
    base64 = base64.replace(/^data\:([^\;]+)\;base64,/gmi, '');
    var binaryString = atob(base64);
    var len = binaryString.length;
    var bytes = new Uint8Array(len);

    for (var i = 0; i < len; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }
    return bytes.buffer;
  };

  render() {      
    const resultZone = {
      borderStyle: "dotted",
      borderWidth: 1,
      borderRadius: 5,
      borderColor: colors.blue700,
      cursor: "default"   
    };

    return (      
      <section className="imageRightPanel">
        <Paper className="resultZone" style={resultZone} zDepth={0}>
          <img src={this.state.processResult} className="resultImg" style={{transform: `translateY(-50%) rotate(${this.state.rotation}deg)`}} />
        </Paper>
      </section>
    );
  }
}