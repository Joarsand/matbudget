"""Ordinary product search, not the campaign feed. Exact approved SKUs only."""
import json,math,time,urllib.parse,urllib.error
from pathlib import Path
from decimal import Decimal,ROUND_HALF_UP

def quote_for(product,rule,store_id,store_name,source_url,checked_at):
 if product.get('code')!=rule['sku'] or product.get('name')!=rule['name'] or product.get('displayVolume')!=rule['package']:return None
 if product.get('outOfStock') or product.get('addToCartDisabled') or product.get('notAllowedAnonymous'):return None
 value=product.get('priceValue')
 if isinstance(value,bool) or not isinstance(value,(float,int)) or not math.isfinite(value) or value<=0:return None
 weight=rule['retailPriceBasis']=='kg'
 if product.get('priceUnit')!=('kr/kg' if weight else 'kr/st'):return None
 quote={'ingredient':rule['ingredient'],'chain':'willys','storeId':store_id,'storeName':store_name,
  'sku':rule['sku'],'name':product['name'],'brand':product.get('manufacturer') or '',
  'quantity':rule['quantity'],'unit':rule['unit'],'priceOre':int((Decimal(str(value))*100).quantize(Decimal('1'),rounding=ROUND_HALF_UP)),
  'package':rule['package'],'checkedAt':checked_at,'channel':'online','priceType':'regular','sourceUrl':source_url,
  'storeVerified':True,'mappingMethod':'reviewed-search-product-id','conditions':[{'label':p.get('textLabelGenerated') or p.get('conditionLabel') or 'Erbjudande','quantity':p.get('qualifyingCount')} for p in product.get('potentialPromotions',[]) if p.get('price')]}
 if rule.get('mayContain'):quote['mayContain']=list(rule['mayContain']);quote['ingredientReviewSource']=rule['ingredientReviewSource']
 if weight:
  average=product.get('averageWeight')
  if isinstance(average,bool) or not isinstance(average,(float,int)) or not math.isfinite(average) or not 0<average<=2:return None
  if rule['unit']!='st' or not rule['sku'].endswith('_KG'):return None
  # Preserve the genuine kr/kg price. The engine separately estimates piece cost
  # from the retailer's own averageWeight; it is never represented as a pack price.
  quote.update(retailPriceBasis='kg',averageWeightKg=average,package='1 kg · lösvikt',estimatedWeight=True)
 return quote

def sync_willys(fetch,checked_at,previous=None,delay=.5):
 mapping=json.loads(Path(__file__).with_name('complete-willys-reviewed.json').read_text(encoding='utf8'))
 alternatives=[];approved=json.loads(Path(__file__).with_name('willys-alternatives.json').read_text(encoding='utf8'))
 records=[];missing=[];store='2295';name='Willys Stockholm Sköndal';blocked=False
 for ingredient,entry in mapping.items():
  rule={**entry,'ingredient':ingredient};found=None
  try:
   for page in range(3):
    url='https://www.willys.se/search?'+urllib.parse.urlencode({'q':entry['query'],'storeId':store,'size':100,'page':page})
    data=fetch(url)
    for alternate in approved.get(ingredient,[]):
     candidate=next((p for p in (data.get('results') or []) if p.get('code')==alternate['sku']),None)
     quote=quote_for(candidate,{**alternate,'ingredient':ingredient},store,name,url,checked_at) if candidate else None
     if quote and not any(r['sku']==quote['sku'] for r in alternatives):alternatives.append({**quote,'reviewedAlternative':True,'allergens':alternate['allergens']})
    product=next((p for p in (data.get('results') or []) if p.get('code')==entry['sku']),None)
    if product:
     found=quote_for(product,rule,store,name,url,checked_at);break
    if page+1>=data.get('pagination',{}).get('numberOfPages',1):break
    time.sleep(delay)
  except urllib.error.HTTPError as error:
   if error.code in [401,403,429]:blocked=True
  except Exception:pass
  if found:records.append(found)
  else:missing.append(ingredient)
  if blocked:break
  time.sleep(delay)
 # Temporary errors retain only observations from the exact same approved SKU,
 # quantity and price basis. The browser still enforces the original 36h expiry.
 for ingredient in mapping:
  if any(r['ingredient']==ingredient for r in records):continue
  rule=mapping[ingredient]
  old=next((r for r in (previous or {}).get('records',[]) if r.get('chain')=='willys' and r.get('storeId')==store and r.get('ingredient')==ingredient and r.get('sku')==rule['sku'] and r.get('quantity')==rule['quantity'] and r.get('unit')==rule['unit'] and r.get('retailPriceBasis','pack')==rule['retailPriceBasis']),None)
  if old and old.get('storeVerified') is True:records.append(dict(old))
 state={'status':'connected' if records else 'unavailable','storeId':store,'storeName':name,'count':len(records),'checkedAt':checked_at,
  'scope':'reviewed-recipe-ingredients','expectedIngredients':len(mapping),'refreshedIngredients':len(mapping)-len(missing) if not blocked else None,'missingIngredients':[i for i in mapping if not any(r['ingredient']==i for r in records)],
  'sourceUrl':'https://www.willys.se/','blocked':blocked,'alternatives':alternatives}
 return records,state
