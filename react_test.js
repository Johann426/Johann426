class MyForm extends React.Component {

	constructor(props) {

		super(props);

		this.state = {

			username: props.name,
			age: null,

		};

	}

	myChangeHandler = ( e ) => {

		let nam = e.target.name;
		let val = e.target.value;
		this.setState({[nam]: val});

	}

	render() {

		return (
			<form>
				<h1 id ='state'>{this.state.username}</h1>
				<p>Enter your name:</p>
				<input
					type='text'
					name='username'
					onChange={this.myChangeHandler}
				/>
			</form>
		);

	}

}

ReactDOM.render(<MyForm name = "curve" />, document.getElementById('root'));
