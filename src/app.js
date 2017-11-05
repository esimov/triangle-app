import React, { Component } from 'react';
import PropTypes from 'prop-types';
import * as colors from 'material-ui/styles/colors';
import { getMuiTheme, MuiThemeProvider } from 'material-ui/styles';
import Main from './components/main';

const styles = {
  root: {
    textAlign: 'center',
    paddingTop: 200
  }
};

// Theme
const muiTheme = getMuiTheme({
  palette: {
    primary1Color: colors.pink500,
    accent1Color: colors.deepPurple500
  }
});

class App extends Component {  
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
