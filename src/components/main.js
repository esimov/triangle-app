import React, { Component } from 'react';
import {Card, CardActions} from 'material-ui/Card';
import PubSub from 'pubsub-js';
import Preview from './preview-panel';
import Result  from './result-panel';
import Options from './options-panel';
import Process from './process-panel';
import AboutModal from './about-modal';
import SettingsModal from './settings-modal';
import Loader from './loader';
import ResultModal from './result-modal';
import logo from '../image/triangle-logo.png';

const {ipcRenderer} = window.require('electron');

class Main extends Component {
  constructor() {
    super()
    this.state = {
      appInfo: {},
      aboutStatus: false,
      settingsStatus: false,
    }
  }

  componentDidMount() {
    ipcRenderer.on('open-about', (event, message) => {
      this.setState({
        aboutStatus: true,
        settingsStatus: false
      })
    })

    ipcRenderer.on('open-settings', (event, message) => {
      this.setState({
        aboutStatus: false,
        settingsStatus: true
      })
    })

    ipcRenderer.on('app-info', (event, app) => {
      this.setState({
        appInfo: {
          name: app.name,
          version: app.version
        }
      })
    })

    ipcRenderer.on('file-open', (event, image) => {
      if (image) {
        PubSub.publish('file-open', image);
      }
    })
  }

  render() {
    return (
      <div className="App">
        <Loader />
        <ResultModal />
        <AboutModal state={this.state.aboutStatus} appInfo={this.state.appInfo}/>
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
