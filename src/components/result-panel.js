import React, { Component } from 'react';
import Paper from 'material-ui/Paper';
import * as colors from 'material-ui/styles/colors';
import PubSub from 'pubsub-js';

export default class Result extends Component {
  constructor() {
    super();
    this.state = {
      processResult: "#"
    };

    PubSub.subscribe('onResult', (event, data) => {
      this.setState({
        processResult: data.loadedImg
      })
    });
  }

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
          <img src={this.state.processResult} className="resultImg"/>
        </Paper>
      </section>
    );
  }
}