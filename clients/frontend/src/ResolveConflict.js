import React, { Component } from 'react';

import AllDancersRow from './AllDancersRow';
import './styling/General.css';
import './styling/CastingFlow.css';
import './styling/CastingFlowMobile.css';


class ResolveConflict extends Component {

  render() {
    let yourCast = []
    const cast = this.props.cast
    if(cast){
      yourCast = cast.map(dancer => {
        return (
          <AllDancersRow key={dancer.dancer.user.id} person={dancer.dancer.user} regNum={dancer.dancer.regNum} resolveYourCast={true} audition={this.props.audition}/>
        )
      })
    }

    let allDancers = []
    const uncast = this.props.uncast
    if(uncast) {
      allDancers = uncast.map(person => {
        return (
          <AllDancersRow key={person.user.id} person={person.user} regNum={person.regNum} resolveNotYourCast={true} audition={this.props.audition} />
        )
      })
    }

    let conflictsRow = []
    const conflicts = this.props.contested

    if(conflicts) {
      conflictsRow = conflicts.map(conflict => {
        return (
          <AllDancersRow choreographers={conflict.choreographers} key={conflict.rankedDancer.dancer.user.id} person={conflict.rankedDancer.dancer.user} regNum={conflict.rankedDancer.dancer.regNum} numPieces={conflict.rankedDancer.dancer.numShows} rank={conflict.rankedDancer.rank} audition={this.props.audition} resolveConflict={true}/>
        )
      })
    }

    return (
      <section>
        <div className="mainView mainContentView">
        <div className="pageContentWrap">
          <div className="fullWidthCard">
            <div className="wrap">
              <div className="conflictsCard">
              {
                conflictsRow.length > 0 &&
                <div>
                  <h2 className="conflictMessage">Conflicts between you and other choreographers.</h2>
                  <div className="xtraInfo tooltip">
                    <i className="fas fa-question-circle"></i>
                    <span className="tooltiptext">Conflicts happen when the number of choreographers who cast a dancer <b className="emphasis">exceed</b> the number of pieces that dancer can be in. </span>
                  </div> 
                  <table id="conflictsTable">
                    <tbody>
                      <tr className="categories">
                        <th className="avatarWrap"></th>
                        <th>#</th>
                        <th>Dancer</th>
                        <th>Pieces</th>
                        <th className="dancerRank">Rank</th>
                        <th>Choreographers</th>
                        <th></th>
                      </tr>
                      {conflictsRow}
                    </tbody>
                  </table>
                </div>
              }
              {
                conflictsRow.length === 0 &&
                <section>
                  <h2 className="conflictMessage">There are no conflicts between you and other choreographers</h2>
                  <div className="xtraInfo tooltip">
                    <i className="fas fa-question-circle"></i>
                    <span className="tooltiptext">Conflicts happen when the number of choreographers who cast a dancer <b className="emphasis">exceed</b> the number of pieces that dancer can be in. You can <b className="emphasis">drop</b> dancers to resolve conflicts.</span>
                  </div>
                </section>
              }
                </div>
            </div>
          </div>
          
          <div className="transparentCard">
          <div className="wrap wrapFlex">
            <div className="castList-v2 cardAddMargin">
              <div className="choreographersSelecteCast">
                <h2 className="smallHeading"> Your cast </h2>
                <div className="xtraInfo tooltip">
                    <i className="fas fa-question-circle"></i>
                    <span className="tooltiptext"> This is your current cast. You can still <b className="emphasis">drop</b> dancers.</span>
                  </div>
                <table id="yourCast">
                  <tbody>
                    <tr className="categories">
                      <th className="avatarWrap"></th>
                      <th>#</th>
                      <th>Dancer</th>
                      <th></th>
                    </tr>
                    {yourCast}
                  </tbody>
                </table>
              </div>
              </div>
              <div className="castList-v2">
              <div className="restOfCast">
                <h2 className="smallHeading"> All dancers </h2>
                <div className="xtraInfo tooltip">
                    <i className="fas fa-question-circle"></i>
                    <span className="tooltiptext">This is everyone who auditioned. You can <b className="emphasis">add</b> them to your cast.</span>
                  </div>
                <table id="allDancersTable">
                  <tbody>
                    <tr className="categories">
                      <th className="avatarWrap"></th>
                      <th>#</th>
                      <th>Dancer</th>
                      <th></th>
                    </tr>
                    {allDancers}
                  </tbody>
                </table>
              </div>
            </div>
        </div>
        </div>
        </div>
        </div>
      </section>
    );
  };

}
export default ResolveConflict;