import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import FontIcon from 'material-ui/FontIcon';
import {Card, CardHeader, CardText} from 'material-ui/Card';
import Settings from './settings';

export default class Options extends Component {  
  headerStyle = {
    lineHeight: "0.8em"    
  }
  
  state = {
    expanded: false,
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
          onExpandChange={this.onExpandChange}
        >
          <CardHeader      
            expanded={this.state.expanded}      
            title={this.state.title}
            showExpandableButton={true}
            actAsExpander={true}                  
            avatar={<FontIcon
              className="material-icons"
              style={this.headerStyle}
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