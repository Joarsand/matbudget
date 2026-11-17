"""Refresh public retailer addresses; preserve each source separately on failure."""
import argparse,json,urllib.request
from pathlib import Path
from datetime import datetime
from zoneinfo import ZoneInfo

def sync(folder):
 places=json.loads((folder/'postal-se.json').read_text(encoding='utf8'))['places']
 try:old=json.loads((folder/'store-directory.json').read_text(encoding='utf8'))
 except (OSError,ValueError):old={'stores':[]}
 rows=[];errors=[]
 for chain in ['willys','hemkop']:
  url='https://www.'+chain+'.se/axfood/rest/store'
  try:
   req=urllib.request.Request(url,headers={'Accept':'application/json','User-Agent':'Matbudget-store-check/0.1'})
   with urllib.request.urlopen(req,timeout=25) as r:data=json.load(r)
   if not isinstance(data,list) or len(data)<10:raise ValueError('Incomplete directory.')
   selected=[]
   for s in data:
    a=s.get('address') or {};g=s.get('geoPoint') or {}
    if s.get('externalPickupLocation') or not g.get('latitude') or not g.get('longitude'):continue
    selected.append({'chain':chain,'id':s['storeId'],'name':s['name'],'city':a.get('town',''),'postalCode':a.get('postalCode','').replace(' ',''),'address':a.get('formattedAddress') or a.get('line1',''),'lat':g['latitude'],'lon':g['longitude'],'precision':'store','sourceUrl':url})
   rows.extend(selected)
  except Exception:
   errors.append(chain);rows.extend(r for r in old['stores'] if r['chain']==chain and r['precision']=='store')
 ref=json.loads((folder/'matmoms-reference.json').read_text(encoding='utf8'))
 for s in ref.get('stores',[]):
  chain=s['chain'].lower()
  if any(r['chain']==chain and r['name']==s['store'] for r in rows):continue
  place=places.get(s['zip_code'])
  if not place:continue
  rows.append({'chain':chain,'id':s['id'],'name':s['store'],'city':s['city'],'postalCode':s['zip_code'],'address':'Postområde '+s['zip_code']+' '+s['city'],'lat':place['lat'],'lon':place['lon'],'precision':'postal-area','sourceUrl':ref['sourceUrl']})
 output=folder/'store-directory.json';temp=output.with_suffix('.tmp')
 temp.write_text(json.dumps({'version':1,'checkedOn':datetime.now(ZoneInfo('Europe/Stockholm')).date().isoformat(),'stores':rows,'unavailableSources':errors},ensure_ascii=False),encoding='utf8');temp.chmod(0o644);temp.replace(output)
 print('Store directory:',len(rows),'entries;',len(errors),'sources using previous data.')

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--folder',type=Path,required=True);sync(parser.parse_args().folder)
