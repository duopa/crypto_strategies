# main.py

import requests
import markets
from markets.bithumb import *
from markets.coinone import *

def main():
    with open('./keys.json', 'r') as load_keys_f:

        load_keys_dict = json.load(load_keys_f)

        kBithumbAccess = load_keys_dict['bithumb']['access']
        kBithumbSecret = load_keys_dict['bithumb']['secret']

        kCoinoneAccess = load_keys_dict['coinone']['access']
        kCoinoneSecret = load_keys_dict['coinone']['secret']

        print('\33[1;31;40m ******** Load Keys Complete in', __file__, '******** \33[0m')

    # Initialization
    #apiBithumb = BithumbAPI(kBithumbAccess, kBithumbSecret)
    apiCoinone = CoinoneAPI(kCoinoneAccess, kCoinoneSecret)

    #print(apiCoinone.fnGetBalance())

    payload = {'currency': 'xrp'}
    ticker = requests.get('https://api.coinone.co.kr/ticker/', params=payload)
    print(ticker.content)
    time.sleep(1)
    orderbook = requests.get('https://api.coinone.co.kr/orderbook/', params=payload)
    content = orderbook.content.decode('UTF-8')
    print(type(orderbook.content))
    print(type(content))
    dictContent = json.loads(content)
    print('bid', dictContent['bid'][0])
    print('ask', dictContent['ask'][0])

if __name__ == '__main__':
    main()


"""

def sys_print(sMsg, sFile, sLine):
    print('%s in %s @ %s]' % (sMsg, sFile, sLine))

def get_base_payload():
    return {'access_token': ACCESS_TOKEN}

def str_2_byte(s, encode='utf-8'):
    return bytes(s, encode)

def get_encoded_payload(payload):
    payload['nonce'] = int(time.time()*1000)
    #sys_print(payload, __file__, sys._getframe().f_lineno)
    dumped_json = json.dumps(payload)
    #sys_print(dumped_json, __file__, sys._getframe().f_lineno)
    encoded_json = base64.b64encode(str_2_byte(dumped_json))
    #sys_print(encoded_json, __file__, sys._getframe().f_lineno)
    return encoded_json

def get_signature(encoded_payload):
    signature = hmac.new(str_2_byte(UPPERCASE_SECRET_KEY), encoded_payload, hashlib.sha512)
    return signature.hexdigest()

def get_response(url, payload):
    encoded_payload = get_encoded_payload(payload)
    #sys_print(encoded_payload, __file__, sys._getframe().f_lineno)
    signature = get_signature(encoded_payload)
    #sys_print(signature, __file__, sys._getframe().f_lineno)
    headers = {
        'Content-Type': 'application/json',
        'X-COINONE-PAYLOAD': encoded_payload,
        'X-COINONE-SIGNATURE': signature,
    }
    #sys_print(headers, __file__, sys._getframe().f_lineno)
    api_url = HOST + url
    #sys_print(api_url, __file__, sys._getframe().f_lineno)
    req = Request(api_url, data=encoded_payload, headers=headers, method='POST')
    #sys_print(req, __file__, sys._getframe().f_lineno)

    with urlopen(req) as res:
        #sys_print(res, __file__, sys._getframe().f_lineno)
        data = res.read().decode('utf-8')
        #sys_print(data, __file__, sys._getframe().f_lineno)
        return json.loads(data)

def get_base_payload():
    return {"order_currency" : "BTC", "payment_currency" : "KRW"}

def get_response(endpoint, payload):
    endpoint_item_array = {
        'endpoint': endpoint
    }

    payload['nonce'] = int(time.time()*1000)
    sys_print(payload, __file__, sys._getframe().f_lineno)

    uri_array = dict(endpoint_item_array, **payload)
    sys_print(uri_array, __file__, sys._getframe().f_lineno)

    str_data = urllib.parse.urlencode(uri_array)
    sys_print(str_data, __file__, sys._getframe().f_lineno)

    #data = endpoint + chr(0) + str_data
    #sys_print(data, __file__, sys._getframe().f_lineno)
    
    utf8_data = str_data.encode('utf-8')
    sys_print(utf8_data, __file__, sys._getframe().f_lineno)

    key = SECRET_KEY
    utf8_key = key.encode('utf-8')
    sys_print(utf8_key, __file__, sys._getframe().f_lineno)

    h = hmac.new(bytes(utf8_key), utf8_data, hashlib.sha512)
    sys_print(h, __file__, sys._getframe().f_lineno)

    hex_output = h.hexdigest()
    utf8_hex_output = hex_output.encode('utf-8')
    sys_print(utf8_hex_output, __file__, sys._getframe().f_lineno)

    api_sign = base64.b64encode(utf8_hex_output)
    sys_print(api_sign, __file__, sys._getframe().f_lineno)

    utf8_api_sign = api_sign.decode('utf-8')
    sys_print(utf8_api_sign, __file__, sys._getframe().f_lineno)

    headers = {
    'Accept': 'application/json',
    'Content-Type': 'application/x-www-form-urlencoded',
    'Api-Key': ACCESS_TOKEN,
    'Api-Sign': utf8_api_sign,
    'Api-Nonce': nonce,
    }

    api_url = HOST + endpoint
    #req = Request(api_url, data=encoded_payload, headers=headers, method='POST')
    req = Request(api_url, headers=headers, method='POST')

    with urlopen(req) as res:
        #sys_print(res, __file__, sys._getframe().f_lineno)
        data = res.read().decode('utf-8')
        #sys_print(data, __file__, sys._getframe().f_lineno)
        return json.loads(data)

#data = get_response('v2/account/balance/', get_base_payload())
data = get_response('info/balance/', get_base_payload())
#sys_print(data, __file__, sys._getframe().f_lineno)
#sys_print(data['xrp']['balance'], __file__, sys._getframe().f_lineno)
"""
