# This is written for PYTHON 3
# Don't forget to install requests package

import requests
import json

accountId = '587799c11756fc834d8e8741'
apiKey = '5f754f5661ce9a56b4cff9f26ca2ba58'

url = 'http://api.reimaginebanking.com/accounts/{}/purchases?key={}'.format(accountId,apiKey)
payload = {
  "merchant_id": "58779cb61756fc834d8e8742",
  "medium": "balance",
  "purchase_date": "2017-01-12",
  "amount": 5,
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

# Uber merchant id: 5f754f5661ce9a56b4cff9f26ca2ba58
