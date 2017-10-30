import React, { Component } from 'react';
import PropTypes from 'prop-types';
import RaisedButton from 'material-ui/RaisedButton';
import FlatButton from 'material-ui/FlatButton';
import Dialog from 'material-ui/Dialog';
import Slider from 'material-ui/Slider';
import { teal600 } from 'material-ui/styles/colors';
import { getMuiTheme, MuiThemeProvider } from 'material-ui/styles';

const styles = {
  root: {
    textAlign: 'center',
    paddingTop: 200,
  },
};

// Theme
const muiTheme = getMuiTheme({
  palette: {
    accent1Color: teal600
  }
})

class Index extends Component {
  state = {
    open: false,
  };

  style = {
    margin: 12,
  };
  
  handleRequestClose = () => {
    this.setState({
      open: false,
    });
  };

  handleClick = () => {
    this.setState({
      open: true,
    });
  };

  render() {
    const actions = [
      <FlatButton
        label="Cancel"
        primary={true}
        onClick={this.handleRequestClose}
      />,
      <FlatButton
        label="Submit"
        primary={true}
        keyboardFocused={true}
        onClick={this.handleRequestClose}
      />,
    ];

    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <RaisedButton label="Default" style={this.style} onClick={this.handleClick} />        
        <Dialog
          title="Dialog With Actions"
          actions={actions}
          modal={false}
          open={this.state.open}
          onRequestClose={this.handleClose}
        >
          The actions in this window were passed in as an array of React objects.
        </Dialog>
      </MuiThemeProvider>      
    );
  }
}

Index.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default Index;
