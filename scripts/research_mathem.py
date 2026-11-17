"""Read public search results for manual SKU review; never auto-publish matches."""
import json,re,time,urllib.request,urllib.parse
from pathlib import Path
def attributes(html):
 chunks=[]
 for m in re.finditer(r'self\.__next_f\.push\(',html):
  try:
   values,_=json.JSONDecoder().raw_decode(html[m.end():]);chunks.extend(v for v in values if isinstance(v,str))
  except ValueError:pass
 merged='\n'.join(chunks);found={}
 for m in re.finditer('"attributes":',merged):
  try:
   p,_=json.JSONDecoder().raw_decode(merged[m.end():])
   if isinstance(p,dict) and 'grossPrice' in p and 'frontUrl' in p:found[str(p['id'])]=p
  except ValueError:pass
 return list(found.values())
if __name__=='__main__':
 queries={'oats':'havregryn','oatdrink':'havredryck','milk':'standardmjölk','yogurt':'naturell yoghurt','rice':'basmatiris','pasta':'fusilli pasta','lentils':'röda linser torra','chickpeas':'kikärter','beans':'vita bönor','tomato':'krossade tomater','potato':'potatis fast 1kg','onion':'gul lök 1kg','carrot':'morötter 1kg','broccoli':'broccoli fryst','spinach':'spenat fryst','bread':'rostbröd','eggs':'ägg','peanut':'jordnötssmör','tofu':'tofu naturell','chicken':'kycklingfilé fryst','mince':'nötfärs','tortilla':'tortillabröd','oil':'rapsolja','salt':'salt jod','curry':'curry','cheese':'hushållsost','couscous':'couscous','peas':'gröna ärter frysta','mushroom':'champinjoner','corn':'majs avrunnen','garlic':'vitlök','lemon':'citron','cucumber':'gurka'}
 out={}
 for ingredient,query in queries.items():
  try:
   url='https://www.mathem.se/se/search/products/?q='+urllib.parse.quote(query)
   html=urllib.request.urlopen(urllib.request.Request(url,headers={'User-Agent':'Matbudget-price-check/0.2'}),timeout=15).read().decode()
   values=attributes(html);out[ingredient]=values
   print(ingredient,[(p['id'],p['name'],p['nameExtra'],p['grossPrice']) for p in values[:2]],flush=True)
  except Exception as error:print(ingredient,type(error).__name__,flush=True)
  time.sleep(.8)
 Path(__file__).resolve().parents[1].joinpath('var/mathem-candidates.json').write_text(json.dumps(out,ensure_ascii=False),encoding='utf8')
