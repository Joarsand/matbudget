"""Refresh one explicitly reviewed Willys mapping without rechecking unrelated prices."""
import argparse,json,urllib.parse
from pathlib import Path
from datetime import datetime,timezone
from store_session import StoreSession
from reviewed_search import quote_for
from catalogue import axfood_product

def refresh(ingredient,output):
 rules=json.loads(Path(__file__).with_name('complete-willys-reviewed.json').read_text(encoding='utf8'))
 if ingredient not in rules:raise ValueError('Unknown reviewed ingredient')
 rule={**rules[ingredient],'ingredient':ingredient};session=StoreSession('www.willys.se','2295')
 url='https://www.willys.se/search?'+urllib.parse.urlencode({'q':rule['query'],'size':100,'page':0})
 data=session(url);product=next((p for p in data.get('results') or [] if p.get('code')==rule['sku']),None)
 now=datetime.now(timezone.utc).isoformat();quote=quote_for(product,rule,'2295','Willys Stockholm Sköndal',url,now) if product else None
 if not quote:raise ValueError('Reviewed product is not currently verified and available; no prices changed')
 snapshot=json.loads(output.read_text(encoding='utf8'))
 if snapshot.get('version')!=1 or not isinstance(snapshot.get('records'),list):raise ValueError('Invalid price snapshot')
 snapshot['records']=[r for r in snapshot['records'] if not(r['chain']=='willys' and r['storeId']=='2295' and r['ingredient']==ingredient)]+[quote]
 row=axfood_product(product,'willys','2295','Willys Stockholm Sköndal',url,now)
 snapshot['catalogue']=[r for r in snapshot.get('catalogue',[]) if not(r['chain']=='willys' and r['storeId']=='2295' and r['sku']==quote['sku'])]+[row]
 state=snapshot.get('sources',{}).get('willys',{});state['count']=sum(r['chain']=='willys' and r['storeId']=='2295' for r in snapshot['records']);state['missingIngredients']=[i for i in state.get('missingIngredients',[]) if i!=ingredient]
 snapshot['generatedAt']=now;temp=output.with_suffix('.reviewed.tmp');temp.write_text(json.dumps(snapshot,ensure_ascii=False),encoding='utf8');temp.replace(output)
 print('VERIFIED',ingredient,quote['sku'],quote['package'],quote['priceOre'],'öre; store',quote['storeId'])
if __name__=='__main__':
 p=argparse.ArgumentParser();p.add_argument('--ingredient',required=True);p.add_argument('--output',type=Path,required=True);a=p.parse_args();refresh(a.ingredient,a.output)
