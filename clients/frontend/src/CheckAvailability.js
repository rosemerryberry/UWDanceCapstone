import React, { Component } from 'react';

class CheckAvailability extends Component {
  constructor(props) {
    super(props);
    this.state = {
      willEdit : true
    }
  };

  render() {
    return (
      <section className="main">
      <div className="mainView">
        <h1>Check Availabliity</h1>
        </div>
      </section>
  );
};

}
export default CheckAvailability;