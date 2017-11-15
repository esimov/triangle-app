import React, { Component } from 'react';
import Dialog from 'material-ui/Dialog';
import IconButton from 'material-ui/IconButton';

export default class SettingsModal extends Component {
  constructor(props) {
    super(props);

    this.state = {
      status: this.props.state
    }
  }

  // Update state status in response to prop changes
  componentWillReceiveProps(nextProps) {
    this.setState({
      status: nextProps.state
    })
  }

  handleClose = (event) => {
    this.setState({
      status: false
    });
  };

  render() {
    return (
      <section id="settings">
        <div className="container">
          <Dialog
            title="Settings"
            modal={false}
            open={this.state.status}
            onRequestClose={this.handleClose.bind(this)}
            actions={
              <div className="close">
                <IconButton tooltip="Close" onClick={this.handleClose.bind(this)}>
                  <i className="material-icons">close</i>
                </IconButton>
              </div>
            }
          >
            The actions in this window were passed in as an array of React objects.
          </Dialog>
        </div>
      </section>
    );
  }
}