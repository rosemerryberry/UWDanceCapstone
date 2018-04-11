import React, { Component } from 'react';
import * as Util from './util.js';

//components
import Availability from './Availability';

//styling
import SelectField from 'material-ui/SelectField';
import MenuItem from 'material-ui/MenuItem';
import TextField from 'material-ui/TextField';
import RaisedButton from 'material-ui/RaisedButton';
import { Card, CardText, CardTitle} from 'material-ui/Card';
import Checkbox from 'material-ui/Checkbox';
import './styling/Audition.css';

const styles = {
  customWidth: {
    width: 150,
  },
};

class Audition extends Component {
  constructor(props) {
    super(props);
    this.handleChange = this.handleChange.bind(this);
    this.handleRegister = this.handleRegister.bind(this);
    this.state ={
      value: 1,
      registered: false
    }
    console.log(this.props.audition)
  };

  handleChange = (event, index, value) => this.setState({value});

  setAvailability = (availability) => this.setState({availability: availability});

  addComment = (e) => this.setState({comments: e.target.value})

  handleRegister (){
    //MAKE POST
    //.then set state isRegistered to true, which will cause the page to rerender
    let body = {
      "comment" : this.state.comments,
      "availability" : {
        "days": this.state.availability
      }
    }

    Util.makeRequest("users/me/auditions/" + this.props.auditionID, body, "LINK", true)
    .then(res => {
      if (res.ok) {
        return res.json();
      }
      return res.text().then((t) => Promise.reject(t));
    })
    .then(res => {
      this.setState({
        registered: true
      })
    })
    .catch(err => console.log(err))
  }

  render() {
      return(
        <section className="main">
          <div className="audition">
            <h1 id="auditionTitle">{this.props.name}</h1>
            {
              this.state.registered === false &&
                <div className="auditionForm">
                  <div className="row">
                    <div><p>Number of pieces I am available for: </p></div>
                    <SelectField
                      value={this.state.value}
                      onChange={this.handleChange}
                      style={styles.customWidth}
                    >
                      <MenuItem value={1} primaryText="1" />
                      <MenuItem value={2} primaryText="2" />
                    </SelectField>
                  </div>
                  <br />
                  <div className="row">
                    <div>You must be enrolled in a class during the quarter the production is occurring.<br/>
                   </div>
                   <br />
                    <Checkbox
                      label="I confirm I am enrolled in a class for the quarter during which the show is occuring."
                      
                    />
                  </div>
                  <br/>
                  <div className="row">
                    <div><p>Availability [click & drag to indicate when you are <b>available</b> to rehearse]</p></div>
                    <Availability availability = {this.setAvailability}/>
                  </div>
                  <br/>
                  <div className="row">
                    <div><p>Please indicate any additional notes below</p></div>
                    <TextField
                      name="comments"
                      onChange = {this.addComment}
                      multiLine={true}
                      rows={2}
                    />
                  </div>
                  <RaisedButton className='register' onClick={this.handleRegister} style={{backgroundColor: "#BFB2E5"}}> Register </RaisedButton>
                </div>
            }
            {
              this.state.registered === true &&
              <div className="registered">
                <Card className="successCard">
                  <div className="success">
                    <CardTitle>You have successfully registered</CardTitle>
                  </div>
                    <CardText>
                      <p>Meany Hall Studio 265</p>
                      <p>Audition starts at 6:30</p>
                      <p>Doors open for warmup 30 minutes prior</p>
                    </CardText>
                </Card>
                <Card className="successCard" id="regCard">
                  <div className="regNum">
                    <CardTitle><h3>You are number</h3> </CardTitle>
                    </div>
                    <CardText id="numArea">
                      <p id="number">1</p>
                    </CardText>
                </Card>
              </div>
            }
          </div>
        </section>
      )
  }

}


export default Audition;