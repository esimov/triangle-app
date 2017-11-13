import React, { Component } from 'react';
import {Card, CardActions} from 'material-ui/Card';
import Preview from './preview-panel';
import Result  from './result-panel';
import Options from './options-panel';
import Process from './process-panel';
import AboutModal from './about-modal';
import SettingsModal from './settings-modal';
import Loader from './loader';
import logo from '../image/triangle-logo.png';

const {ipcRenderer} = window.require('electron');

class Main extends Component {
  constructor() {
    super()
    this.state = {
      aboutStatus: false,
      settingsStatus: false
    }
  }
  componentDidMount() {
    ipcRenderer.on('open-about', (event, message) => {
      this.setState({
        aboutStatus: true
      })
    })

    ipcRenderer.on('open-settings', (event, message) => {
      this.setState({
        settingsStatus: true
      })
    })
  }

  render() {
    return (
        <div className="App">
          <Loader />
          <AboutModal state={this.state.aboutStatus}/>
          <SettingsModal state={this.state.settingsStatus}/>
          <Card containerStyle={{padding: 2}} className="cardWrapper" >
            <CardActions>
              <Preview />
              <section className="middlePanel">
                <span className="triangle-header"><img src={logo} alt="triangle-logo"/><span className="symbol"> Triangle</span></span>
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
