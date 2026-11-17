"""Anonymous retailer session; never use or persist the user's login cookies."""
import json,urllib.request,urllib.parse,http.cookiejar

class StoreSession:
 def __init__(self,host,store_id):
  if host not in ('www.willys.se','www.hemkop.se'):raise ValueError('Unsupported retailer')
  self.base='https://'+host;self.store_id=str(store_id)
  self.client=urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
  token=self(self.base+'/axfood/rest/csrf-token')
  if not isinstance(token,str) or not token:raise ValueError('Missing anonymous CSRF token')
  query=urllib.parse.urlencode({'storeId':self.store_id,'activelySelected':'true','forceAsPickingStore':'true'})
  request=urllib.request.Request(self.base+'/axfood/rest/v2/store/activate?'+query,method='POST',data=b'',headers={'Accept':'application/json','X-CSRF-Token':token,'User-Agent':'Matbudget-price-check/0.3'})
  with self.client.open(request,timeout=20) as response:response.read()
  active=self(self.base+'/axfood/rest/v2/store/active')
  if str(active.get('storeId'))!=self.store_id:raise ValueError('Retailer did not confirm the requested store')
 def __call__(self,url):
  if not url.startswith(self.base+'/'):raise ValueError('Unexpected retailer URL')
  request=urllib.request.Request(url,headers={'Accept':'application/json','User-Agent':'Matbudget-price-check/0.3'})
  with self.client.open(request,timeout=20) as response:return json.load(response)
