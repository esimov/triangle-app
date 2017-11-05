import React, { Component } from 'react';
import FontIcon from 'material-ui/FontIcon';
import {Card, CardHeader, CardText} from 'material-ui/Card';
import Settings from './settings-panel';

export default class Options extends Component {    
  state = {
    expanded: true,
    title: "More Options"
  };
  
  onExpand = () => {
    this.setState({
      expanded: true,
      title: "Less Options"
    });

  };

  onCollapse = () => {
    this.setState({
      expanded: false,
      title: "More Options"
    });
  };

  onExpandChange = () => {
    this.state.expanded = !this.state.expanded;
    this.state.title = this.state.expanded ? this.onExpand() : this.onCollapse();  
  };

  render() {    
    return (
      <section className="Options">      
        <Card
          expandable={true}   
          expanded={this.state.expanded}      
          onExpandChange={this.onExpandChange}
        >
          <CardHeader            
            //title={this.state.title} style={{paddingBottom:2}}
            title="Options"
            style={{paddingBottom:0}}
            actAsExpander={true}
            avatar={<FontIcon
              className="material-icons optionsHeader"              
            >settings</FontIcon>}
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