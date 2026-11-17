"""Regression checks for real importer failure modes; all fixtures are isolated."""
import unittest,io,csv,zipfile,importlib.util,json,tempfile
from pathlib import Path
from datetime import datetime,timezone,timedelta
ROOT=Path(__file__).resolve().parents[1]
def module(name,file):
 spec=importlib.util.spec_from_file_location(name,ROOT/'scripts'/file);m=importlib.util.module_from_spec(spec);spec.loader.exec_module(m);return m
m=module('matmoms','import_matmoms.py');native=module('native_prices','sync-prices.py')
SOURCE='https://github.com/Lingabton/matmoms-tracker/releases/download/data-2026-10/snapshot.zip'
release={'tag':'data-2026-10','sourceUrl':SOURCE,'verification':{'ica':True}}
PRODUCTS=[{'id':'8','product':'Oatly Havredryck Original 1L','ean':'test-original','brand':'Oatly','category_id':'dairy-milk','unit_quantity':'1','unit_type':'L'}, {'id':'9','product':'Oatly Havredryck Barista Edition 1L','ean':'test-barista','brand':'Oatly','category_id':'dairy-milk','unit_quantity':'1','unit_type':'L'}, {'id':'4','product':'Arla StandardmjÃ¶lk 3% 1L','ean':'test-milk','brand':'Arla','category_id':'dairy-milk','unit_quantity':'1','unit_type':'L'}, {'id':'245','product':'ICA Ã„gg FrigÃ¥ende Storlek M 12-pack','ean':'test-eggs','brand':'ICA','category_id':'eggs','unit_quantity':'12','unit_type':'st'}]
STORES=[{'id':'ica-maxi-lindhagen','store':'ICA Maxi Lindhagen','chain':'ICA','city':'Stockholm','zip_code':'11247'}, {'id':'ica-west','store':'ICA West','chain':'ICA','city':'GÃ¶teborg','zip_code':'41102'}]
def row(id='9',store='ICA Maxi Lindhagen',**changes):
 p=next(p for p in PRODUCTS if p['id']==id)
 return {'date':'2026-10-31','product':p['product'],'ean':p['ean'],'chain':'ICA','store':store,'city':'Stockholm','price':'25.00','unit_price':'25.00','is_campaign':'0','member_price':'','is_available':'1',**changes}
def archive(rows,products=None):
 out=io.BytesIO()
 with zipfile.ZipFile(out,'w') as z:
  z.writestr('LICENSE-DATA.md','CC BY 4.0')
  for name,data in [('matmoms_products.csv',products or PRODUCTS),('matmoms_stores.csv',STORES),('matmoms_prices_2026-10.csv',rows)]:
   text=io.StringIO();w=csv.DictWriter(text,fieldnames=list(data[0]));w.writeheader();w.writerows(data);z.writestr(name,text.getvalue())
 return out.getvalue()
class ImportTests(unittest.TestCase):
 def test_country_change_keeps_exact_identity_and_quantity(self):
  rule=json.loads((ROOT/'scripts/mathem-reviewed.json').read_text(encoding='utf8'))['mushroom']
  product={'id':6683,'name':'Champinjoner Klass1','currency':'SEK','nameExtra':'Polen, 250 g','availability':{'isAvailable':True}}
  self.assertIsNone(native.mathem_match_reason(product,rule))
  self.assertIsNone(native.mathem_match_reason({**product,'nameExtra':'Litauen, 250 g'},rule))
  for change in [{'id':10023},{'name':'Champinjoner EKO'},{'nameExtra':'Polen, 500 g'},{'nameExtra':'250 g'},{'currency':'EUR'},{'availability':{'isAvailable':False}}]:
   self.assertIsNotNone(native.mathem_match_reason({**product,**change},rule))
  self.assertEqual(native.mathem_match_reason({**product,'nameExtra':'Sverige, 250 g'},{**rule,'allowCountryChange':False}),'package_changed')
 def test_reviewed_alternative_when_primary_is_unavailable(self):
  d=m.parse_archive(archive([row('8',is_available='0'),row()]),release)
  r=next(r for r in d['references'] if r['ingredient']=='oatdrink');self.assertEqual(r['sku'],'9');self.assertEqual(r['quantity'],1000);self.assertEqual(r['unit'],'ml');self.assertEqual(r['priceOre'],2500)
 def test_other_store_never_overwrites_same_chain_product(self):
  d=m.parse_archive(archive([row(price='25',unit_price='25'),row(store='ICA West',price='29',unit_price='29')]),release)
  self.assertEqual({r['storeId']:r['priceOre'] for r in d['allReferences']},{'ica-maxi-lindhagen':2500,'ica-west':2900})
 def test_latest_date_beats_file_order(self):
  d=m.parse_archive(archive([row(date='2026-10-31',price='25',unit_price='25'),row(date='2026-10-20',price='10',unit_price='10')]),release)
  self.assertEqual(d['references'][0]['priceOre'],2500);self.assertEqual(d['references'][0]['observedOn'],'2026-10-31')
 def test_wrong_pack_and_conditional_prices_are_not_guessed(self):
  d=m.parse_archive(archive([row('4'),row('245',price='31.27',unit_price='3.13'),row(is_campaign='1')]),release)
  self.assertFalse(any(r['ingredient'] in ['eggs','oatdrink'] for r in d['references']));self.assertEqual(d['importReport']['counts']['packUnitMismatch'],1);self.assertEqual(d['importReport']['counts']['conditionalRows'],1)
 def test_renamed_or_changed_product_cannot_reuse_approved_mapping(self):
  products=[dict(p) for p in PRODUCTS];products[1]['product']='Oatly Sweet Chocolate 1L'
  chocolate=row();chocolate['product']=products[1]['product']
  d=m.parse_archive(archive([row('4'),chocolate],products),release)
  self.assertFalse(any(r['ingredient']=='oatdrink' for r in d['references']))
 def test_empty_or_corrupt_import_cannot_replace_good_data(self):
  with self.assertRaises(ValueError):m.parse_archive(archive([row(is_available='0')]),release)
 def test_retained_quotes_preserve_original_time_and_fresh_updates_win(self):
  now=datetime(2026,11,9,12,tzinfo=timezone.utc)
  old={'chain':'mathem','storeId':'online','ingredient':'milk','sku':'sku','priceOre':2000,'checkedAt':(now-timedelta(hours=2)).isoformat()}
  rows=[];self.assertEqual(native.retain_recent_mathem(rows,{'records':[old]},now),1);self.assertEqual(rows[0],old)
  fresh={**old,'priceOre':1900,'checkedAt':now.isoformat()};rows=[fresh]
  self.assertEqual(native.retain_recent_mathem(rows,{'records':[old]},now),0);self.assertEqual(rows[0]['priceOre'],1900)
 def test_stale_or_future_quotes_are_never_kept(self):
  now=datetime(2026,11,9,12,tzinfo=timezone.utc)
  for delta in [timedelta(hours=37),timedelta(hours=-1)]:
   old={'chain':'mathem','storeId':'online','ingredient':'milk','checkedAt':(now-delta).isoformat()};rows=[]
   self.assertEqual(native.retain_recent_mathem(rows,{'records':[old]},now),0)
class FullSearchTests(unittest.TestCase):
 def setUp(self):self.search=module('reviewed_search','reviewed_search.py')
 def test_exact_pack_identity_is_required(self):
  rule={'ingredient':'salt','sku':'salt_ST','name':'Salt','package':'1kg','quantity':1000,'unit':'g','retailPriceBasis':'pack'}
  product={'code':'salt_ST','name':'Salt','displayVolume':'1kg','priceValue':9.9,'priceUnit':'kr/st'}
  quote=self.search.quote_for(product,rule,'2295','Store','https://www.willys.se/search','2026-11-09T12:00:00Z')
  self.assertEqual(quote['priceOre'],990)
  for change in [{'displayVolume':'500g'},{'code':'other_ST'},{'outOfStock':True},{'priceValue':False}]:self.assertIsNone(self.search.quote_for({**product,**change},rule,'2295','Store','url','time'))
 def test_fruit_keeps_real_kiloprice_and_retailer_average_weight(self):
  rule={'ingredient':'banana','sku':'banana_KG','name':'Banan','package':'ca180g','quantity':1,'unit':'st','retailPriceBasis':'kg'}
  product={'code':'banana_KG','name':'Banan','displayVolume':'ca180g','priceValue':21.9,'priceUnit':'kr/kg','averageWeight':.18}
  quote=self.search.quote_for(product,rule,'2295','Store','url','time');self.assertEqual(quote['priceOre'],2190);self.assertEqual(quote['averageWeightKg'],.18);self.assertTrue(quote['estimatedWeight'])
  self.assertIsNone(self.search.quote_for({**product,'averageWeight':None},rule,'2295','Store','url','time'))

class AlternativeTests(unittest.TestCase):
 def test_exact_alternative_product_rules_and_packages(self):
  reviewed=module('reviewed_search','reviewed_search.py')
  data=json.loads((ROOT/'tests/fixtures/willys-alternative-products.json').read_text(encoding='utf8'))
  rules=json.loads((ROOT/'scripts/willys-alternatives.json').read_text(encoding='utf8'))
  for ingredient,entries in rules.items():
   for entry in entries:
    product=next(p for p in data[ingredient]['results'] if p['code']==entry['sku'])
    rule={**entry,'ingredient':ingredient}
    q=reviewed.quote_for(product,rule,'2295','Willys Stockholm Sköndal',data[ingredient]['sourceUrl'],'2026-11-10T10:00:00Z')
    self.assertIsNotNone(q);self.assertEqual(q['quantity'],entry['quantity'])
    self.assertIsNone(reviewed.quote_for({**product,'outOfStock':True},rule,'2295','Willys',data[ingredient]['sourceUrl'],'2026-11-10T10:00:00Z'))
    self.assertIsNone(reviewed.quote_for({**product,'displayVolume':'wrong package'},rule,'2295','Willys',data[ingredient]['sourceUrl'],'2026-11-10T10:00:00Z'))

if __name__=='__main__':unittest.main()
