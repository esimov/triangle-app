import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import * as colors from 'material-ui/styles/colors';
import PubSub from 'pubsub-js';
import dropzoneStyles from '../styles/app.css';
import EXIF from "exif-js";

export default class Preview extends Component {
  constructor() {
    super();
    this.state = {
      dragOver  : false,
      isValid   : true,
      accepted  : [],
      rejected  : [],
      loadedImg : "#",
      rotation  : 0,
      message   : "Drop image here...",
      arrowVisibility : true
    };
    this.acceptedFile = null
  }

  onDrop = (accepted, rejected) => {    
    this.setState({
      accepted: accepted,
      rejected: rejected
    });
    this.acceptedFile = accepted[0]
  };

  onDropAccepted = (event) => {
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
      // Retrieve the EXIF information from the image file and rotate the image.
      // If we don't do this FileReader will show each image in landscape mode.
      let exif = EXIF.readFromBinaryFile(this.base64ToArrayBuffer(result));
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
        loadedImg : result,
        rotation : orientation,
        arrowVisibility : false
      });
      PubSub.publish('onDroppedImage', this.state);
    }, err => {
      console.log(err)
    })    
  };

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

  onDropRejected = () => {    
    this.setState({
      isValid: false,
      loadedImg: "#",
      message: "Wrong file type!"
    })
  };

  onDragOver = () => {
    this.setState({
      dragOver: true
    })    
  };

  onDragLeave = () => {
    this.setState({
      dragOver: false
    })
  };

  render() {    
    const dropZone = {
      position: "relative",      
      width: 200,
      height: 200,
      borderStyle: "dotted",
      borderWidth: 1,
      borderRadius: 5,
      borderColor: this.state.isValid ? colors.blue700 : colors.redA700,
      backgroundColor : this.state.isValid ? "transparent" : colors.red50
    };

    let textColor = this.state.isValid ? colors.blue700 : colors.redA700;

    return (      
      <section className="imageLeftPanel">
        <div className="dropZone">
          <Dropzone 
            accept="image/jpeg, image/png"
            multiple={false}
            style={dropZone}
            activeStyle={{backgroundColor:colors.green50}}
            acceptStyle={{backgroundColor:"transparent"}}            
            onDrop={this.onDrop.bind(this)}
            onDragOver={this.onDragOver.bind(this)}
            onDragLeave={this.onDragLeave.bind(this)}
            onDropAccepted={this.onDropAccepted.bind(this)}
            onDropRejected={this.onDropRejected.bind(this)}
          >
            <span className="dropIn" style={{display:this.state.arrowVisibility ? "block" : "none"}}>
              <i className="material-icons">get_app</i>
            </span>
            <span className="previewMsg" style={{color:textColor}}>{this.state.message}</span>
            <img id="previewImg" className="previewImg" src={this.state.loadedImg} attr={this.state.rotation} style={{transform: `translateY(-50%) rotate(${this.state.rotation}deg)`}}/>

            <FloatingActionButton mini={true} backgroundColor={colors.blue700} style={{margin: 10}} zDepth={1} >
              <ContentAdd />
            </FloatingActionButton>
          </Dropzone>
        </div><br/>
      </section>
    );
  }
}