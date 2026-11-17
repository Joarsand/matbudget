"""Broader observed products, separate from reviewed recipe mappings."""
from decimal import Decimal,ROUND_HALF_UP
import math

def axfood_product(p,chain,store_id,store_name,url,checked_at):
 price=p.get('priceValue')
 if p.get('outOfStock') or p.get('addToCartDisabled') or p.get('notAllowedAnonymous'):return None
 if isinstance(price,bool) or not isinstance(price,(float,int)) or not math.isfinite(price) or price<=0:return None
 if p.get('priceUnit') not in ('kr/st','kr/kg') or not p.get('code') or not p.get('name'):return None
 return dict(chain=chain,storeId=store_id,storeName=store_name,sku=p['code'],name=p['name'],brand=p.get('manufacturer') or '',package=p.get('displayVolume') or '',priceOre=int((Decimal(str(price))*100).quantize(Decimal('1'),rounding=ROUND_HALF_UP)),retailUnit=p['priceUnit'],checkedAt=checked_at,sourceUrl=url,priceType='regular',storeVerified=True,scope='observed-search-results')
