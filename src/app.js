import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as colors from 'material-ui/styles/colors';
import { getMuiTheme, MuiThemeProvider } from 'material-ui/styles';
import Main from './components/main';

const {ipcRenderer} = window.require('electron');

const styles = {
  root: {
    textAlign: 'center',
    paddingTop: 200
  }
};

// Theme
const muiTheme = getMuiTheme({
  palette: {
    primary1Color: colors.blue700,
    accent1Color: colors.deepPurple500
  }
});

class App extends Component {
  componentDidMount() {
    ipcRenderer.on('open-about', (event, message) => {
      // TODO load about dialog panel
      console.log('click');
    })
  }

  render() {
    return (
      <MuiThemeProvider muiTheme={muiTheme}>
        <Main />
      </MuiThemeProvider>
    );
  }
}

App.propTypes = {
  classes: PropTypes.object.isRequired,
};

export default App;
