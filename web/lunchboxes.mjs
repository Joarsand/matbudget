// Links refer only to the immediately preceding dinner. No cross-week inventory.
export function withLunchboxes(slots,settings){
 const dinners=new Map(slots.filter(s=>s.meal==='dinner').map(s=>[s.day,s]));
 return slots.map(original=>{
  const {leftoverFrom,...slot}=original;
  if(settings.lunchboxes&&slot.meal==='lunch'&&slot.day>0&&((slot.day-1)%7)<(settings.lunchboxCount??7)){
   const dinner=dinners.get(slot.day-1);
   if(dinner)return {...slot,recipe:dinner.recipe,leftoverFrom:slot.day-1};
  }
  return slot;
 });
}
export function slotPortions(slot,slots,settings){
 const extra=slot.meal==='dinner'&&slots.some(s=>s.meal==='lunch'&&s.leftoverFrom===slot.day);
 return settings.people*(extra?2:1);
}
