import React, { Component } from 'react';
import {Card, CardActions} from 'material-ui/Card';
import Preview from './preview-panel';
import Options from './options-panel';
import Process from './process-panel';

class Main extends Component {
  render() {
    return (      
        <div className="App">
          <Card containerStyle={{padding: 20}}>
            <CardActions>
              <Preview />
              <Options />                     
              <Process />
            </CardActions>
          </Card>                            
        </div>
    );
  }
}

export default Main;
