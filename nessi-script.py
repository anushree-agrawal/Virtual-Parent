# This is written for PYTHON 3
# Don't forget to install requests package

import requests
import json

def do_nessie_stuff(cost, date, merc_id):
    accountId = '5877aeff1756fc834d8e878c'
    apiKey = '5f754f5661ce9a56b4cff9f26ca2ba58'

    url = 'http://api.reimaginebanking.com/accounts/{}/purchases?key={}'.format(accountId,apiKey)
    payload = {
      "merchant_id": merc_id,
      "medium": "balance",
      "purchase_date": date,
      "amount": cost,
      "description": "string"
    }
    # Create a Savings Account
    response = requests.post( 
        url, 
        data=json.dumps(payload),
        headers={'content-type':'application/json'},
        )

    if response.status_code == 201:
        print('account created')
    else:
        print('did not work' + str(response.status_code))

#SHOPPING
do_nessie_stuff(34.52, "2016-12-29", "58780c241756fc834d8eb323")
do_nessie_stuff(23.41, "2016-12-9", "58780b7f1756fc834d8eb31c")

#ENTERTAINMENT
do_nessie_stuff(9.83, "2016-12-10", "58780ee41756fc834d8eb328")

#TRANSPORTATION
do_nessie_stuff(19.23, "2016-12-29", "58780c7a1756fc834d8eb324")

def deposit(amount, date):
    accountId = '5877aeff1756fc834d8e878c'
    apiKey = '5f754f5661ce9a56b4cff9f26ca2ba58'

    url = 'http://api.reimaginebanking.com/accounts/{}/deposits?key={}'.format(accountId,apiKey)
    payload = {
        "medium": "balance",
        "transaction_date": date,
        "amount": amount,
        "description": "cash"
    }
    # Create a Savings Account
    response = requests.post( 
        url, 
        data=json.dumps(payload),
        headers={'content-type':'application/json'},
        )

    if response.status_code == 201:
        print('deposited')
    else:
        print('did not work' + str(response.status_code))
        
        

    # Uber merchant id: 5f754f5661ce9a56b4cff9f26ca2ba58
    # rent merchant id: 5877b28b1756fc834d8e87ad
    # loan merchant id: 5877b2a71756fc834d8e87ae
    # forever21 merchant id: 58780b7f1756fc834d8eb31c
    # macy's merchant id: 58780c241756fc834d8eb323
    # shell merchant id: 58780c7a1756fc834d8eb324
    # movie tavern merchant id: 58780ee41756fc834d8eb328
    
    

## UBER PAYMENTS
# do_nessie_stuff(9.83, "2017-01-10", "58779cb61756fc834d8e8742")
# do_nessie_stuff(10.56, "2017-01-05", "58779cb61756fc834d8e8742")
# do_nessie_stuff(22.45, "2017-01-30", "58779cb61756fc834d8e8742")
# do_nessie_stuff(2.23, "2017-01-22", "58779cb61756fc834d8e8742")
# do_nessie_stuff(18.45, "2017-01-01", "58779cb61756fc834d8e8742")
# # RENT PAYMENT
# do_nessie_stuff(250, "2017-01-01", "5877b28b1756fc834d8e87ad")
# do_nessie_stuff(250, "2017-02-01", "5877b28b1756fc834d8e87ad")
# WEEKLY DEPOSITS
# deposit(100, "2017-01-01")
# deposit(100, "2017-01-08")
# deposit(100, "2017-01-15")
# deposit(100, "2017-01-22")
# deposit(100, "2017-01-29")
# deposit(100, "2017-02-05")
# deposit(100, "2017-02-12")
# deposit(100, "2017-02-19")
# deposit(100, "2017-02-26")

# Food merchant IDs: 57cf75cea73e494d8675ec5b Buffalo Wild Wings
# some bar: 57cf75cea73e494d8675ec57
# cafe: 57cf75cea73e494d8675ec4d
# dunkin:57cf75cea73e494d8675ec49
# do_nessie_stuff(5.32, "2017-01-11", "57cf75cea73e494d8675ec5b")
# do_nessie_stuff(34.32, "2017-01-11", "57cf75cea73e494d8675ec57")
# do_nessie_stuff(7.84, "2017-01-01", "57cf75cea73e494d8675ec4d")
# do_nessie_stuff(4.32, "2017-01-08", "57cf75cea73e494d8675ec49")
# do_nessie_stuff(7.32, "2017-01-08", "57cf75cea73e494d8675ec49")

