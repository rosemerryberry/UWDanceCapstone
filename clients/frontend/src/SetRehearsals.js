import React, { Component } from 'react';
import * as Util from './util';
import Button from 'material-ui/RaisedButton';
import Dialog from 'material-ui/Dialog';
import FlatButton from 'material-ui/FlatButton';
import RehearsalRow from './RehearsalRow';
import AvailabilityOverlap from './AvailabilityOverlap';
import PersonRow from './PersonRow';
import moment from 'moment';
import './styling/General.css';
import './styling/CastingFlow.css';
import './styling/CastingFlowMobile.css';


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
      filteredCast: []
    }
  };

  componentWillMount(){
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
      filteredCast : filteredCast,
      cast : this.props.cast,
      contested : this.props.contested
    })
  }

  postCasting = () => {

    Util.makeRequest("auditions/" + this.props.audition + "/casting", {}, "POST", true)
    .then((res) => {
      if (res.ok) {
        return res.text()
      }
      if (res.status === 401) {
        Util.signOut()
      }
      return res.text().then((t) => Promise.reject(t));
    })
    .then(() => {
      this.setState({
        open: false,
        finished: true,
        finishedAdding: true,
      });
    })
    .catch(err => {
      console.error(err)
    })
  }

  handleOpen = () => {
    this.setState({ open: true });
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
      startDate : date
    })
  }


  render() {
    let finished = this.state.finished
    if (this.state.rehearsalSchedule.length === 0 || !this.state.startDate) {
      finished = true
    }
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

    let rehearsalSchedule = this.state.rehearsalSchedule.map((day, i) => {
        return (
          <p key={i}>
            {day.day + " from "} 
            {day.startTime + " to "} 
            {day.endTime + " "} 
          </p>
        )
      
    })
    
    return (
      <section >
        <div className="mainView mainContentView">
        <div className="pageContentWrap">
            <div className="wrap">
              <div className="castList">
                <div className="extraClass">
                  <div className="setTimes">

                    <h2 className="smallHeading">Set Weekly Rehearsal Times</h2> {/*I think it's important to specify weekly rehearsals - they can set the tech/dress schedule late (from My Piece?)*/}
                    First Rehearsal Date
                    <input type="date" name="rehearsalStartDate" id="rehearsalStartDate" onChange={this.setStartDate}/>
                    Weekly Rehearsal Times
                    {rehearsals}
                    <div className="buttonsWrap">
                        <Button
                        backgroundColor="#708090"
                        style={{ color: '#ffffff', marginRight: '20px', float: 'right' }}
                        onClick={this.addRehearsal}
                        disabled={this.state.finishedAdding}>
                        ADD</Button>

                        <Button
                        backgroundColor="#708090"
                        style={{ color: '#ffffff', float: 'right' }}
                        onClick={this.removeRehearsal} disabled={this.state.finishedAdding}>
                        REMOVE</Button>
                    </div>
                  </div>
                  <div className="choreographersSelecteCast">
                    <h2 className="smallHeading">Your Cast</h2>
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
                        backgroundColor="#22A7E0"
                        style={{ color: '#ffffff', width: '100%', height:'50' }}
                        onClick={this.handleOpen}
                        disabled={finished}>
                        POST CASTING</Button>
                    </div>
                  </div>

                </div>

                <div className="overlapAvailabilityWrap">
                <AvailabilityOverlap cast={this.state.cast} contested={this.state.contested} filteredCast={this.state.filteredCast}/> 
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
                    onClick={this.postCasting}
                  />,
                ]}
                modal={false}
                open={this.state.open}
                onRequestClose={this.handleClose}
                disabled={finished}
              >
                <div className="warningText"> By clicking Post Casting you confirm that your selected cast is <strong className="importantText">accurate</strong> and there are <strong className="importantText">no conflicts</strong> with other choreographers. <br /> Your rehearsal start date is {this.state.startDate} and your rehearsal times are :
            <br />{rehearsalSchedule}<br />
                  <br /> </div>
                <p className="importantText warningText">An email will be sent to your cast with these times, and they will accept or decline their casting.</p>
              </Dialog>

            </div>
          </div>
        </div>
      </section>
    );
  };

}

export default SetRehearsals;