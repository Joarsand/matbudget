"""Import Matmoms' CC BY 4.0 monthly observations without changing their dates."""
import argparse,csv,io,json,zipfile,urllib.request,hashlib
from collections import Counter
from pathlib import Path
from decimal import Decimal,InvalidOperation,ROUND_HALF_UP
from datetime import date,datetime,timezone

API='https://api.github.com/repos/Lingabton/matmoms-tracker/releases/latest'
SOURCE='https://github.com/Lingabton/matmoms-tracker'
IMPORT_VERSION=3
SELECTED={'ica':'ICA Maxi Lindhagen','coop':'Coop Online Stockholm 1','willys':'Willys Stockholm Sköndal'}
RULES_FILE=Path(__file__).with_name('matmoms-reviewed.json')
def rules():return json.loads(RULES_FILE.read_text(encoding='utf8'))
def mapping_hash():return hashlib.sha256(RULES_FILE.read_bytes()).hexdigest()


def download(url):
 request=urllib.request.Request(url,headers={'User-Agent':'Matbudget-Matmoms-import/0.2'})
 with urllib.request.urlopen(request,timeout=30) as response:
  data=response.read(12*1024*1024+1)
 if len(data)>12*1024*1024:raise ValueError('Import exceeds size limit.')
 return data

def read_csv(archive,name):
 if archive.getinfo(name).file_size>128*1024*1024:raise ValueError('CSV exceeds size limit.')
 return csv.DictReader(io.StringIO(archive.read(name).decode('utf-8-sig')))

def normalized_product(p):
 factors={'g':(1,'g'),'kg':(1000,'g'),'ml':(1,'ml'),'l':(1000,'ml'),'st':(1,'st')}
 factor,unit=factors[p['unit_type'].lower()]
 quantity=float(Decimal(p['unit_quantity'])*factor)
 if not 0<quantity<100000:raise ValueError('Invalid pack size.')
 return quantity,unit

def parse_archive(data,release):
 archive=zipfile.ZipFile(io.BytesIO(data))
 if 'CC BY 4.0' not in archive.read('LICENSE-DATA.md').decode('utf8'):raise ValueError('Expected open data license missing.')
 names=[n for n in archive.namelist() if n.startswith('matmoms_prices_') and n.endswith('.csv')]
 if len(names)!=1:raise ValueError('Expected one dated monthly price file.')
 products={p['product']:p for p in read_csv(archive,'matmoms_products.csv')}
 store_meta={(s['chain'].lower(),s['store']):s for s in read_csv(archive,'matmoms_stores.csv')}
 latest={};counts=Counter();review=rules()
 for row in read_csv(archive,names[0]):
  chain=row['chain'].lower()
  counts['totalRows']+=1
  if chain not in SELECTED:counts['unsupportedChain']+=1;continue
  if row['is_available']!='1':counts['unavailableRows']+=1;continue
  if row['is_campaign']!='0' or row['member_price']:counts['conditionalRows']+=1;continue
  try:
   observed=date.fromisoformat(row['date'])
   if observed>date.today():raise ValueError('futureDate')
   product=products[row['product']];quantity,unit=normalized_product(product)
   if row.get('ean') and product.get('ean') and row['ean']!=product['ean']:raise ValueError('identityMismatch')
   price=Decimal(row['price']);unit_price=Decimal(row['unit_price'])
   if not price.is_finite() or not unit_price.is_finite() or price<=0 or unit_price<=0:raise ValueError('invalidPrice')
   # Reject apparent wrong-package matches rather than silently trusting a name.
   implied=unit_price*Decimal(str(quantity))/(1000 if unit in ['g','ml'] else 1)
   if abs(price-implied)>max(Decimal('.10'),price*Decimal('.02')):raise ValueError('packUnitMismatch')
   store=store_meta[(chain,row['store'])]
   key=(chain,store['id'],product['id']);previous=latest.get(key)
   if previous and previous['observedOn']>row['date']:counts['olderRows']+=1;continue
   store=store_meta[(chain,row['store'])]
   latest[key]={'chain':chain,'storeId':store['id'],'storeName':row['store'],'city':row['city'],'postalCode':store['zip_code'],'sku':product['id'],'ean':row['ean'],
    'name':row['product'],'brand':product['brand'],'quantity':quantity,'unit':unit,
    'package':product['unit_quantity']+' '+product['unit_type'],'priceOre':int((price*100).quantize(Decimal('1'),rounding=ROUND_HALF_UP)),
    'observedOn':row['date'],'channel':'online','priceType':'regular','priceBasis':'matmoms','provider':'Matmoms',
    'sourceUrl':release['sourceUrl'],'providerVerified':release.get('verification',{}).get(chain)}
   counts['acceptedRows']+=1
  except (ValueError,KeyError,InvalidOperation,OverflowError) as error:
   reason=str(error) if str(error) in ['futureDate','invalidPrice','packUnitMismatch','identityMismatch'] else 'malformedRow'
   counts[reason]+=1
 all_catalogue=sorted(latest.values(),key=lambda r:(r['chain'],r['storeId'],r['name']))
 if not all_catalogue:raise ValueError('No valid observations; previous price book must be retained.')
 all_references=[];coverage=[]
 for store in store_meta.values():
  chain=store['chain'].lower();candidates={r['sku']:r for r in all_catalogue if r['storeId']==store['id']}
  if chain not in review['chains']:continue
  missing=[];matched=[]
  for ingredient,unit in review['units'].items():
   approved=review['chains'][chain].get(ingredient,[]);choices=[]
   for rank,sku in enumerate(approved):
    record=candidates.get(sku);expected=review['reviewedProducts'].get(sku)
    if not record or not expected:continue
    expected_quantity,expected_unit=normalized_product({'unit_quantity':expected['quantity'],'unit_type':expected['unit']})
    if record['name']!=expected['name'] or record['unit']!=unit or expected_unit!=unit or record['quantity']!=expected_quantity:continue
    choices.append((rank,record))
   if choices:
    # Most recent genuine observation, then reviewed preference order. Never copy another store's price.
    choices.sort(key=lambda choice:(-date.fromisoformat(choice[1]['observedOn']).toordinal(),choice[0]))
    record=choices[0][1];all_references.append({**record,'ingredient':ingredient,'mappingMethod':'reviewed-product-id','availableAlternatives':len(choices)})
    matched.append(ingredient)
   else:missing.append({'ingredient':ingredient,'reason':'no-reviewed-product' if not approved else 'no-valid-observation-for-reviewed-products'})
  coverage.append({'chain':chain,'storeId':store['id'],'storeName':store['store'],'matched':matched,'missing':missing})
 references=[r for r in all_references if r['storeName']==SELECTED[r['chain']]]
 catalogue=[r for r in all_catalogue if r['storeName']==SELECTED[r['chain']]]
 dates=sorted({r['observedOn'] for r in catalogue})
 return {'version':1,'importVersion':IMPORT_VERSION,'mappingHash':mapping_hash(),'provider':'Matmoms','attribution':'Källa: Matmoms (matmoms.se) av Gabriel Linton',
  'license':'CC BY 4.0','licenseUrl':'https://creativecommons.org/licenses/by/4.0/','providerUrl':'https://matmoms.se/',
  'release':release['tag'],'sourceUrl':release['sourceUrl'],'importedAt':datetime.now(timezone.utc).isoformat(),
  'observedFrom':dates[0] if dates else None,'observedThrough':dates[-1] if dates else None,
  'references':references,'catalogue':catalogue,'allReferences':all_references,'allCatalogue':all_catalogue,'stores':list(store_meta.values()),'rejectedRows':sum(counts[r] for r in ['futureDate','invalidPrice','packUnitMismatch','identityMismatch','malformedRow']),'importReport':{'counts':dict(counts),'coverage':coverage,'validProducts':len(all_catalogue),'mappedIngredients':len(all_references)},
  'notice':'Historiska prisobservationer, inte dagens butikspriser. Varunamn och butiksuppgifter kommer från Matmoms och är inte oberoende verifierade här.'+(' Matmoms har markerat data för vissa kedjor som under verifiering.' if any(r['providerVerified'] is False for r in catalogue) else '')}

def sync(output):
 release=json.loads(download(API));tag=release['tag_name']
 try:
  old=json.loads(output.read_text(encoding='utf8'))
  if old.get('release')==tag and old.get('importVersion')==IMPORT_VERSION and old.get('mappingHash')==mapping_hash() and old.get('allCatalogue') and old.get('importReport'):print('Matmoms release unchanged:',tag,flush=True);return
 except (OSError,ValueError):pass
 asset=next(a for a in release['assets'] if a['name'].startswith('matmoms-snapshot-') and a['name'].endswith('.zip'))
 url=asset['browser_download_url']
 if not url.startswith(SOURCE+'/releases/download/'):raise ValueError('Unexpected download source.')
 try:
  summary=json.loads(download('https://matmoms.se/data/latest.json'))
  verification={r['chain']:r['verified'] for r in summary.get('byChain',[]) if isinstance(r.get('verified'),bool)}
 except Exception:verification={}
 data=parse_archive(download(url),{'tag':tag,'sourceUrl':url,'verification':verification})
 output.parent.mkdir(parents=True,exist_ok=True);temp=output.with_suffix('.tmp')
 temp.write_text(json.dumps(data,ensure_ascii=False),encoding='utf8');temp.chmod(0o644);temp.replace(output)
 print('Matmoms imported:',len(data['catalogue']),'dated observations,',len(data['references']),'reviewed recipe mappings;',data['observedThrough'],flush=True)

if __name__=='__main__':
 parser=argparse.ArgumentParser();parser.add_argument('--output',type=Path,default=Path(__file__).resolve().parents[1]/'var/matmoms-reference.json');args=parser.parse_args();sync(args.output)
