import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import Slider from 'material-ui/Slider';
import FontIcon from 'material-ui/FontIcon';

export default class Settings extends Component {
  constructor() {
    super();

    this.state = {
      sliders: []
    }
  }

  mainStyle = {
    display: 'flex',    
    flexDirection: 'row',
  }

  textStyle = {    
    position: "absolute"
  }

  sliderStyle = {
    width: 400,
  }

  // Update slider values
  handleSlider = (id, event, value) => {
    const sliders = this.state.sliders;
    sliders[id].currentVal = value;

    this.setState({
      sliders
    });
  };

  componentWillMount() {
    this.setState({
      sliders : [
        {
          name: "Blur Radius",
          title: "Blur Radius:",
          range: {
            min: 0,
            max: 20,
            default: 4,
            step: 1
          },
          currentVal: 4
        },
        {
          name: "Sobel Threshold",
          title: "Sobel Threshold:",
          range: {
            min: 2,
            max: 60,
            default: 10,
            step: 1
          },
          currentVal: 10          
        }
      ]
    });
  }

  render() {
    let sliderItems;
    sliderItems = this.state.sliders.map((slider, id) => {      
      return (
        <div style={this.mainStyle} key={slider.name} >
          <span style={this.textStyle}>{slider.title} <Value sliderValue={this.state.sliders[id].currentVal} /></span>
          <Slider name={slider.name}
            min={slider.range.min}
            max={slider.range.max}
            defaultValue={slider.range.default}
            step={slider.range.step}
            style={this.sliderStyle}
            onChange={this.handleSlider.bind(slider, id)}  // Extend the default event action parameters with the slider id. We need to capture it,          
          />
        </div>
      );
    });
    return (
        <div className="Settings">
          {sliderItems}
        </div>
    );
  }
}

export class Value extends Component {
  render() {
    return (
        <span>
          {this.props.sliderValue}
        </span>
    );
  }
}