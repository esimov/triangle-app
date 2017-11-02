import React, { Component } from 'react';
import Dropzone from 'react-dropzone';
import FloatingActionButton from 'material-ui/FloatingActionButton';
import ContentAdd from 'material-ui/svg-icons/content/add';
import * as colors from 'material-ui/styles/colors';
import dropzoneStyles from '../styles/app.css';

export default class Preview extends Component {
  constructor() {
    super()        
    this.state = {
      dragOver : false,       
      isValid : true,
      accepted : [],
      rejected : [],    
      loadedImg : "#",
      message : "Drop image here...",  
    }
    this.acceptedFile = null
  }

  onDrop = (accepted, rejected) => {    
    this.setState({
      accepted: accepted,
      rejected: rejected,
    });
    this.acceptedFile = accepted[0]
  }

  onDropAccepted = () => {    
    this.setState({
      isValid: true,
      message: ""
    })

    const promise = new Promise((resolve, reject) => {
      const reader = new FileReader()          
      reader.readAsDataURL(this.acceptedFile)
      reader.onload = () => {
        if (reader.result) {
          resolve(reader.result)
        }
        else {
          reject(Error("Failed converting to base64"))
        }
      }
    })
    promise.then(result => {
      this.setState({
        loadedImg : result
      })      
    }, err => {
      console.log(err)
    })    
  }

  onDropRejected = () => {    
    this.setState({
      isValid: false,
      loadedImg: "#",
      message: "Unsupported file type!"
    })
  }

  onDragOver = () => {
    this.setState({
      dragOver: true,
    })    
  }

  onDragLeave = () => {
    this.setState({
      dragOver: false,
    })
  }

  render() {    
    const dropZone = {
      position: "relative",
      backgroundColor : this.state.dragOver ? (this.state.isValid ? "transparent" : colors.red50) : colors.grey50,
      width: 200,
      height: 200,
      borderStyle: "dotted",
      borderWidth: 1,
      borderRadius: 5,
      borderColor: this.state.isValid ? colors.cyan600 : colors.redA700,
      cursor: "default"   
    }
    let textColor = this.state.isValid ? colors.cyan600 : colors.redA700
    return (      
      <section>
        <div className="dropZone">
          <Dropzone 
            accept="image/jpeg, image/png"
            multiple={false}
            style={dropZone}
            onDrop={this.onDrop.bind(this)}
            onDragOver={this.onDragOver.bind(this)}
            onDragLeave={this.onDragLeave.bind(this)}
            onDropAccepted={this.onDropAccepted.bind(this)}
            onDropRejected={this.onDropRejected.bind(this)}
          >
            <span className="previewMsg" style={{color:textColor}}>{this.state.message}</span>
            <img id="previewImg" className="previewImg" src={this.state.loadedImg}/>
            <FloatingActionButton mini={true} backgroundColor={colors.cyan600} style={{margin: 10}} zDepth={1} >
              <ContentAdd />
            </FloatingActionButton>
          </Dropzone>
        </div><br/>
      </section>
    );
  }
}