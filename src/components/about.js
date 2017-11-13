import React, { Component } from 'react';
import Dialog from 'material-ui/Dialog';
import IconButton from 'material-ui/IconButton';

export default class About extends Component {
  constructor() {
    super();

    this.state = {
      open: false
    };
  }

  handleClose = () => {
    this.setState({open: false});
  };

  render() {
    console.log(this.props.state);
    return (
      <section id="about">
        <div className="container">
          <Dialog
            title="About"
            modal={false}
            open={this.props.state}
            onRequestClose={this.handleClose.bind(this)}
            actions={
              <div className="closeDialog">
                <IconButton tooltip="Close">
                  <i class="material-icons">arrow_forward</i>
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