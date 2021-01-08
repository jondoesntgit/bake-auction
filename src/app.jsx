'use strict';


const instance = axios.create({
  baseURL: 'http://localhost:5000/',
  timeout: 1000,
})

class ManualEntry extends React.Component {
  constructor(props) {
    super(props);
    this.bidderInput = React.createRef();
  }

  onKeyUp(event) {
    if (event.charCode === 13) {
      this.bidderInput.current.focus();
      instance.get(`/bid?bidder_id=${this.state.bidder_id}&amount=${event.target.value}`
        //{bidder_id: parseInt(this.state.bidder_id), 
       // amount: parseFloat(event.target.value)}//,
       // {headers: {'content-type': 'text/json'}}
       )
      this.bidderInput.current.value = '';
      event.target.value = '';
    }
  }

  handleBidderNumber(event) {
    this.setState({ bidder_id: event.target.value})
  }

  render() {
    return (
      <React.Fragment>

        <input placeholder="Bidder" ref={this.bidderInput} onChange={this.handleBidderNumber.bind(this)}/>
        <input placeholder="Amount" onKeyPress={this.onKeyUp.bind(this)} />
        <br/>
        Text a dollar amount to (256) 973-8418 in order to bid
      </React.Fragment>
    )
  }
}

class LogRow extends React.Component {
  constructor(props) {
    super(props);
    this.state = {valid: true};
  }

  deleteMe(){
    console.log('Deleting', this.props.bid_id)
    instance.get(`/bid/${this.props.bid_id}/delete`)
  }

  render() {

    let mom = moment(this.props.timestamp * 1e3)
    let formattedTime = mom.format('hh:mm:ss')
    let bestBidString = this.props.bestBid ? 'Best Bid' : ''

    return (
      <div className={this.props.bestBid ? 'log-row best-bid' : 'log-row'}>
      <span className="date">{formattedTime}:</span>
      <span className="bidder">{this.props.bidder_id}</span>
      <span className="amount">${this.props.amount.toFixed(2)}</span>
      <span className="del" onClick={this.deleteMe.bind(this)}><i className="fa fa-trash"></i></span>
      </div>
    )
  }
}

class Log extends React.Component {
  constructor(props) {
    super(props);
    this.state = { 
      delay: 1000,
      events: [
      /*{timestamp: '4:00:23 pm', bidder_id: '123', amount: 12.32},
      {timestamp: '4:00:25 pm', bidder_id: '223', amount: 13.32},
      {timestamp: '4:00:28 pm', bidder_id: '323', amount: 14.32},*/
      ] };
      }

  poll() {

  }

  componentDidMount () {
    this.interval = setInterval(this.tick, this.state.delay)
  }

  tick = () => {
    if (this.props.showingLot == undefined) {
      return
    }

    instance.get('/bids/' + this.props.showingLot)
      .then( (results) => {

        let bestBid;

        if (Object.keys(results.data).length >= 1) {
        const reducer = (bid1, bid2) => {
          if (bid1.amount > bid2.amount) {
            return bid1
          } else if (bid2.amount > bid1.amount) {
            return bid2
          } else if (bid2.timestamp < bid1.timestamp) {
            return bid2
          } else {
            return bid1
          }
        }

        bestBid = Object.values(results.data).reduce(reducer)
        
        results.data[bestBid.bid_id]['bestBid'] = true
      } else {
        bestBid = null
      }


        let sortedArray = Object.values(results.data).sort(
          (a, b) => {
            return b.timestamp - a.timestamp
          }
          )




        this.setState({ eventsDict: results.data, events: sortedArray, bestBid: bestBid })
    })
  }


  componentWillUnmount () {
    clearInterval(this.interval)
  }

  render() {

    return (
      <div>
      {
        Object.values(this.state.events).map((event, index) => (
          <LogRow key={event.bid_id} {...event} />
          ))
      }
      </div>
    );
  }
}

class Showcase extends React.Component {
  constructor(props) {
    super(props);
  }

  render() {

    let data;

    if (this.props.activeLot != null) {
      data = this.props.activeLot
    } else {
      return (<React.Fragment>
        Loading...
      </React.Fragment>)
    }

    return (
      <React.Fragment>
        <img src={data.img_src} />
        <h1 className="Item Name">Lot #{data.lot_id}: {data.title}</h1>
        <span className="notes">{data.notes}</span>
      </React.Fragment>
    );
  }
}

class MainStats extends React.Component {
  constructor(props) {
    super(props);
    this.state = { bidder: '135', amount: 12.53 };
    // axios get current item
    // poll server for stuff
      }

  render() {

    return (
      <div>
        <h2 className="highest-bid">${this.state.amount.toFixed(2)}</h2>
        <h3 className="highest-bidder">#{this.state.bidder}</h3>
      </div>
    );
  }
}


class App extends React.Component { 
  constructor(props) {
    super(props);
    this.state = {lotOpen: false};
    // TODO: Load open or not
    //this.nextLot = this.nextLot.bind(this)
    //this.prevLot = this.prevLot.bind(this)
  }

  componentDidMount(){
    instance.get('/active_lot').then((response) => {
      if (response.data > 0) {
        this.setState({showingLot: response.data, lotOpen: true})
      } else {
        this.setState({showingLot: 1})
      }
    })
    instance.get('/lots')
      .then( (response) => {
        let startingLot = Math.min(...(Object.keys(response.data).map(key => parseInt(key))))        
        this.setState({lots: response.data})
      })
  }

  prevLot() {
    let MINLOT = 1;
    if (this.state.showingLot > MINLOT) {
      this.setState({showingLot: this.state.showingLot - 1})
    }
    this.stopLot()
  }

  nextLot() {
    let MAXLOT = Math.max(...(Object.keys(this.state.lots).map(key => parseInt(key))))
    if (this.state.showingLot < MAXLOT) {
      this.setState({showingLot: this.state.showingLot + 1
      })
      this.stopLot()
    }

  }

  startLot() {
    instance.get(`/lot/${this.state.showingLot}/start`)
    this.setState({lotOpen: true})
  }

  stopLot() {
    instance.get(`/lot/${this.state.showingLot}/stop`)
    this.setState({lotOpen: false})
  }

  render() {


    let activeLot;// = null;
    try {
      activeLot = this.state['lots'][this.state.showingLot]
    } catch (error) {
      activeLot = null
    }

    let startStopButton
    if (this.state.lotOpen) {
      startStopButton = <button className="togl btn btn-primary" onClick={this.stopLot.bind(this)}>Close bidding</button>
    } else {
      startStopButton = <button className="togl btn btn-primary" onClick={this.startLot.bind(this)}>Open bidding</button>
    }

    return (
      <React.Fragment>
      <Showcase activeLot={activeLot}/>
      <button className="btn btn-primary" onClick={this.prevLot.bind(this)}>Prev</button>
      {startStopButton}
      <button className="btn btn-primary" onClick={this.nextLot.bind(this)}>Next</button>
      <br/>
      {this.state.lotOpen && <ManualEntry />}
      <Log showingLot={this.state.showingLot}/>
      </React.Fragment>
    );
  }
}

let domContainer = document.querySelector('#app');
ReactDOM.render(<App />, domContainer);