import React, { Component } from 'react';
import Slider from 'material-ui/Slider';
import Toggle from 'material-ui/Toggle';
import RaisedButton from 'material-ui/RaisedButton';
import SelectField from 'material-ui/SelectField';
import TextField from 'material-ui/TextField';
import MenuItem from 'material-ui/MenuItem';
import { TwitterPicker } from 'react-color';
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
    float: "left",
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
    height: 63,
    top: 15
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
      name: "blurRadius",
      title: "Blur Radius:",
      range: {
        min: 1,
        max: 20,
        default: 4,
        step: 1
      },
      currentVal: 4
    },
    {
      name: "sobelThreshold",
      title: "Sobel Threshold:",
      range: {
        min: 2,
        max: 40,
        default: 10,
        step: 1
      },
      currentVal: 10
    },
    {
      name: "noise",
      title: "Noise:",
      range: {
        min: 0,
        max: 20,
        default: 0,
        step: 1
      },
      currentVal: 0
    },
    {
      name: "pointsThreshold",
      title: "Points Threshold:",
      range: {
        min: 0,
        max: 40,
        default: 20,
        step: 1
      },
      currentVal: 20
    },
    {
      name: "maxPoints",
      title: "Maximum Number of Points:",
      range: {
        min: 500,
        max: 7000,
        default: 2500,
        step: 50
      },
      currentVal: 2500
    },
    {
      name: "coordCenter",
      title: "Coordinate Center (x0.1) %:",
      range: {
        min: 29,
        max: 33,
        default: 33,
        step: 1
      },
      currentVal: 33
    }
  ],
  // Toggle items
  toggleItems : [
    {
      name: "grayscale",
      label: "Grayscale:",
      toggled: false,
      status: false
    },
    {
      name: "solidWireframe",
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
    this.defaultSettings = this.getDefaultSettings(this.initialState);
    this.handleSlider = this.handleSlider.bind(this);
    this.handleToggleSwitch = this.handleToggleSwitch.bind(this);
    this.handleSliderChange = this.handleSliderChange.bind(this);
  }

  // Set default values after first render
  componentDidMount() {
    this.setState(this.initialState);
    Settings.restoreDefaults = this.resetElement;
  }

  static restoreDefaults;

  get initialState() {
    return Object.assign(defaultValues, {
      wirefameDisabled: true,
      isSolidWireframe: false,
      solidWireframeColor: {r:0, g:0, b:0, a:1},
      backgroundColor: "#ABB8C3",
      strokeWidth: 0,
      wireframeType: 0
    });
  }

  // Return default settings
  getDefaultSettings(settings) {
    return JSON.parse(JSON.stringify(settings))
  }

  // Restore default values
  restoreDefaultSettings() {
    this.setState(this.getDefaultSettings(this.defaultSettings));
  }

  // Update slider values
  handleSlider(id, event, value) {
    const sliders = this.state.sliders;
    sliders[id].currentVal = value;

    this.setState({
      sliders
    });
  };

  // Toggle switch handler
  handleToggleSwitch(id, event, checked) {
    const toggleItems = this.state.toggleItems;
    toggleItems[id].status = checked;
    toggleItems[id].toggled = checked;

    this.setState({
      toggleItems
    });
    if (id == 1) {
      this.setState({
        isSolidWireframe: !this.state.isSolidWireframe
      })
    }
  };

  // Wireframe input field event handler
  handleValueChange(event, value) {
    let newValue = value;
    if (value < 0) {
      newValue = 0;
    } else if (value > 5) {
      newValue = 5;
    }
    this.setState({
      strokeWidth: newValue
    })
  };

  // Wireframe type event handler
  handleTypeChange(event, value) {
    this.setState({
      wireframeType: value
    });
    if (value === WITHOUT_WIREFRAME) {
      this.setState({
        wirefameDisabled: true,
        strokeWidth: 0
      });
    } else {
      this.setState({
        wirefameDisabled: false
      });
    }
  };

  // Slider change handler
  handleSliderChange(id, event, val) {
    const sliders = this.state.sliders;
    let value = parseInt(val, 10)
    
    if (Number.isNaN(value)) {
      value = sliders[id].range.min;
    }
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

  // Color change handler
  handleOnColorChange(color, event) {
    this.setState({
      solidWireframeColor: color.rgb,
      backgroundColor: color.hex
    });
  }

  render() {
    const wireframeColors = ['#000000', '#555555', '#697689', '#999999', '#D9E3F0', '#EDF4F7', '#004DCF', '#DB3E00', '#008B02', '#FFEB3B'];
    let sliderItems, toggleItems;

    sliderItems = this.state.sliders.map((slider, id) => {
      return (
        <div style={styles.main} key={slider.name} >
          <span style={styles.text}> {slider.title}
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
            value={parseInt(this.state.sliders[id].currentVal, 10)}
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
            toggled={toggleItem.toggled}
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
            <div style={{ display: this.state.isSolidWireframe ? "block" : "none" }}>
              <div>Wireframe Color</div><br/>
              <TwitterPicker 
                colors={wireframeColors} 
                color={ this.state.backgroundColor }
                onChangeComplete={this.handleOnColorChange.bind(this)}
              />
            </div>
            <SelectField
              floatingLabelText="Wireframe mode"
              value={this.state.wireframeType}
              onChange={this.handleTypeChange.bind(this)}
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
              value={this.state.strokeWidth}
              onChange={this.handleValueChange.bind(this)}
              type="number"
            />
            <RaisedButton label="Restore Defaults" onClick={this.restoreDefaultSettings.bind(this)} style={{display:"none"}} ref={reset => this.resetElement = reset} />
          </div>
        </div>
    );
  }
}