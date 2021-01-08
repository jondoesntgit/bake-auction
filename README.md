# Bake Auction Server

This is a server that I used in a virtual 2020 Zoom Bake Auction.

All of the data lives in a SQLite3 database. The database has tables that contain contact information for bidders, information about the lots that are being sold off, and keeps track of all of the bids (with timestamps, etc...). 

The SQLite3 database id managed by a Python Flask server. The Flask server allows certain interactions with the database through several different endpoints (e.g., an endpoint that returns all of the lots and their metadata, an endpoint that returns all of the bids for the current lot, etc...)

There is a ReactJS frontend that is loaded up when the auctioneer opens index.html. The ReactJS code loads a single-page webapp that allows the auctioneer to cycle through the available lots, start and stop the bidding on each lot, enter in bids, remove accidental bids, etc...

Flask has a special endpoint at `/sms` which allows the [Twilio](twilio.com) API to send text messages to the Flask server.

## Setup

Because I'm documenting this all a while after the fact, I'm not 100% sure on what all needs to be set up for a clean install on a new computer. However, from memory, there are a few things you'll need to do:

- start the flask server by running `export FLASK_APP=bidder-server.py; python -m flask run`
- setup port forwarding with [ngrok](https://ngrok.com/) in order to open up a port on the bidder's laptop to the internet
- setup Twilio. Under the SMS API, somewhere there's a setting for what to do with received text messages. You want to send them to your ngrok URL at port 5000 (or whatever port the bidder-server Flask app is running on your local machine)

Lets are read in from a special table in the SQLite3 database. Before the auction, enter in all of the bids, as well as a publically accessible URL for the pictures of each item that you want to auction off.

In order to watch the bids as they come in, start up the server, and open in a web browser the `index.html` file. If the server is running, ngrok is forwarding, and Twilio is configured correctly, then as users send text messages to the service their bids will show up live on the screen.

## Improvements

If you want to tweak the React code, just edit the .jsx file in `src`. The build command is

```
npx babel --watch src --out-dir . --presets react-app/prod
```
