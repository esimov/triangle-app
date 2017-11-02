import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import TextField from 'material-ui/TextField';
import { blueGrey200 } from 'material-ui/styles/colors';

const style = {
  leftPanel: {
    display: "flex",
    flexWrap: "wrap",    
    float: "left"
  },

  rightPanel: {
    display: "flex",
    flexWrap: "wrap",    
    float: "right"
  },

  customInputStyle: {
    borderColor: blueGrey200,
    color: blueGrey200
  },
  
  customBtnStyle: {
    margin: 10
  }
};

export default class Process extends Component {
  constructor() {
    super()
    this.state = {
      open : false
    }
  }

  // Clear preview
  onClear = () => {
    console.log('On clear');
  }

  // Preview triangulated image
  onPreview = () => {
    console.log('On preview');
  }

  // Save triangulated image
  onSave = () => {
    console.log('On image save');
    this.setState({
      open: false
    });
  }

  // Open save modal panel
  onModalOpen = () => {
    console.log('On save');
    this.setState({
      open: true
    });
  }

  // Close save modal panel
  onModalClose = () => {
    this.setState({
      open: false
    });
  }

  // Render 
  render() {
    const actions = [
      <RaisedButton
        label="Save"
        primary={true}
        onClick={this.onSave}
        style={style.customBtnStyle}
      />,
      <RaisedButton
        label="Cancel"
        secondary={true}
        keyboardFocused={true}
        onClick={this.onModalClose}
        style={style.customBtnStyle}
      />,
    ];

    return (
      <div className="Process">
        <div style={style.leftPanel}>
          <RaisedButton label="Clear Drawing" onClick={this.onClear} style={style.customBtnStyle} />
        </div>
        <div style={style.rightPanel}>
          <RaisedButton
            label="Preview"
            primary={true}
            onClick={this.onPreview}
            style={style.customBtnStyle}
          />
          <RaisedButton
            label="Process"
            secondary={true}
            onClick={this.onModalOpen}
            style={style.customBtnStyle}
          />
          <Dialog
            title="Save triangulated image"
            actions={actions}
            modal={false}
            open={this.state.open}
            onRequestClose={this.onModalClose}
          >
            File name:<br />
            <TextField
              hintText="File Name"
              floatingLabelText="File Name"
              floatingLabelStyle={style.customInputStyle}
              floatingLabelFocusStyle={style.customInputStyle}
            /><br />
          </Dialog>
        </div>
      </div>
    );
  }
}
