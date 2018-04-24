import React, { Component } from 'react';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import './styling/General.css';
import './styling/CastingFlow.css';
import './styling/CastingFlowMobile.css';


const styles = {
  customWidth: {
    width: 140,
  },
};

const times = ["1000", "1030","1100","1130","1200","1230","1300", "1330", "1400","1430", 
"1500", "1530", "1600", "1630", "1700", "1730", "1800", "1830", "1900", "1930", "2000", "2030", "2100"]

const formattedTimes = ["10:00 AM", "10:30 AM","11:00 AM","11:30 AM","12:00 PM","12:30 PM","1:00 PM", "1:30 PM", "2:00 PM","2:30 PM", 
"3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM"]

class RehearsalRow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rehearsal:{
        "day": "",
        "startTime": "",
        "endTime": ""
      },
      day: "",
      startTime: "",
      endTime: ""
    }
  };

  updateDay = (event, index, value) => {
    let rehearsal = this.state.rehearsal
    rehearsal.day = value
    this.setState({
      rehearsal: rehearsal
    })
    this.props.setRehearsal(this.state.rehearsal)
  };


  updateStartTime = (event, index, value) => {
    let rehearsal = this.state.rehearsal
    rehearsal.startTime = value
    this.setState({
      rehearsal: rehearsal
    })
    this.props.setRehearsal(this.state.rehearsal)
  }

  updateEndTime = (event, index, value) => {
    let rehearsal = this.state.rehearsal
    rehearsal.endTime = value
    this.setState({
      rehearsal: rehearsal
    })
    this.props.setRehearsal(this.state.rehearsal)
  }

  render() {
      let timePicker = []
      times.forEach((time, index) => {
        return (
            timePicker.push(
                <MenuItem value={formattedTimes[index]} primaryText={formattedTimes[index]} />
            ) 
        )
      })
      let finished = this.props.finished
    return (
      <section className="chooseRehearsalTimes">
        <SelectField 
          floatingLabelText="Day"
          value={this.state.rehearsal.day}
          style={styles.customWidth}
          onChange={this.updateDay}
          autoWidth={true}
          disabled={finished}
          className="pickDateTime"
        >
          <MenuItem value={"Monday"} primaryText="Monday" />
          <MenuItem value={"Tuesday"} primaryText="Tuesday" />
          <MenuItem value={"Wednesday"} primaryText="Wednesday" />
          <MenuItem value={"Thursday"} primaryText="Thursday" />
          <MenuItem value={"Friday"} primaryText="Friday" />
          <MenuItem value={"Saturday"} primaryText="Saturday" />
          <MenuItem value={"Sunday"} primaryText="Sunday" />

        </SelectField>
        <br/>
        <SelectField
          maxHeight={300}
          style={styles.customWidth}
          floatingLabelText="Start Time"
          value={this.state.rehearsal.startTime}
          onChange={this.updateStartTime}
          autoWidth={true}
          disabled={finished}
        >
          {timePicker}

        </SelectField>
        <br/>
        <SelectField
          maxHeight={300}
          style={styles.customWidth}
          floatingLabelText="End Time"
          value={this.state.rehearsal.endTime}
          onChange={this.updateEndTime}
          autoWidth={true}
          disabled={finished}
        >
          {timePicker}

        </SelectField>
      </section>
  );
};

}
export default RehearsalRow;