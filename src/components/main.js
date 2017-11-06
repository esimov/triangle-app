import React, { Component } from 'react';
import {Card, CardActions} from 'material-ui/Card';
import Preview from './preview-panel';
import Result  from './result-panel';
import Options from './options-panel';
import Process from './process-panel';
import Loader from './loader';

class Main extends Component {
  render() {
    return (      
        <div className="App">
          <Loader />
          <Card containerStyle={{padding: 2}} className="cardWrapper" >
            <CardActions>
              <Preview />
              <section className="middlePanel">
                <span className="triangle-header"><span className="symbol">▲</span>Triangle</span>
              </section>
              <Result />
              <Options />                     
              <Process />
            </CardActions>
          </Card>
        </div>
    );
  }
}

export default Main;
