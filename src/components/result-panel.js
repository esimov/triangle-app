import React, { Component } from 'react';
import Paper from 'material-ui/Paper';
import * as colors from 'material-ui/styles/colors';

export default class Result extends Component {
  constructor() {
    super()        
    this.state = {      
    }    
  }

  render() {      
    const resultZone = {
      borderStyle: "dotted",
      borderWidth: 1,
      borderRadius: 5,
      borderColor: colors.cyan600,
      cursor: "default"   
    }

    return (      
      <section className="imageRightPanel">
        <Paper className="resultZone" style={resultZone} zDepth={0}>
          <img src="#" className="resultImg"/>
        </Paper>
      </section>
    );
  }
}