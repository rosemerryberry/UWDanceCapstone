import React, { Component } from 'react';
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import './styling/General.css';
import './styling/CastingFlow.css';
import './styling/CastingFlowMobile.css';


const dateStyle = {
  customDateStyle: {
    width: "100%",
    minWidth: 125,
    fontSize: 14,
  },
};

const styles = {
  customTimeStyle: {
    width: "100%",
    minWidth: 125,
    fontSize: 13,
  },
};

const times = ["1000", "1030", "1100", "1130", "1200", "1230", "1300", "1330", "1400", "1430",
  "1500", "1530", "1600", "1630", "1700", "1730", "1800", "1830", "1900", "1930", "2000", "2030", "2100", "2130", "2200", "2230"]

const formattedTimes = ["10:00am", "10:30am", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM",
  "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM"]

class RehearsalRow extends Component {
  constructor(props) {
    super(props);
    this.state = {
      rehearsal: {
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
    let startTimePicker = []
    times.forEach((time, index) => {
      return (
          startTimePicker.push(
              <MenuItem key={index} value={time} primaryText={formattedTimes[index]} />
          ) 
      )
    })
    let endTimePicker = []
    times.forEach((time, index) => {
      if(time > this.state.rehearsal.startTime) {
        return (
            endTimePicker.push(
                <MenuItem key={index} value={time} primaryText={formattedTimes[index]} />
            ) 
        )
      }
    })
    let finished = this.props.finished
    return (
      <section className="chooseRehearsalTimes">
        <div className="singleRehearsal">
          <div className="singleField">
            <SelectField
              floatingLabelText="Day"
              value={this.state.rehearsal.day}
              style={dateStyle.customDateStyle}
              onChange={this.updateDay}
              autoWidth={true}
              disabled={finished}
              className="pickDateTime"
            >
              <MenuItem value={"mon"} primaryText="Monday" />
              <MenuItem value={"tues"} primaryText="Tuesday" />
              <MenuItem value={"wed"} primaryText="Wednesday" />
              <MenuItem value={"thurs"} primaryText="Thursday" />
              <MenuItem value={"fri"} primaryText="Friday" />
              <MenuItem value={"sat"} primaryText="Saturday" />
              <MenuItem value={"sun"} primaryText="Sunday" />
            </SelectField>
          </div>
          <br />
          <div className="singleField">
            <SelectField
              maxHeight={300}
              style={styles.customTimeStyle}
              floatingLabelText="Start Time"
              value={this.state.rehearsal.startTime}
              onChange={this.updateStartTime}
              autoWidth={true}
              disabled={finished}
            >
              {startTimePicker}

            </SelectField>
          </div>
          <br />
          <div className="singleField">
            <SelectField
              maxHeight={300}
              style={styles.customTimeStyle}
              floatingLabelText="End Time"
              value={this.state.rehearsal.endTime}
              onChange={this.updateEndTime}
              autoWidth={true}
              disabled={finished}
            >
              {endTimePicker}

            </SelectField>
          </div>
        </div>
      </section>
    );
  };

}
export default RehearsalRow;