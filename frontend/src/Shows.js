import React, { Component } from 'react';
import './styling/Shows.css';

class Shows extends Component {
  constructor(props) {
    super(props);
    console.log(this.state);
  };

  render() {
    return (
      <div>
        <h1>Shows!</h1>
      </div>
    );
  };
}

export default Shows;