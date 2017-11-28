import React, { Component } from 'react';
import * as colors from 'material-ui/styles/colors';
import { getMuiTheme, MuiThemeProvider, darkBaseTheme, lightBaseTheme } from 'material-ui/styles';
import Main from './components/main';
import PubSub from 'pubsub-js';
import merge from 'lodash.merge';
import 'font-awesome/css/font-awesome.css';

// Theme
const customTheme = {
  palette: {
    primary1Color: colors.blue700,
    accent1Color: colors.cyan600,
    accent2Color: colors.grey200,
    accent3Color: colors.grey500
  }
}

const customDarkBaseTheme = {
  palette: {
    canvasColor: colors.grey900
  }
}

class App extends Component {
  constructor(props) {
    super(props)
    
    // Check if local storage is not empty, otherwise sets the default values.
    if (!localStorage.getItem('settings.state')) {
      localStorage.setItem('settings.state', JSON.stringify({isDarkTheme:false, isWebcamEnabled:false}));
    }

    // Get the saved settings from local storage
    const {isDarkTheme} = JSON.parse(localStorage.getItem('settings.state'));
    this.state = {
      isDarkTheme: isDarkTheme
    }

    PubSub.subscribe('is_dark_theme', (event, data) => {
      this.setState({
        isDarkTheme: data
      })
    })
  }

  render() {
    const baseTheme = this.state.isDarkTheme ? merge(darkBaseTheme, customDarkBaseTheme) : lightBaseTheme;
    return (
      <MuiThemeProvider muiTheme={getMuiTheme(merge(baseTheme, customTheme))}>
        <Main />
      </MuiThemeProvider>
    );
  }
}

export default App;
