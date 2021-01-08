'use strict';

var _createClass = function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; }();

function _toConsumableArray(arr) { if (Array.isArray(arr)) { for (var i = 0, arr2 = Array(arr.length); i < arr.length; i++) { arr2[i] = arr[i]; } return arr2; } else { return Array.from(arr); } }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _possibleConstructorReturn(self, call) { if (!self) { throw new ReferenceError("this hasn't been initialised - super() hasn't been called"); } return call && (typeof call === "object" || typeof call === "function") ? call : self; }

function _inherits(subClass, superClass) { if (typeof superClass !== "function" && superClass !== null) { throw new TypeError("Super expression must either be null or a function, not " + typeof superClass); } subClass.prototype = Object.create(superClass && superClass.prototype, { constructor: { value: subClass, enumerable: false, writable: true, configurable: true } }); if (superClass) Object.setPrototypeOf ? Object.setPrototypeOf(subClass, superClass) : subClass.__proto__ = superClass; }

var instance = axios.create({
  baseURL: 'http://localhost:5000/',
  timeout: 1000
});

var ManualEntry = function (_React$Component) {
  _inherits(ManualEntry, _React$Component);

  function ManualEntry(props) {
    _classCallCheck(this, ManualEntry);

    var _this = _possibleConstructorReturn(this, (ManualEntry.__proto__ || Object.getPrototypeOf(ManualEntry)).call(this, props));

    _this.bidderInput = React.createRef();
    return _this;
  }

  _createClass(ManualEntry, [{
    key: 'onKeyUp',
    value: function onKeyUp(event) {
      if (event.charCode === 13) {
        this.bidderInput.current.focus();
        instance.get('/bid?bidder_id=' + this.state.bidder_id + '&amount=' + event.target.value
        //{bidder_id: parseInt(this.state.bidder_id), 
        // amount: parseFloat(event.target.value)}//,
        // {headers: {'content-type': 'text/json'}}
        );
        this.bidderInput.current.value = '';
        event.target.value = '';
      }
    }
  }, {
    key: 'handleBidderNumber',
    value: function handleBidderNumber(event) {
      this.setState({ bidder_id: event.target.value });
    }
  }, {
    key: 'render',
    value: function render() {
      return React.createElement(
        React.Fragment,
        null,
        React.createElement('input', { placeholder: 'Bidder', ref: this.bidderInput, onChange: this.handleBidderNumber.bind(this) }),
        React.createElement('input', { placeholder: 'Amount', onKeyPress: this.onKeyUp.bind(this) }),
        React.createElement('br', null),
        'Text a dollar amount to (256) 973-8418 in order to bid'
      );
    }
  }]);

  return ManualEntry;
}(React.Component);

var LogRow = function (_React$Component2) {
  _inherits(LogRow, _React$Component2);

  function LogRow(props) {
    _classCallCheck(this, LogRow);

    var _this2 = _possibleConstructorReturn(this, (LogRow.__proto__ || Object.getPrototypeOf(LogRow)).call(this, props));

    _this2.state = { valid: true };
    return _this2;
  }

  _createClass(LogRow, [{
    key: 'deleteMe',
    value: function deleteMe() {
      console.log('Deleting', this.props.bid_id);
      instance.get('/bid/' + this.props.bid_id + '/delete');
    }
  }, {
    key: 'render',
    value: function render() {

      var mom = moment(this.props.timestamp * 1e3);
      var formattedTime = mom.format('hh:mm:ss');
      var bestBidString = this.props.bestBid ? 'Best Bid' : '';

      return React.createElement(
        'div',
        { className: this.props.bestBid ? 'log-row best-bid' : 'log-row' },
        React.createElement(
          'span',
          { className: 'date' },
          formattedTime,
          ':'
        ),
        React.createElement(
          'span',
          { className: 'bidder' },
          this.props.bidder_id
        ),
        React.createElement(
          'span',
          { className: 'amount' },
          '$',
          this.props.amount.toFixed(2)
        ),
        React.createElement(
          'span',
          { className: 'del', onClick: this.deleteMe.bind(this) },
          React.createElement('i', { className: 'fa fa-trash' })
        )
      );
    }
  }]);

  return LogRow;
}(React.Component);

var Log = function (_React$Component3) {
  _inherits(Log, _React$Component3);

  function Log(props) {
    _classCallCheck(this, Log);

    var _this3 = _possibleConstructorReturn(this, (Log.__proto__ || Object.getPrototypeOf(Log)).call(this, props));

    _this3.tick = function () {
      if (_this3.props.showingLot == undefined) {
        return;
      }

      instance.get('/bids/' + _this3.props.showingLot).then(function (results) {

        var bestBid = void 0;

        if (Object.keys(results.data).length >= 1) {
          var reducer = function reducer(bid1, bid2) {
            if (bid1.amount > bid2.amount) {
              return bid1;
            } else if (bid2.amount > bid1.amount) {
              return bid2;
            } else if (bid2.timestamp < bid1.timestamp) {
              return bid2;
            } else {
              return bid1;
            }
          };

          bestBid = Object.values(results.data).reduce(reducer);

          results.data[bestBid.bid_id]['bestBid'] = true;
        } else {
          bestBid = null;
        }

        var sortedArray = Object.values(results.data).sort(function (a, b) {
          return b.timestamp - a.timestamp;
        });

        _this3.setState({ eventsDict: results.data, events: sortedArray, bestBid: bestBid });
      });
    };

    _this3.state = {
      delay: 1000,
      events: [
        /*{timestamp: '4:00:23 pm', bidder_id: '123', amount: 12.32},
        {timestamp: '4:00:25 pm', bidder_id: '223', amount: 13.32},
        {timestamp: '4:00:28 pm', bidder_id: '323', amount: 14.32},*/
      ] };
    return _this3;
  }

  _createClass(Log, [{
    key: 'poll',
    value: function poll() {}
  }, {
    key: 'componentDidMount',
    value: function componentDidMount() {
      this.interval = setInterval(this.tick, this.state.delay);
    }
  }, {
    key: 'componentWillUnmount',
    value: function componentWillUnmount() {
      clearInterval(this.interval);
    }
  }, {
    key: 'render',
    value: function render() {

      return React.createElement(
        'div',
        null,
        Object.values(this.state.events).map(function (event, index) {
          return React.createElement(LogRow, Object.assign({ key: event.bid_id }, event));
        })
      );
    }
  }]);

  return Log;
}(React.Component);

var Showcase = function (_React$Component4) {
  _inherits(Showcase, _React$Component4);

  function Showcase(props) {
    _classCallCheck(this, Showcase);

    return _possibleConstructorReturn(this, (Showcase.__proto__ || Object.getPrototypeOf(Showcase)).call(this, props));
  }

  _createClass(Showcase, [{
    key: 'render',
    value: function render() {

      var data = void 0;

      if (this.props.activeLot != null) {
        data = this.props.activeLot;
      } else {
        return React.createElement(
          React.Fragment,
          null,
          'Loading...'
        );
      }

      return React.createElement(
        React.Fragment,
        null,
        React.createElement('img', { src: data.img_src }),
        React.createElement(
          'h1',
          { className: 'Item Name' },
          'Lot #',
          data.lot_id,
          ': ',
          data.title
        ),
        React.createElement(
          'span',
          { className: 'notes' },
          data.notes
        )
      );
    }
  }]);

  return Showcase;
}(React.Component);

var MainStats = function (_React$Component5) {
  _inherits(MainStats, _React$Component5);

  function MainStats(props) {
    _classCallCheck(this, MainStats);

    var _this5 = _possibleConstructorReturn(this, (MainStats.__proto__ || Object.getPrototypeOf(MainStats)).call(this, props));

    _this5.state = { bidder: '135', amount: 12.53 };
    // axios get current item
    // poll server for stuff
    return _this5;
  }

  _createClass(MainStats, [{
    key: 'render',
    value: function render() {

      return React.createElement(
        'div',
        null,
        React.createElement(
          'h2',
          { className: 'highest-bid' },
          '$',
          this.state.amount.toFixed(2)
        ),
        React.createElement(
          'h3',
          { className: 'highest-bidder' },
          '#',
          this.state.bidder
        )
      );
    }
  }]);

  return MainStats;
}(React.Component);

var App = function (_React$Component6) {
  _inherits(App, _React$Component6);

  function App(props) {
    _classCallCheck(this, App);

    var _this6 = _possibleConstructorReturn(this, (App.__proto__ || Object.getPrototypeOf(App)).call(this, props));

    _this6.state = { lotOpen: false };
    // TODO: Load open or not
    //this.nextLot = this.nextLot.bind(this)
    //this.prevLot = this.prevLot.bind(this)
    return _this6;
  }

  _createClass(App, [{
    key: 'componentDidMount',
    value: function componentDidMount() {
      var _this7 = this;

      instance.get('/active_lot').then(function (response) {
        if (response.data > 0) {
          _this7.setState({ showingLot: response.data, lotOpen: true });
        } else {
          _this7.setState({ showingLot: 1 });
        }
      });
      instance.get('/lots').then(function (response) {
        var startingLot = Math.min.apply(Math, _toConsumableArray(Object.keys(response.data).map(function (key) {
          return parseInt(key);
        })));
        _this7.setState({ lots: response.data });
      });
    }
  }, {
    key: 'prevLot',
    value: function prevLot() {
      var MINLOT = 1;
      if (this.state.showingLot > MINLOT) {
        this.setState({ showingLot: this.state.showingLot - 1 });
      }
      this.stopLot();
    }
  }, {
    key: 'nextLot',
    value: function nextLot() {
      var MAXLOT = Math.max.apply(Math, _toConsumableArray(Object.keys(this.state.lots).map(function (key) {
        return parseInt(key);
      })));
      if (this.state.showingLot < MAXLOT) {
        this.setState({ showingLot: this.state.showingLot + 1
        });
        this.stopLot();
      }
    }
  }, {
    key: 'startLot',
    value: function startLot() {
      instance.get('/lot/' + this.state.showingLot + '/start');
      this.setState({ lotOpen: true });
    }
  }, {
    key: 'stopLot',
    value: function stopLot() {
      instance.get('/lot/' + this.state.showingLot + '/stop');
      this.setState({ lotOpen: false });
    }
  }, {
    key: 'render',
    value: function render() {

      var activeLot = void 0; // = null;
      try {
        activeLot = this.state['lots'][this.state.showingLot];
      } catch (error) {
        activeLot = null;
      }

      var startStopButton = void 0;
      if (this.state.lotOpen) {
        startStopButton = React.createElement(
          'button',
          { className: 'togl btn btn-primary', onClick: this.stopLot.bind(this) },
          'Close bidding'
        );
      } else {
        startStopButton = React.createElement(
          'button',
          { className: 'togl btn btn-primary', onClick: this.startLot.bind(this) },
          'Open bidding'
        );
      }

      return React.createElement(
        React.Fragment,
        null,
        React.createElement(Showcase, { activeLot: activeLot }),
        React.createElement(
          'button',
          { className: 'btn btn-primary', onClick: this.prevLot.bind(this) },
          'Prev'
        ),
        startStopButton,
        React.createElement(
          'button',
          { className: 'btn btn-primary', onClick: this.nextLot.bind(this) },
          'Next'
        ),
        React.createElement('br', null),
        this.state.lotOpen && React.createElement(ManualEntry, null),
        React.createElement(Log, { showingLot: this.state.showingLot })
      );
    }
  }]);

  return App;
}(React.Component);

var domContainer = document.querySelector('#app');
ReactDOM.render(React.createElement(App, null), domContainer);