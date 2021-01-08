import sqlite3
import re
from flask import Flask, request
from twilio.rest import Client 
import time
import re
import json

from flask_cors import CORS, cross_origin
app = Flask(__name__)
cors = CORS(app)
app.config['CORS_HEADERS'] = 'Content-Type'

TWILIO_ACCOUNT_SID = # FILL THIS IN
TWILIO_AUTHTOKEN = # FILL THIS IN
client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTHTOKEN)

SQLITE_FILE = 'bake-auction.db'

RESPONSE_TEMPLATE = '''<?xml version="1.0" encoding="UTF-8"?>
<Response>
    <Message><Body>%s</Body></Message>
</Response>'''

dollar_search = r'\$?(\d{0,3}\.?(?:\d{2})?)\s*$'             

def send(to, body):
    message = client.messages.create( 
          from_=# FILL THIS IN,  
          body=body,
          to=to 
      ) 

def get_current_lot(cur, the_time=None):
    if the_time is None:
        the_time = time.time()
        cur.execute('SELECT lot_id FROM lot_times WHERE start_time < ? AND (end_time > ? OR end_time is null)',
            (the_time, the_time))
        results = cur.fetchall()
        if len(results) == 0:
            return None
        elif len(results) == 1:
            return results[0][0]
        else:
            print('Multiple results')
            print(results)


def get_bidder_id(phone_number):
    with sqlite3.connect(SQLITE_FILE) as conn:
        cur = conn.cursor()
        
        cur.execute('SELECT id FROM bidders WHERE phone=? LIMIT 1', (phone_number,))
        results = cur.fetchall()
        if len(results) == 1:
            return results[0][0]
        else:
            return None
            
def is_blacklisted(phone_number):
    with sqlite3.connect(SQLITE_FILE) as conn:
        cur = conn.cursor()
        
        cur.execute('SELECT blacklist FROM bidders WHERE phone=? AND blacklist = 1 LIMIT 1', (phone_number,))
        results = cur.fetchall()
        if len(results) == 1:
            return True
        else:
            return False

def register_bid(bidder_id, amount):
    with sqlite3.connect(SQLITE_FILE) as conn:
        cur = conn.cursor()
        
        active_lot = get_current_lot(cur)
        print(active_lot)
        if active_lot is None:
            return 'The bidding is not open right now.'
     
        SQL = 'INSERT INTO bids (lot_number, amount, time_received, bidder_id) VALUES (?, ?, ?, ?)'
        cur.execute(SQL, (active_lot, amount, time.time(), bidder_id))   
        
        SQL = 'SELECT amount, bidder_id FROM bids WHERE lot_number = ? ORDER BY amount DESC LIMIT 1'
        cur.execute(SQL, (active_lot,))
        highest_bid, highest_bidder_id = cur.fetchone()

        if highest_bidder_id == bidder_id:
            return 'You have the highest bid with $%.2f!' % highest_bid
            
        else:
            return 'Sorry, bidder %s has the highest bid with $%.2f' % (highest_bidder_id, highest_bid)

@app.route('/')
def hello_world():
    return 'Hello, World!'

@app.route('/sms', methods=['POST', 'GET'])
def sms():
    received_time = time.time()
    d = request.form.to_dict()
    SmsMessageSid = d['SmsMessageSid']
    body = d['Body']
    from_ = d['From']

    if is_blacklisted(from_):
        return RESPONSE_TEMPLATE % ('Unable to connect')

    bidder_id = get_bidder_id(from_)
    if bidder_id is None:
        print(from_)
        response = RESPONSE_TEMPLATE % ('You have not been registered. Please get the auctioneers attention and let him know you need to get registered')
        return response     

    with sqlite3.connect(SQLITE_FILE) as conn:
        cur = conn.cursor()
        cur.execute('SELECT first_name, last_name FROM bidders WHERE id = ?', (bidder_id,))
        bidder_first, bidder_last = cur.fetchone()
        bidder_name = '%s %s' % (bidder_first, bidder_last)
    
    m = re.search(dollar_search, body)
    if m:
        bid_amount = float(m.group(1))
        #response = register_bid(bidder_id, bid_amount)
        response = register_bid(bidder_name, bid_amount)
    else:
        response = 'I could not find a valid bid amount in your text message.'

    response = RESPONSE_TEMPLATE % response
    return response

@app.route('/active_lot')
def active_lot():
    with sqlite3.connect(SQLITE_FILE) as conn:
        current_lot = get_current_lot(conn.cursor())
        if current_lot:
            return str(current_lot)
        else:
            return str(-1)

@app.route('/lots')
def lots():
    with sqlite3.connect(SQLITE_FILE) as conn:
        cur = conn.cursor()
        cur.execute('SELECT lot_id, name, description, donor, notes, picture_url FROM lots;')
        results = cur.fetchall()

        def parse(result):
            lot_id, name, description, donor, notes, picture_url = result
            return {
                "lot_id": lot_id,
                "title": name,
                "description": description,
                "donor": donor,
                "notes": notes,
                "img_src": picture_url
            }
        return {res[0]: parse(res) for res in results}

@app.route('/bids/<int:lot_id>')
def get_bids_for_lot(lot_id):
    with sqlite3.connect(SQLITE_FILE) as conn:
        cur = conn.cursor()
        #cur.execute('SELECT bid_id, lot_number, time_received, amount, bidder_id FROM bids WHERE lot_number = ?', (lot_id,))
        cur.execute(
            'SELECT bid_id, lot_number, time_received, amount, bidder_id FROM bids WHERE lot_number = ?', (lot_id,))
        results = cur.fetchall()

    def parse(result):
        bid_id, lot_number, time_received, amount, bidder_id = result
        return {
            'bid_id': bid_id,
            'lot_number': lot_number,
            'timestamp': time_received,
            'amount': amount,
            'bidder_id': bidder_id
        }

    return {res[0]: parse(res) for res in results}

@app.route('/lot/<int:lot_id>/start')
def start_lot(lot_id):
    with sqlite3.connect(SQLITE_FILE) as conn:
        cur = conn.cursor()
        cur.execute('UPDATE lot_times SET end_time = ? WHERE end_time IS NULL', (time.time(),))
        cur.execute('INSERT INTO lot_times (lot_id, start_time) VALUES (?, ?)', (lot_id, time.time()))    
    return ''

@app.route('/lot/<int:lot_id>/stop')
def stop_lot(lot_id):
    with sqlite3.connect(SQLITE_FILE) as conn:
        cur = conn.cursor()
        cur.execute('UPDATE lot_times SET end_time = ? WHERE lot_id = ? AND end_time IS NULL', (time.time(), lot_id))
    return ''

@app.route('/bid/<int:bid_id>/delete')    
def delete_bid(bid_id):
    with sqlite3.connect(SQLITE_FILE) as conn:
        cur = conn.cursor()
        cur.execute('DELETE FROM bids WHERE bid_id = ?', (bid_id,))
    return ''

@app.route('/bid', methods=['GET'])
def create_bid():
    #print(request)
    #//print(dir(request))
    #int(request.args)
    with sqlite3.connect(SQLITE_FILE) as conn:
        cur = conn.cursor()
        lot_id = get_current_lot(cur)
        #print(type(lot_id))
        #data = json.loads(request.data.decode('utf-8'))
        data = request.args
        #print(data)
        payload = lot_id, time.time(), data['amount'], data['bidder_id']
        #print(payload)
        cur.execute('INSERT INTO bids (lot_number, time_received, amount, bidder_id) VALUES (?, ?, ?, ?)',
         payload)
        return ''