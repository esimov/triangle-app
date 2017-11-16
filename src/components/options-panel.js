import React, { Component } from 'react';
import FontIcon from 'material-ui/FontIcon';
import {Card, CardHeader, CardText} from 'material-ui/Card';
import Settings from './settings-panel';

export default class Options extends Component {
  constructor() {
    super()
    this.state = {
      expanded: true,
      title: "More Options"
    };
  }

  onExpand() {
    this.setState({
      expanded: true,
      title: "Less Options"
    });
  }

  onCollapse() {
    this.setState({
      expanded: false,
      title: "More Options"
    });
  }

  render() {
    return (
      <section className="Options">
        <Card
          expandable={false}
          expanded={this.state.expanded}
        >
          <CardHeader
            //title={this.state.title} style={{paddingBottom:2}}
            title="Options"
            style={{paddingBottom:0}}
            actAsExpander={true}
            avatar={<FontIcon className="fa fa-cogs fa-1" style={{fontSize:16}}></FontIcon>}
          />
          <CardText style={{paddingTop:2}}
            expandable={false}
            children={<Settings />}
          >
          </CardText>
        </Card>
      </section>
    );
  }
}