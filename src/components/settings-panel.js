import React, { Component } from 'react';
import Slider from 'material-ui/Slider';
import Toggle from 'material-ui/Toggle';
import RaisedButton from 'material-ui/RaisedButton';
import SelectField from 'material-ui/SelectField';
import TextField from 'material-ui/TextField';
import MenuItem from 'material-ui/MenuItem';
import * as colors from 'material-ui/styles/colors';
import PubSub from 'pubsub-js';

const WITHOUT_WIREFRAME = 0,
      WITH_WIREFRAME    = 1,
      WIREFRAME_ONLY    = 2;

const styles = {
  main: {
    display: 'flex',    
    flexDirection: 'row'
  },
  leftPanel: {
    paddingLeft: 15,
    float: "left",
    width: "48%"
  },
  rightPanel: {
    paddingLeft: 10,
    paddingTop: 10,
    float: "right",
    width: "48%"
  },
  text: {    
    color: "#424242",
    position: "absolute",
    zIndex: 99
  },
  slider: {
    position: "relative",
    width: 400,
    height: 60,
    top: 20
  },
  toggle: {    
    marginBottom: 12,
    width: 300
  }
};

const defaultValues = {
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
    }
  ],
  // Toggle items
  toggleItems : [
    {
      name: "Grayscale",
      label: "Grayscale:",          
      toggled: false,
      status: false
    },
    {
      name: "Solid Wireframe",
      label: "Solid Wireframe:",          
      toggled: false,
      status: false
    }
  ]
}

export default class Settings extends Component {
  constructor(props) {
    super(props);
    this.state = this.initialState;    
  }

  static restoreDefaults;

  get initialState() {
    return Object.assign(defaultValues, {
      wirefameDisabled: true,
      wireframeValue: 0,
      wireframeType: 0
    });
  }

  // Update slider values
  handleSlider = (id, event, value) => {
    const sliders = this.state.sliders;
    sliders[id].currentVal = value;

    this.setState({
      sliders
    });
  };

  // Toggle switch handler
  handleToggleSwitch = (id, event, checked) => {
    const toggleItems = this.state.toggleItems;
    toggleItems[id].status = checked;
    
    this.setState({
      toggleItems
    });
  };

  // Wireframe input field event handler
  handleValueChange = (event, value) => {    
    let newValue = value;
    if (value < 0) {
      newValue = 0;
    } else if (value > 10) {
      newValue = 10;
    }
    this.setState({
      wireframeValue: newValue
    })
  };

  // Wireframe type event handler
  handleTypeChange = (event, value) => {
    this.setState({
      wireframeType: value
    });
    if (value === WITHOUT_WIREFRAME) {
      this.setState({
        wirefameDisabled: true,
        wireframeValue: 0
      });
    } else {
      this.setState({
        wirefameDisabled: false
      });
    }
  };

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
  };

  // Restore default values
  restoreDefaults = () => {    
    this.setState(this.initialState);
  }

  // Set default values after first render
  componentDidMount() {
    this.setState(this.initialState);
    Settings.restoreDefaults = this.resetElement;    
  }

  componentDidUpdate(prevProps, prevState) {           
    //console.log(this.initialState)
  }
  
  render() {            
    let sliderItems, toggleItems;
    
    sliderItems = this.state.sliders.map((slider, id) => {      
      return (
        <div style={styles.main} key={slider.name} >
          <span style={styles.text}>{slider.title}
            <TextField type="number"
              name={slider.name}
              underlineShow={false}
              style={{width:60, marginLeft:10}}
              onChange={this.handleSliderChange.bind(slider, id)}
              value={this.state.sliders[id].currentVal}
            />
          </span>
          <Slider name={slider.name}
            min={slider.range.min}
            max={slider.range.max}
            defaultValue={slider.range.default}
            step={slider.range.step}
            style={styles.slider}
            value={parseInt(this.state.sliders[id].currentVal)}
            // Extend the default event action parameters with the slider id. We need to capture the current item.
            onChange={this.handleSlider.bind(slider, id)}
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
            // Extend the default event action parameters with the togggle id. We need to capture the current item.
            onToggle={this.handleToggleSwitch.bind(toggleItem, id)}
          />                    
        </div>
      );
    });
    
    // We need to communicate between components not directly related.
    // For this reason we need to dispatch a custom event which we'll capture on save action.
    PubSub.publish('settings', this.state);
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
              selectedMenuItemStyle={{color:colors.blue700}}
            >
              <MenuItem value={WITHOUT_WIREFRAME} primaryText="Without Wireframe" />
              <MenuItem value={WITH_WIREFRAME} primaryText="With Wireframe" />
              <MenuItem value={WIREFRAME_ONLY} primaryText="Wireframe Only" />
            </SelectField><br/><br/>
            <span>Stroke width:</span><br/>
            <TextField
              name="wireframe-line-width"
              style={{width:200}}
              disabled={this.state.wirefameDisabled}
              value={this.state.wireframeValue}
              onChange={this.handleValueChange}
              type="number"
            />
            <RaisedButton label="Restore Defaults" onClick={this.restoreDefaults} style={{display:"none"}} ref={reset => this.resetElement = reset} />
          </div>
        </div>
    );
  }
}