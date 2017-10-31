import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import Slider from 'material-ui/Slider';
import FontIcon from 'material-ui/FontIcon';

const sliderList = [
  {  
    name: "Blur Radius",
    title: "Blur Radius:",
    range: {
      min: 0,
      max: 20,
      default: 4,
      step: 1
    }
  },
  {  
    name: "Sobel Threshold",
    title: "Sobel Threshold:",
    range: {
      min: 2,
      max: 50,
      default: 10,
      step: 1
    }
  }
]

export default class Settings extends Component {    
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

  state = {
    slider: 10
  }

  handleSlider = (event, value) => {    
    this.setState({
      slider: value
    });
  };

  render() {    
    return (
      <div className="Settings">          
        {sliderList.map(slider => {                    
          <div style={this.mainStyle}>    
            <span style={this.textStyle}>slider.title <Value sliderValue={this.state.slider} /></span>                      
            <SliderItem name={slider.name}
              min={slider.range.min} 
              max={slider.range.max} 
              default={slider.range.default} 
              step={slider.range.step} 
              style={this.sliderStyle}
            />
          </div> 
        })}               
      </div>
    );
  }
}

export class SliderItem extends Component {
  render() {
    return (      
      <Slider name={this.props.name}
        min={this.props.min} 
        max={this.props.max} 
        value={this.props.default} 
        step={this.props.step} 
        style={this.props.style} 
        onChange={this.handleSlider.bind(this)} axis="x" />
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