import React, { Component } from 'react';
import Dialog from 'material-ui/Dialog';
import IconButton from 'material-ui/IconButton';
import FontIcon from 'material-ui/FontIcon';
import logo from '../image/triangle-logo.png';

const {shell} = window.require('electron');

export default class AboutModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      status: this.props.state,
      appInfo: this.props
    }

    this.modal = {
      contentStyle: {
        width: "30%"
      },
      titleStyle: {
        fontWeight: 800
      }
    }
  }

  // Update state status in response to prop changes
  componentWillReceiveProps(nextProps) {
    this.setState({
      status: nextProps.state,
      appInfo: nextProps.appInfo
    })
  }

  handleClose = (event) => {
    this.setState({
      status: false
    });
  }

  openLink = (event) => {
    event.preventDefault();
    shell.openExternal(event.currentTarget.href);
  }

  render() {
    return (
      <Dialog
        className="about-modal"
        modal={false}
        open={this.state.status}
        onRequestClose={this.handleClose.bind(this)}
        contentStyle={this.modal.contentStyle}
        titleStyle={this.modal.titleStyle}
        actions={
          <div className="close">
            <IconButton tooltip="Close" onClick={this.handleClose.bind(this)}>
              <i className="material-icons">close</i>
            </IconButton>
          </div>
        }
      >
        <div className="content">
          <img alt={this.state.appInfo.name} src={logo}/>
          <p>
            <span><strong>{this.state.appInfo.name}</strong></span>
            <span> version </span><span><strong>{this.state.appInfo.version}</strong></span>
          </p>
          <p className="copyright">{"© 2017 Endre Simo <esimov@gmail.com>"}</p>

          <div className="links">
            <IconButton href="http://www.esimov.com" tooltip="esimov" onClick={this.openLink.bind(this)}>
              <FontIcon className="fa fa-home"/>
            </IconButton>
            <IconButton href="https://github.com/esimov" tooltip="Github" onClick={this.openLink.bind(this)}>
              <FontIcon className="fa fa-github" />
            </IconButton>
            <IconButton href="https://twitter.com/simo_endre" tooltip="Twitter" onClick={this.openLink.bind(this)}>
              <FontIcon className="fa fa-twitter"/>
            </IconButton>
          </div>
        </div>
      </Dialog>
    );
  }
}