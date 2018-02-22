# coinone.py

import base64
import hashlib
import hmac
import json
import time
from urllib.request import urlopen, Request

class CoinoneAPI:

    HOST = 'https://api.coinone.co.kr/'

    def __init__(self, kCoinoneAccess, kCoinoneSecret):

        self.ACCESS_KEY = kCoinoneAccess
        self.SECRET_KEY = kCoinoneSecret

    def fnGetBalance(self):

        dictBasePayload = {'access_token': self.ACCESS_KEY}

        dictBasePayload['nonce'] = int(time.time()*1000)
        jsonBasePayload = json.dumps(dictBasePayload)
        encJsonBasePayload = base64.b64encode(bytes(jsonBasePayload, 'utf-8'))

        signature = hmac.new( \
                bytes(self.SECRET_KEY.upper(), 'utf-8'), \
                encJsonBasePayload, hashlib.sha512 \
                )

        headers = { \
                'Accept': 'application/json', \
                'Content-Type': 'application/json', \
                'X-COINONE-PAYLOAD': encJsonBasePayload, \
                'X-COINONE-SIGNATURE': signature.hexdigest(), \
                }

        API_URL = self.HOST + 'v2/account/balance/'
        req = Request(API_URL, data=encJsonBasePayload, headers=headers, method='POST')

        for i in range(100):

            with urlopen(req) as res:
                jsonData = res.read().decode('utf-8')
                dictData = json.loads(jsonData)

            if dictData['result'] == 'success':
                print('\33[1;31;40m ******** fnGetBalance succeed ******** \33[0m')
                break
            else:
                print('\33[1;31;40m ******** fnGetBalance Retry After 1 Second ******** \33[0m')
                time.sleep(1)

        return dictData

    def fnPrintCoinoneAPI(self):
        print('In CoinoneAPI')
        return;

