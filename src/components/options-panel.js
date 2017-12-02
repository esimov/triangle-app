import React, { Component } from 'react';
import { Card, CardText } from 'material-ui/Card';
import Settings from './settings-panel';

export default class Options extends Component {
  constructor(props) {
    super(props)
    this.state = {
      expanded: true
    };
  }

  render() {
    return (
      <section className="Options">
        <Card
          expandable={false}
          expanded={this.state.expanded}
        >
          <CardText style={{ paddingTop: 2 }}
            expandable={false}
            children={<Settings />}
          >
          </CardText>
        </Card>
      </section>
    );
  }
}