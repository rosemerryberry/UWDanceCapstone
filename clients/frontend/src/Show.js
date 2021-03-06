import React, { Component } from 'react';
import './styling/Show.css';

class Show extends Component {


  render() {
    return (
      <section className="main">
      <div className="mainView">
        <div className="show">
          <h1 id='showTitle'>{this.props.name}</h1>
        </div>
      </div>
      </section>
    );
  };
}

export default Show;