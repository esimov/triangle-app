import React, { Component } from 'react';
import CircularProgress from 'material-ui/CircularProgress';
import * as colors from 'material-ui/styles/colors';
import PubSub from 'pubsub-js';

export default class Loader extends Component {
  constructor() {
    super();

    PubSub.subscribe('onPreview', (event, data) => {
      this.setState({
        loading: data
      });
    });
  }

  componentWillMount() {
    this.state = {
      loading : false
    };
  }

  render() {
    return (
      <section id="loader" className={this.state.loading ? "visible" : "hidden"}>
        <div className="container">
          <CircularProgress className="spinner" size={160} thickness={6} />
        </div>
      </section>
    );
  }
}