"""Bounded daily retailer refresh. Only reviewed SKU/ingredient mappings are used."""
import argparse,json,re,urllib.request,urllib.parse,urllib.error,time
from datetime import datetime,timezone,timedelta
from pathlib import Path

SOURCES={
 'willys':{'host':'www.willys.se','id':'2295','name':'Willys Stockholm Sköndal','map':{
  'eggs':('101218667_ST',10,'st'), 'chickpeas':('100841920_ST',230,'g'),'beans':('100841868_ST',230,'g'),
  'mushroom':('101086165_ST',250,'g'),'tortilla':('101250650_ST',320,'g'),
  'tomato':('101285406_ST',390,'g'),'corn':('101286330_ST',285,'g'),
  'garlic':('100764898_ST',100,'g'),'milk':('101179327_ST',1000,'ml'),
  'salmon':('101804336_ST',500,'g')}},
 'hemkop':{'host':'www.hemkop.se','id':'4190','name':'Hemköp Stockholm Torsplan','map':{
  'oats':('101436925_ST',750,'g'),'oatdrink':('101285667_ST',1000,'ml'),
  'yogurt':('101285706_ST',1500,'g'),'rice':('101488798_ST',1000,'g'),
  'pasta':('101301595_ST',500,'g'),'tomato':('101285406_ST',390,'g'),
  'potato':('101302358_ST',900,'g'),'carrot':('100930058_ST',1000,'g'),
  'eggs':('101836357_ST',15,'st'),'peanut':('101829765_ST',350,'g'),
  'tofu':('101358420_ST',200,'g'),'tortilla':('101250650_ST',320,'g'),
  'oil':('101298386_ST',1000,'ml'),'cheese':('101817373_ST',400,'g'),
  'couscous':('101547035_ST',1000,'g'),'lemon':('100255117_ST',1,'st'),'beans':('101245204_ST',230,'g')}}}

def pack_matches(text,quantity,unit,ingredient):
 text=(text or '').lower().replace(',','.').replace(' ','')
 if unit=='st':
  if ingredient=='lemon':return bool(re.fullmatch(r'ca\d+g',text))
  return text==str(quantity)+'p'
 if ingredient in ['chickpeas','corn','beans']:
  return text.endswith('/'+str(quantity)+'g')
 multi=re.fullmatch(r'(\d+)x(\d+(?:\.\d+)?)(g|kg|ml|cl|dl|l)',text)
 if multi:
  n=float(multi[1])*float(multi[2]);u=multi[3]
 else:
  m=re.fullmatch(r'(\d+(?:\.\d+)?)(g|kg|ml|cl|dl|l)',text)
  if not m:return False
  n=float(m[1]);u=m[2]
 conversion={'g':(1,'g'),'kg':(1000,'g'),'ml':(1,'ml'),'cl':(10,'ml'),'dl':(100,'ml'),'l':(1000,'ml')}
 multiplier,target=conversion[u]
 return target==unit and abs(n*multiplier-quantity)<.01

def fetch(url):
 request=urllib.request.Request(url,headers={'Accept':'application/json','User-Agent':'Matbudget-price-check/0.2'})
 with urllib.request.urlopen(request,timeout=20) as response:return json.load(response)

def mathem_match_reason(product,mapping):
 """A country-of-origin change is not a different pack. All other checks remain strict."""
 if not product:return 'product_not_found'
 if product.get('id')!=mapping['sku']:return 'product_identity_changed'
 if product.get('currency')!='SEK':return 'currency_changed'
 if mapping.get('expectedName') and product.get('name')!=mapping['expectedName']:return 'product_name_changed'
 actual=product.get('nameExtra');expected=mapping['expectedPackage']
 if actual!=expected:
  def country_pack(value):
   match=re.fullmatch(r'[A-Za-zÀ-ÖØ-öø-ÿ -]{2,50},\s*(\d+(?:[.,]\d+)?\s*(?:g|kg|ml|l))',value or '')
   return match.group(1).replace(' ','').replace(',','.') if match else None
  approved=country_pack(expected)
  if not (mapping.get('allowCountryChange') is True and mapping.get('expectedName') and approved and country_pack(actual)==approved):return 'package_changed'
 if not product.get('availability',{}).get('isAvailable',False):return 'unavailable'
 return None

def retain_recent_mathem(records,previous,now=None):
 """A partial refresh must not discard still-fresh genuine quotes. Keep original timestamps."""
 now=now or datetime.now(timezone.utc)
 keys={(r['chain'],r['storeId'],r['ingredient']) for r in records};retained=0
 for record in previous.get('records',[]):
  try:
   key=(record['chain'],record['storeId'],record['ingredient'])
   if record['chain']!='mathem' or key in keys:continue
   checked=datetime.fromisoformat(record['checkedAt'].replace('Z','+00:00'))
   if checked.tzinfo is None or not -timedelta(minutes=1)<=now-checked<=timedelta(hours=36):continue
   records.append(dict(record));keys.add(key);retained+=1
  except (ValueError,KeyError,TypeError):continue
 return retained

def sync(output):
 now=datetime.now(timezone.utc).isoformat();records=[];states={};alternatives=[];catalogue=[]
 try:previous=json.loads(output.read_text(encoding='utf8'))
 except (OSError,ValueError):previous={}
 from reviewed_search import sync_willys
 for chain,source in SOURCES.items():
  from store_session import StoreSession
  from catalogue import axfood_product
  try:session=StoreSession(source['host'],source['id'])
  except Exception as error:
   records.extend(r for r in previous.get('records',[]) if r.get('chain')==chain and r.get('storeVerified') is True)
   states[chain]={'status':'unavailable','storeName':source['name'],'count':0,'error':'Butiken kunde inte verifieras hos priskällan.'}
   print(chain,'store verification failed:',type(error).__name__,flush=True);continue
  def source_fetch(url):
   data=session(url)
   for product in data.get('results',[]):
    record=axfood_product(product,chain,source['id'],source['name'],url,now)
    if record:catalogue.append(record)
   return data
  if chain=='willys':
   items,state=sync_willys(source_fetch,now,previous);alternatives.extend(state.pop('alternatives',[]));records.extend(items);states[chain]=state;print('willys',len(items),'of',state['expectedIngredients'],'reviewed recipe ingredient prices',flush=True);continue
  url=f"https://{source['host']}/search/campaigns?storeId={source['id']}&size=500"
  try:
   data=source_fetch(url)
   if data.get('pagination',{}).get('totalNumberOfResults',0)>500:raise ValueError('Result limit reached; full source needs review.')
   indexed={p.get('code'):p for p in data.get('results',[])}
   count=0
   for ingredient,(sku,amount,unit) in source['map'].items():
    p=indexed.get(sku)
    if not p or p.get('outOfStock') or p.get('addToCartDisabled'):continue
    if p.get('priceUnit')!='kr/st' or not pack_matches(p.get('displayVolume'),amount,unit,ingredient):continue
    value=p.get('priceValue')
    if not isinstance(value,(float,int)) or isinstance(value,bool) or value<=0:continue
    # Use the published ordinary pack price. Conditional discounts are not applied.
    # This prevents a '3 for' unit price being charged for one pack.
    conditions=[{'label':x.get('textLabelGenerated') or x.get('conditionLabel') or 'Erbjudande',
      'quantity':x.get('qualifyingCount'),'validUntil':x.get('validUntil'),'limit':x.get('redeemLimitLabel')}
      for x in p.get('potentialPromotions',[]) if x.get('price')]
    records.append({'ingredient':ingredient,'chain':chain,'storeId':source['id'],'storeName':source['name'],
      'sku':sku,'name':p['name'],'brand':p.get('manufacturer') or '', 'quantity':amount,'unit':unit,
      'package':p.get('displayVolume'),'priceOre':round(value*100),'checkedAt':now,'channel':'online',
      'priceType':'regular','storeVerified':True,'conditions':conditions,'sourceUrl':url})
    count+=1
   states[chain]={'status':'connected','storeId':source['id'],'storeName':source['name'],'count':count,'checkedAt':now,'sourceUrl':url}
   print(chain,count,'reviewed ingredient prices',flush=True)
  except Exception as error:
   # Keep old observations only with their original timestamps; clients reject stale prices.
   records.extend(r for r in previous.get('records',[]) if r.get('chain')==chain and r.get('storeVerified') is True)
   states[chain]={'status':'unavailable','storeName':source['name'],'count':0,'error':'Priskällan kunde inte uppdateras.'}
   print(chain,'refresh failed:',type(error).__name__,flush=True)
 # Mathem is an online shop, not a verified local physical store. Exact reviewed
 # product IDs are required; search rank never decides a replacement product.
 from research_mathem import attributes
 mappings=json.loads((Path(__file__).parent/'mathem-reviewed.json').read_text(encoding='utf8'))
 count=0;mathem_issues={}
 for ingredient,mapping in mappings.items():
  try:
   url='https://www.mathem.se/se/search/products/?q='+urllib.parse.quote(mapping['query'])
   request=urllib.request.Request(url,headers={'User-Agent':'Matbudget-price-check/0.2'})
   with urllib.request.urlopen(request,timeout=15) as response:html=response.read().decode()
   found=attributes(html)
   for candidate in found:
    if candidate.get('currency')!='SEK' or not candidate.get('availability',{}).get('isAvailable'):continue
    discount=candidate.get('discount');value=discount.get('undiscountedGrossPrice') if discount else candidate.get('grossPrice')
    try:
     from decimal import Decimal,ROUND_HALF_UP
     amount=int((Decimal(str(value))*100).quantize(Decimal('1'),rounding=ROUND_HALF_UP))
     if amount<=0:continue
     link='https://www.mathem.se'+candidate['frontUrl'] if candidate['frontUrl'].startswith('/') else candidate['frontUrl']
     if not link.startswith('https://www.mathem.se/'):continue
     catalogue.append(dict(chain='mathem',storeId='mathem-se',storeName='Mathem online · leveransområde ej valt',sku=str(candidate['id']),name=candidate['name'],brand=candidate.get('brand') or '',package=candidate.get('nameExtra') or '',priceOre=amount,retailUnit='published-price',checkedAt=datetime.now(timezone.utc).isoformat(),sourceUrl=link,priceType='regular',scope='observed-search-results'))
    except (ValueError,TypeError,KeyError):continue
   p=next((p for p in found if p.get('id')==mapping['sku']),None)
   reason=mathem_match_reason(p,mapping)
   if reason:mathem_issues[ingredient]=reason;continue
   if ingredient=='chickpeas' or mapping.get('drainedQuantity') or mapping.get('detailPattern'):
    with urllib.request.urlopen(urllib.request.Request(mapping['sourceUrl'],headers={'User-Agent':'Matbudget-price-check/0.3'}),timeout=15) as response:detail=response.read().decode()
    plain=re.sub('<[^>]*>',' ',detail)
    drained=mapping.get('drainedQuantity',230 if ingredient=='chickpeas' else None)
    if drained and not re.search(r'Avrunnen vikt\s+'+str(drained)+r'\s+gram',plain,re.I):mathem_issues[ingredient]='drained_weight_unverified';continue
    if mapping.get('detailPattern') and mapping['detailPattern'].casefold() not in plain.casefold():mathem_issues[ingredient]='detail_unverified';continue
   discount=p.get('discount')
   # The site explicitly publishes the undiscounted price even during a bundle
   # campaign. Do not mistake a conditional bundle's unit price for a pack price.
   ordinary=discount.get('undiscountedGrossPrice') if discount else p.get('grossPrice')
   if ordinary is None:mathem_issues[ingredient]='ordinary_price_missing';continue
   price=float(ordinary)
   if not 0<price<float('inf'):mathem_issues[ingredient]='invalid_price';continue
   checked=datetime.now(timezone.utc).isoformat()
   records.append({'ingredient':ingredient,'chain':'mathem','storeId':'mathem-se','storeName':'Mathem online · leveransområde ej valt',
    'sku':str(mapping['sku']),'name':p['name'],'brand':p.get('brand') or '', 'quantity':mapping['quantity'],'unit':mapping['unit'],
    'package':p['nameExtra'],'priceOre':round(price*100),'checkedAt':checked,'channel':'online','priceType':'regular',
    'conditions':[{'label':discount.get('descriptionShort'),'type':discount.get('discountType')}] if discount else [],
    'sourceUrl':mapping['sourceUrl']})
   count+=1
  except urllib.error.HTTPError as error:
   mathem_issues[ingredient]='http_'+str(error.code)
   print('mathem',ingredient,'not refreshed: HTTP',error.code,flush=True)
   if error.code in [401,403,429]:break
  except Exception as error:
   mathem_issues[ingredient]='refresh_failed';print('mathem',ingredient,'not refreshed:',type(error).__name__,flush=True)
  finally:time.sleep(.8)
 retained=retain_recent_mathem(records,previous)
 present={r['ingredient'] for r in records if r['chain']=='mathem'}
 states['mathem']={'refreshedCount':count,'retainedCount':retained,'status':'connected' if count else 'cached' if retained else 'unavailable','storeId':'mathem-se','storeName':'Mathem online · leveransområde ej valt','count':count+retained,'expectedIngredients':len(mappings),'missingIngredients':sorted(set(mappings)-present),'refreshIssues':mathem_issues,'checkedAt':datetime.now(timezone.utc).isoformat()}
 print('mathem',count,'reviewed ingredient prices',flush=True)
 snapshot={'version':1,'generatedAt':datetime.now(timezone.utc).isoformat(),'records':records,'alternatives':alternatives,'catalogue':list({(r['chain'],r['storeId'],r['sku']):r for r in catalogue}.values()),'catalogueScope':'observed-search-results-not-full-assortment','sources':states}
 output.parent.mkdir(parents=True,exist_ok=True)
 temp=output.with_suffix('.tmp');temp.write_text(json.dumps(snapshot,ensure_ascii=False),encoding='utf8');temp.chmod(0o644);temp.replace(output)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'var/price-book.json');args=parser.parse_args();sync(args.output)
