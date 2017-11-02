import React, { Component } from 'react';
import FontIcon from 'material-ui/FontIcon';
import {Card, CardHeader, CardText} from 'material-ui/Card';
import Settings from './settings-panel';

export default class Options extends Component {    
  state = {
    expanded: true,
    title: "More Options"
  }
  
  onExpand = () => {
    this.setState({
      expanded: true,
      title: "Less Options"
    });

  }

  onCollapse = () => {
    this.setState({
      expanded: false,
      title: "More Options"
    });
  }

  onExpandChange = () => {
    this.state.expanded = !this.state.expanded;
    this.state.title = this.state.expanded ? this.onExpand() : this.onCollapse();  
  }

  render() {    
    return (
      <div className="Options">      
        <Card
          expandable={true}   
          expanded={this.state.expanded}      
          onExpandChange={this.onExpandChange}
        >
          <CardHeader            
            title={this.state.title}            
            showExpandableButton={true}
            actAsExpander={true}                  
            avatar={<FontIcon
              className="material-icons optionsHeader"              
            >settings</FontIcon>}
          />
          <CardText 
            expandable={true}
            children={<Settings />}
          >      
          </CardText>
        </Card>
      </div>
    );
  }
}