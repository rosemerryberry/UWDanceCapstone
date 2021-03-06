import React, { Component } from 'react';
import * as Util from './util';
import { Button } from 'react-materialize';
import Dialog from 'material-ui/Dialog';
import LinearProgress from 'material-ui/LinearProgress';
import FlatButton from 'material-ui/FlatButton';
import RehearsalRow from './RehearsalRow';
import AvailabilityOverlap from './AvailabilityOverlap';
import PersonRow from './PersonRow';
import moment from 'moment';
import './styling/General.css';
import './styling/CastingFlow.css';
import './styling/CastingFlowMobile.css';

const timesFormatted = ["10:00 AM", "10:30 AM", "11:00 AM", "11:30 AM", "12:00 PM", "12:30 PM", "1:00 PM", "1:30 PM", "2:00 PM", "2:30 PM", "3:00 PM", "3:30 PM", "4:00 PM", "4:30 PM", "5:00 PM", "5:30 PM", "6:00 PM", "6:30 PM", "7:00 PM", "7:30 PM", "8:00 PM", "8:30 PM", "9:00 PM", "9:30 PM", "10:00 PM", "10:30 PM"]

const daysFormatted = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"]

const daysRef = ["mon", "tues", "wed", "thurs", "fri", "sat", "sun"]

const timesRef = ["1000", "1030", "1100", "1130", "1200", "1230", "1300", "1330", "1400", "1430",
  "1500", "1530", "1600", "1630", "1700", "1730", "1800", "1830", "1900", "1930", "2000", "2030", "2100", "2130", "2200", "2230"]

class SetRehearsals extends Component {
  constructor(props) {
    super(props);
    this.state = {
      numRehearsals: 2,
      open: false,
      finished: false,
      finishedAdding: false,
      rehearsalSchedule: [],
      cast: [],
      contested: [],
      filteredCast: [],
      startDate: moment().format('YYYY-MM-DD'),
      progress: false,
      successMessage: false,
    }
  };

  componentWillMount() {
    let filteredCast = []
    this.props.cast.map((dancer, i) => {
      filteredCast.push(dancer.dancer.user.id)
      return filteredCast
    })
    this.props.contested.map(dancer => {
      filteredCast.push(dancer.rankedDancer.dancer.user.id)
      return filteredCast
    })
    this.setState({
      filteredCast: filteredCast,
      cast: this.props.cast,
      contested: this.props.contested
    })
  }

  postCasting = (rehearsalString) => {
    this.setState({
      progress: true,
      successMessage: false
    })

    let body = {
      rehearsals : this.state.allRehearsals,
      rehearsalSchedule : rehearsalString
    }
    
    Util.makeRequest("auditions/" + this.props.audition + "/casting", body, "POST", true)
      .then((res) => {
        if (res.ok) {
          return res.text()
        }
        return res.text().then((t) => Promise.reject(t));
      })
      .then(() => {
        this.setState({
          open: false,
          finished: true,
          finishedAdding: true,
          progress: false,
          successMessage: true
        });
        setTimeout(() => {this.setState({successMessage: false})}, 2000)
      })
      .catch(err => {
        this.setState({
          castingError: err,
          progress: false
        })
        console.error(err)
      })
  }

  calculateRehearsals = () => {
    //let startDate = this.state.startDate
    let endDate = this.props.endDate
    let rehearsalBlocks = this.state.rehearsalSchedule
    let allRehearsals = []

    rehearsalBlocks.forEach((rehearsal, i) => {
      //we will update this if the rehearsal is not the same day as the start date
      let startDate = this.state.startDate

      //an array of these are going to be pushed up to the server 
      let rehearsalObject = {
        title: "Weekly Rehearsal"
      }

      let rehearsalIndex = daysRef.indexOf(rehearsal.day) + 1 //will give us the number representing the day of the week [mondays start at 1 and are at position 0, hence the plus one]
      let startDateIndex = moment(startDate).day() //will give us the numeric representation of the day of the week that the rehearsal started on
      //doesn't work for sundays which are 0 whoops
      if (startDateIndex === 0) {
        rehearsalIndex = 0
      }

      if (rehearsalIndex === startDateIndex) { //hooray we don't have to calculate the date
        rehearsalObject.start = moment(startDate).format("YYYYMMDD") + "T" + rehearsal.startTime //times have to be formatted for moment we so get the index of our timeRef and get the formatted time using that
        rehearsalObject.end = moment(startDate).format("YYYYMMDD") + "T" + rehearsal.endTime //we use the same date bc no one rehearses at midnight
        //server formatting
        rehearsalObject.start = moment(rehearsalObject.start).format("YYYY-MM-DDTHH:mm:ssZ")
        rehearsalObject.end = moment(rehearsalObject.end).format("YYYY-MM-DDTHH:mm:ssZ")
      } else {
        //here we get the DATE of the day of the week that is closest AFTER our start date
        //use that date to create our rehearsal object
        let beginDate = moment(startDate).day(rehearsalIndex)

        //this is actually just getting a day DURING the week of our start time, so we're going to check to see if our new date is before or after our start date
        if (moment(beginDate).isBefore(startDate)) {
          beginDate = moment(beginDate).add(1, 'week')
        }

        rehearsalObject.start = beginDate.format("YYYYMMDD") + "T" + rehearsal.startTime
        rehearsalObject.end = beginDate.format("YYYYMMDD") + "T" + rehearsal.endTime
        //server formatting
        rehearsalObject.start = moment(rehearsalObject.start).format("YYYY-MM-DDTHH:mm:ssZ")
        rehearsalObject.end = moment(rehearsalObject.end).format("YYYY-MM-DDTHH:mm:ssZ")
        startDate = beginDate //need this in a sec
      }

      //now we have one complete rehearsal object 
      //add it to the list, now IDs will be based on length accurately
      allRehearsals.push(rehearsalObject)

      //at this point start generating the weekly events following our start date (Whatever that might be)
      let date = moment(startDate)
      while (date.isBefore(moment(endDate))) {
        date = moment(date).add(1, 'week')
        let newRehearsalObject = {
          title: "Weekly Rehearsal"
        }
        newRehearsalObject.start = date.format("YYYYMMDD") + "T" + rehearsal.startTime
        newRehearsalObject.end = date.format("YYYYMMDD") + "T" + rehearsal.endTime

        //server formatting
        newRehearsalObject.start = moment(newRehearsalObject.start).format("YYYY-MM-DDTHH:mm:ssZ")
        newRehearsalObject.end = moment(newRehearsalObject.end).format("YYYY-MM-DDTHH:mm:ssZ")
        allRehearsals.push(newRehearsalObject)
      }
    })
    this.setState({
      allRehearsals : allRehearsals
    })
  }

  handleOpen = () => {
    this.setState({ open: true });
    this.calculateRehearsals()
  }

  handleClose = () => {
    this.setState({ open: false });
  };

  addRehearsal = () => {
    let newRehearsalNum = this.state.numRehearsals
    newRehearsalNum++
    this.setState({
      numRehearsals: newRehearsalNum,
    })
  }

  removeRehearsal = () => {
    let newRehearsalNum = this.state.numRehearsals
    newRehearsalNum--
    let rehearsals = this.state.rehearsalSchedule
    rehearsals = rehearsals.slice(0, newRehearsalNum)
    this.setState({
      numRehearsals: newRehearsalNum,
      rehearsalSchedule: rehearsals
    })
  }

  setRehearsal = (rehearsal, i) => {
    //get current rehearsals
    let rehearsals = this.state.rehearsalSchedule

    if (rehearsal.day !== "" && rehearsal.startTime !== "" && rehearsal.endTime !== "" && rehearsal.startTime < rehearsal.endTime) {
      rehearsals[i] = rehearsal
      this.setState({
        rehearsalSchedule: rehearsals
      })
    }
  }

  setStartDate = (e) => {
    let date = e.target.value
    this.setState({
      startDate: date
    })
  }


  render() {
    let finished = this.state.finished
    let numRehearsals = this.state.numRehearsals
    let rehearsals = []
    for (let i = 0; i < numRehearsals; i++) {
      rehearsals.push(<RehearsalRow key={i} setRehearsal={(rehearsal, key) => this.setRehearsal(rehearsal, i)} finished={this.state.finishedAdding} />)
    }

    let castList = this.props.cast.map((dancer, i) => {
      return (
        <PersonRow p={dancer.dancer.user} setRehearsals={true} key={i} />
      )
    })

    let rehearsalString = "Weekly rehearsals are "
    let rehearsalSchedule = this.state.rehearsalSchedule.map((day, i) => {
      if (i > 0) {
        rehearsalString = rehearsalString + " and "
      }
      let dayIndex = daysRef.indexOf(day.day)
      let startTimeIndex = timesRef.indexOf(day.startTime)
      let endTimeIndex = timesRef.indexOf(day.endTime)
      let string = daysFormatted[dayIndex] + " from " + timesFormatted[startTimeIndex] + " to " + timesFormatted[endTimeIndex]
      rehearsalString = rehearsalString + string
      return (
        <p key={i}>
          {string}
        </p>
      )
    })
    rehearsalString = rehearsalString + ". The first day of rehearsal is " + moment(this.state.startDate).format("dddd, MMMM Do YYYY") + "."
    if(rehearsalSchedule.length === 0) {
      rehearsalString = "Weekly rehearsals have not been set."
    }
    return (
      <section >
        <div className="mainView mainContentView">
          <div className="pageContentWrap">
            <div className="wrap">
              <div className="castList">
                <div className="extraClass">
                  <div className="setTimes">
                    <h2 className="smallHeading">Set Weekly Rehearsal Times</h2>
                    <div className="xtraInfo tooltip">
                      <i className="fas fa-question-circle"></i>
                      <span className="tooltiptext">Pick the <b className="emphasis">first day</b> of rehearsal and then each <b className="emphasis">recurring</b> weekly slot. One-time rehearsals can be added from My Piece.</span>
                    </div>
                    <p>First Rehearsal Date</p>
                    <div className="chooseRehearsalTimes">
                      <input type="date" name="rehearsalStartDate" id="rehearsalStartDate" defaultValue={moment().format('YYYY-MM-DD')} onChange={this.setStartDate} />
                    </div>
                    <p>Weekly Rehearsal Times</p>
                    {rehearsals}
                    <div className="buttonsWrap">
                      <Button
                        backgroundcolor="hsl(0, 0%, 45%)"
                        style={{ color: '#ffffff', marginRight: '20px', float: 'right' }}
                        onClick={this.addRehearsal}
                        disabled={this.state.finishedAdding}>
                        ADD</Button>
                      <Button
                        backgroundcolor="hsl(0, 0%, 45%)"
                        style={{ color: '#ffffff', float: 'right' }}
                        onClick={this.removeRehearsal} disabled={this.state.finishedAdding}>
                        REMOVE</Button>
                    </div>
                  </div>
                  
                  <div className="choreographersSelectedCast setTimes">
                    <h2 className="smallHeading">Your Cast</h2>
                    <div className="xtraInfo tooltip">
                      <i className="fas fa-question-circle"></i>
                      <span className="tooltiptext">This is your <b className="emphasis">final</b> cast list. They will all recieve an email with their casting.</span>
                    </div>
                    <table>
                      <tbody>
                        <tr className="categories">
                          <th>Name</th>
                          <th>Email</th>
                        </tr>
                        {castList}
                      </tbody>
                    </table>
                  </div>
                  
                  <div className="postCastingWrap">
                    <div className="postCasting">
                      <Button
                        className="postCastingLarge"
                        backgroundcolor="#22A7E0"
                        style={{ color: '#ffffff', width: '100%', height: '60' }}
                        onClick={this.handleOpen}
                        disabled={finished}>
                        POST CASTING</Button>
                    </div>
                  </div>

                </div>

                <div className="overlapAvailabilityWrap">
                  <AvailabilityOverlap cast={this.state.cast} contested={this.state.contested} filteredCast={this.state.filteredCast} />
                </div>
              </div>

              <Dialog
                title="Confirm Casting"
                actions={[
                  <FlatButton
                    label="Cancel"
                    style={{ backgroundColor: 'transparent', color: 'hsl(0, 0%, 29%)', marginRight: '20px' }}
                    primary={false}
                    onClick={this.handleClose}
                  />,
                  <FlatButton
                    label="Post Casting"
                    style={{ backgroundColor: '#22A7E0', color: '#ffffff' }}
                    primary={false}
                    keyboardFocused={true}
                    onClick={() => this.postCasting(rehearsalString)}
                  />,
                ]}
                modal={false}
                open={this.state.open}
                onRequestClose={this.handleClose}
                disabled={finished}
              >
                <div className="warningText"> By clicking Post Casting you confirm that your selected cast is <strong className="importantText">accurate</strong> and there are <strong className="importantText">no conflicts</strong> with other choreographers. 
                <br /> 
                <br />
                {
                  rehearsalSchedule.length > 0 &&
                  <div>
                    <p>Your rehearsal start date is {moment(this.state.startDate).format("dddd, MMMM Do YYYY")} and your rehearsal times are :</p>
                    <br />
                    {rehearsalSchedule}
                  </div>
                }
                {
                  rehearsalSchedule.length === 0 &&
                  <p>{rehearsalString}</p>
                }

                <br />
                <br /> 
                An email will be sent to your cast with these times. They will accept or decline their casting within <b className="importantText warningText">48 hours</b>.
                </div>
                {
                  this.state.castingError &&
                  <div className="serverError">
                    {Util.titleCase(this.state.castingError)}
                  </div>
                }
                {
                  this.state.progress &&
                  <LinearProgress mode="indeterminate" />
                }
              </Dialog>

              <Dialog
                title="Success"
                open={this.state.successMessage}
                modal={false}
                onRequestClose={() => {this.setState({successMessage: false})}}
              >
                <p>Casting has been successfully posted. Your dancers will accept or decline in <strong className="importantText">48 hours.</strong></p>
              </Dialog>
              


            </div>
          </div>
        </div>
      </section>
    );
  };

}

export default SetRehearsals;