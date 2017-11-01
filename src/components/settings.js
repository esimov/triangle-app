import React, { Component } from 'react';
import RaisedButton from 'material-ui/RaisedButton';
import Slider from 'material-ui/Slider';
import Toggle from 'material-ui/Toggle';
import SelectField from 'material-ui/SelectField';
import TextField from 'material-ui/TextField';
import MenuItem from 'material-ui/MenuItem';
import FontIcon from 'material-ui/FontIcon';

const styles = {
  main: {
    display: 'flex',    
    flexDirection: 'row'
  },
  leftPanel: {
    paddingLeft: 14,
    float: "left",
    width: "49%"
  },
  rightPanel: {
    paddingRight: 10,
    float: "left",
    width: "49%"
  },
  text: {    
    color: "#424242",
    position: "absolute",
    zIndex: 99,
  },
  settings: {
    position: "relative",
    width: 400,
    height:80,    
    top: 14
  },
  toggle: {
    width: 400,
    marginBottom: 12
  }
}
export default class Settings extends Component {
  constructor() {
    super();

    this.state = {
      sliders: [],
      toggleItems: [],
      wirefameDisabled: false,
      wireframeValue: 0,
      wireframeType: 0
    }
  }

  // Update slider values
  handleSlider = (id, event, value) => {
    const sliders = this.state.sliders;
    sliders[id].currentVal = value;

    this.setState({
      sliders
    });
  }

  // Toggle switch handler
  handleToggleSwitch = (id, event, checked) => {
    const toggleItems = this.state.toggleItems;
    toggleItems[id].status = checked;
    
    this.setState({
      toggleItems
    });
  }

  // Wireframe input field event handler
  handleValueChange = (event, value) => {    
    let newValue = value;
    if (value < 0) {
      newValue = 0;
    } else if (value > 10) {
      newValue = 10;
    }
    this.setState({
      wireframeValue : newValue
    })
  }

  // Wireframe type event handler
  handleTypeChange = (event, value) => {
    this.setState({
      wireframeType : value
    });
  }

  handleSliderChange = (id, event, value) => {
    const sliders = this.state.sliders;    

    if (value < sliders[id].range.min) {      
      value = sliders[id].range.min;
    } else if (value > sliders[id].range.max) {
      value = sliders[id].range.max;
    }
    sliders[id].currentVal = value;

    this.setState({
      sliders
    });
  }

  componentWillMount() {
    this.setState({
      // Slider items
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
        },
        {
          name: "Noise",
          title: "Noise:",
          range: {
            min: 0,
            max: 10,
            default: 0,
            step: 1
          },
          currentVal: 0
        },
        {
          name: "Points Threshold",
          title: "Points Threshold:",
          range: {
            min: 0,
            max: 100,
            default: 20,
            step: 1
          },
          currentVal: 20
        },
        {
          name: "Maximum Number of Points",
          title: "Maximum Number of Points:",
          range: {
            min: 700,
            max: 6500,
            default: 2500,
            step: 50
          },
          currentVal: 2500
        },
        {
          name: "Sobel Filter Threshold",
          title: "Sobel Filter Threshold:",
          range: {
            min: 2,
            max: 50,
            default: 10,
            step: 0.1
          },
          currentVal: 10
        },        
      ],
      // Toggle items
      toggleItems : [
        {
          name: "Grayscale",
          label: "Grayscale:",          
          toggled: false,
          status: false,
        },
        {
          name: "Solid Wireframe",
          label: "Solid Wireframe:",          
          toggled: false,
          status: false,
        },  
      ]
    });
  }  

  render() {
    let sliderItems, toggleItems, wireframeMode;      
    
    sliderItems = this.state.sliders.map((slider, id) => {      
      return (
        <div style={styles.main} key={slider.name} >
          <span style={styles.text}>{slider.title}
            <TextField style={{width:60, marginLeft:10}} type="number" onChange={this.handleSliderChange.bind(slider, id)} value={this.state.sliders[id].currentVal}/>
          </span>
          <Slider name={slider.name}
            min={slider.range.min}
            max={slider.range.max}
            defaultValue={slider.range.default}
            step={slider.range.step}
            style={styles.settings}
            value={this.state.sliders[id].currentVal}
            onChange={this.handleSlider.bind(slider, id)}  // Extend the default event action parameters with the slider id. We need to capture the current item.
          />
        </div>
      );
    });
    
    toggleItems = this.state.toggleItems.map((toggleItem, id) => {  
      return (
        <div style={this.mainStyle} key={toggleItem.name} >                  
          <Toggle label={toggleItem.label}
            style={styles.toggle}
            defaultToggled={toggleItem.toggled}            
            onToggle={this.handleToggleSwitch.bind(toggleItem, id)}  // Extend the default event action parameters with the togggle id. We need to capture the current item.
          />                    
        </div>
      );
    });
    
    return (
        <div className="Settings" style={{"overflow":"hidden", "position":"relative"}}>
          <div style={styles.leftPanel}>
            {sliderItems}
          </div>
          <div style={styles.rightPanel}>
          {toggleItems}             
            <SelectField
              floatingLabelText="Wireframe mode"
              value={this.state.wireframeType}
              onChange={this.handleTypeChange}
              style={styles.customWidth}
            >
              <MenuItem value={0} primaryText="Without Wireframe" />
              <MenuItem value={1} primaryText="With Wireframe" />
              <MenuItem value={2} primaryText="Wireframe Only" />
            </SelectField><br/><br/>
            <span>Wireframe line width:</span><br/>
            <TextField
              name="wireframe-line-width"
              style={{width:200}}            
              disabled={this.state.wirefameEnabled}
              value={this.state.wireframeValue}
              onChange={this.handleValueChange}
              type="number"
            />
          </div>
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