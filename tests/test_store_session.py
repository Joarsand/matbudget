import unittest,json,io,sys
from pathlib import Path
from unittest.mock import patch
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts'))
from store_session import StoreSession
from catalogue import axfood_product

class StoreTests(unittest.TestCase):
 def client(self,store):
  calls=[]
  class Client:
   def open(self,request,timeout=0):
    calls.append(request)
    if request.full_url.endswith('csrf-token'):data='anonymous-test-token'
    elif request.full_url.endswith('/active'):data={'storeId':store}
    else:data={}
    return io.BytesIO(json.dumps(data).encode())
  return Client(),calls
 def test_store_selected_and_verified_in_the_same_anonymous_session(self):
  client,calls=self.client('2295')
  with patch('urllib.request.build_opener',return_value=client):s=StoreSession('www.willys.se','2295')
  self.assertEqual(len(calls),3);self.assertEqual(calls[1].get_method(),'POST');self.assertIn('storeId=2295',calls[1].full_url)
  with self.assertRaises(ValueError):s('https://another-retailer.invalid/search')
 def test_wrong_store_confirmation_stops_ingestion(self):
  client,calls=self.client('wrong')
  with patch('urllib.request.build_opener',return_value=client),self.assertRaises(ValueError):StoreSession('www.willys.se','2295')
 def test_catalogue_retains_raw_price_basis_and_rejects_unavailable_products(self):
  p={'code':'x','name':'Fruit','priceValue':1.005,'priceUnit':'kr/kg','displayVolume':'1kg'}
  quote=axfood_product(p,'willys','2295','Willys','https://www.willys.se/search?q=fruit','2026-11-10T12:00:00Z')
  self.assertEqual(quote['priceOre'],101);self.assertEqual(quote['retailUnit'],'kr/kg');self.assertTrue(quote['storeVerified'])
  self.assertIsNone(axfood_product({**p,'outOfStock':True},'willys','2295','Willys','url','time'))
if __name__=='__main__':unittest.main()
