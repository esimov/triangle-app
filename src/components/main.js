import React, { Component } from 'react';
import Options from './options';
import Process from './process';

class Main extends Component {
  render() {
    return (      
        <div className="App">
          <Options />
          <Process />
        </div>
    );
  }
}

export default Main;
