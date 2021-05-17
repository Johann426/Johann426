class Car extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      brand: "Ford",
      model: "Mustang",
      color: "red",
      year: 1964
    };
  }
  changeHandler = (event) => {
    this.setState({username: event.target.value});
  }
  render() {
    return (
      <form>
      <h1>Hello {this.state.brand} {this.state.model} {this.state.color} </h1>
      <p>Enter your brand:</p>
      <input
        type='text'
        onChange={this.changeHandler}
      />
      </form>
    );
  }
}

ReactDOM.render(<Car/>, document.getElementById('root'));
