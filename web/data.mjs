import {extraRecipes} from './extra-recipes.mjs';
// Ingredient catalogue contains no built-in prices. Reviewed retailer quotes load separately.
export const stores = [
  {id:'willys',name:'Willys',letter:'W',color:'red'},
  {id:'coop',name:'Coop',letter:'C',color:'green'},
  {id:'ica',name:'ICA',letter:'I',color:'orange'},
  {id:'lidl',name:'Lidl',kind:'physical'},
  {id:'hemkop',name:'Hemköp',kind:'physical'},
  {id:'mathem',name:'Mathem',kind:'online'},
];
stores.find(s=>s.id==='ica').formats=['ICA Maxi','ICA Kvantum','ICA Supermarket','ICA Nära'];
stores.find(s=>s.id==='coop').formats=['Coop','Stora Coop'];
stores.find(s=>s.id==='willys').formats=['Willys','Willys Hemma'];
const product=(id,name,quantity,unit,allergens=[])=>({id,name,quantity,unit,allergens,prices:{}});
export const products=[
 product('oats','Havregryn',1000,'g',['gluten']),
 product('oatdrink','Havredryck',1000,'ml',['gluten']),
 product('milk','Mjölk',1000,'ml',['milk']),
 product('yogurt','Naturell yoghurt',1000,'g',['milk']),
 product('rice','Ris',1000,'g'),product('pasta','Pasta',500,'g',['gluten']),
 product('lentils','Röda linser, torra',500,'g'),product('chickpeas','Kikärter, avrunnen vikt',380,'g'),
 product('beans','Bönor, avrunnen vikt',380,'g'),product('tomato','Krossade tomater',400,'g'),
 product('potato','Potatis',2000,'g'),product('onion','Gul lök',1000,'g'),
 product('carrot','Morötter',1000,'g'),product('broccoli','Fryst broccoli',800,'g'),
 product('spinach','Fryst spenat',500,'g'),product('banana','Bananer',6,'st'),
 product('apple','Äpplen',6,'st'),product('bread','Bröd',500,'g',['gluten']),
 product('eggs','Ägg',12,'st',['egg']),product('peanut','Jordnötssmör',350,'g',['nuts']),
 product('tofu','Tofu',400,'g',['soy']),product('chicken','Kyckling',1000,'g'),
 product('mince','Nötfärs',500,'g'),product('tortilla','Tortillabröd',320,'g',['gluten']),
 product('oil','Rapsolja',1000,'ml'),product('salt','Salt',500,'g'),product('curry','Curry',40,'g'),
 product('cheese','Ost',500,'g',['milk']),product('couscous','Couscous',500,'g',['gluten']),
 product('peas','Frysta gröna ärter',1000,'g'),product('mushroom','Champinjoner',250,'g'),
 product('corn','Majs, avrunnen vikt',285,'g'),product('garlic','Vitlök',100,'g'),
 product('lemon','Citron',2,'st'),product('cucumber','Gurka',300,'g'),
 product('salmon','Laxfilé',500,'g',['fish']),
];
// Missing prices stay absent. No generated chain markups or member prices.
export const productMap=Object.fromEntries(products.map(p=>[p.id,p]));
export const avoidOptions=products.map(p=>p.id);
const r=(id,name,meal,diet,minutes,easy,icon,ingredients,steps)=>({id,name,meal,diet,minutes,easy,icon,servings:2,ingredients:ingredients.map(([id,amount])=>({id,amount})),steps});
export const recipes=[
 r('banana-oats','Krämig banangröt','breakfast','vegan',10,true,'oats',[['oats',120],['oatdrink',400],['banana',2],['salt',1]],['Koka havregryn med havredryck och salt på låg värme i cirka 5 minuter. Rör om då och då.','Mosa hälften av bananen i gröten. Skiva resten och lägg ovanpå.']),
 r('apple-yogurt','Yoghurt med äpple & havre','breakfast','vegetarian',5,true,'apple',[['yogurt',400],['apple',2],['oats',60]],['Skär äpplena i små bitar.','Fördela yoghurten i skålar och toppa med äpple och havregryn.']),
 r('egg-toast','Äggmacka till en lugn morgon','breakfast','vegetarian',12,true,'toast',[['eggs',4],['bread',160],['salt',1]],['Lägg äggen i en kastrull och täck med vatten. Koka upp och sjud 8–10 minuter.','Kyl, skala och skiva äggen. Rosta brödet och lägg äggen ovanpå. Salta lätt.']),
 r('peanut-toast','Banan- & jordnötstoast','breakfast','vegan',5,true,'toast',[['bread',160],['banana',2],['peanut',50]],['Rosta brödet om du vill.','Bred på jordnötssmör och toppa med skivad banan.']),
 r('rice-porridge','Äppelgröt på ris','breakfast','vegan',25,true,'apple',[['rice',120],['oatdrink',500],['apple',2],['salt',1]],['Sjud riset med havredryck, en liten nypa salt och 200 ml vatten i cirka 20 minuter. Rör ofta och späd med vatten vid behov.','Riv äpplet och rör ner strax före servering.']),
 r('lentil-soup','Värmande lins- & morotssoppa','lunch','vegan',25,true,'soup',[['lentils',160],['carrot',200],['onion',100],['tomato',400],['oil',10],['salt',3]],['Hacka lök och morötter. Fräs i olja i en kastrull i 3 minuter.','Tillsätt sköljda linser, tomater och 600 ml vatten. Sjud cirka 18 minuter tills linserna är mjuka.','Smaka av med salt. Mixa delvis om du vill ha soppan krämigare.']),
 r('bean-pasta','Snabb pasta med bönor','lunch','vegan',20,true,'pasta',[['pasta',180],['beans',300],['tomato',400],['onion',80],['oil',10],['salt',3]],['Koka pastan enligt förpackningen.','Fräs hackad lök i olja. Tillsätt tomater och sköljda bönor, sjud 8–10 minuter.','Blanda med pastan och smaka av med salt.']),
 r('chickpea-rice','Kikärtsris med spenat','lunch','vegan',20,true,'rice',[['rice',160],['chickpeas',300],['spinach',200],['oil',10],['curry',4],['salt',3]],['Koka riset enligt förpackningen.','Värm olja och curry i en panna. Tillsätt spenat, sköljda kikärter och lite vatten.','Sjud i 8 minuter, salta och servera med riset.']),
 r('potato-eggs','Potatispanna med ägg','lunch','vegetarian',25,true,'potato',[['potato',500],['eggs',4],['onion',100],['oil',20],['salt',3]],['Skär potatisen i små tärningar och koka den i vatten i 8–10 minuter. Häll av.','Stek potatis och hackad lök i olja tills potatisen är genomstekt.','Knäck i äggen och stek tills de stelnat. Salta.']),
 r('chicken-lunch','Kycklingris med broccoli','lunch','all',25,false,'rice',[['chicken',300],['rice',160],['broccoli',300],['oil',10],['salt',3]],['Koka riset enligt förpackningen och koka broccolin i en separat kastrull.','Skär kycklingen i jämna bitar och stek i olja tills den är helt genomstekt, med en innertemperatur på 75 °C.','Salta och servera tillsammans.']),
 r('chickpea-curry','Gyllene kikärtsgryta','dinner','vegan',20,true,'curry',[['chickpeas',380],['tomato',400],['spinach',150],['rice',160],['curry',5],['oil',10],['salt',3]],['Koka riset enligt förpackningen.','Värm olja och curry i en kastrull. Rör ner tomater, sköljda kikärter och spenat.','Sjud cirka 12 minuter och smaka av med salt. Servera med riset.']),
 r('lentil-bolognese','Linsbolognese med pasta','dinner','vegan',30,true,'pasta',[['pasta',200],['lentils',140],['tomato',400],['carrot',150],['onion',100],['oil',10],['salt',3]],['Fräs hackad lök och riven morot i olja.','Tillsätt sköljda linser, tomater och 400 ml vatten. Sjud cirka 20 minuter; späd vid behov.','Koka pastan under tiden. Smaka av såsen med salt och servera.']),
 r('bean-wrap','Bönwraps med varm tomatröra','dinner','vegan',15,true,'wrap',[['tortilla',160],['beans',380],['tomato',200],['onion',80],['oil',10],['salt',2]],['Fräs hackad lök i olja. Tillsätt tomater och sköljda bönor.','Sjud i 8 minuter, mosa bönorna lätt och salta.','Värm tortillabröden enligt förpackningen och fyll dem med röran.']),
 r('tofu-bowl','Tofubowl med broccoli','dinner','vegan',25,false,'rice',[['tofu',400],['broccoli',300],['rice',160],['oil',15],['curry',4],['salt',3]],['Koka riset. Skär tofun i tärningar och torka av den.','Stek tofun i olja tills den fått färg. Tillsätt broccoli, curry och 100 ml vatten.','Låt sjuda tills broccolin är klar, salta och servera med riset.']),
 r('potato-broccoli','Potatis, broccoli & stekt ägg','dinner','vegetarian',30,true,'potato',[['potato',600],['broccoli',300],['eggs',4],['oil',15],['salt',3]],['Skala vid behov och dela potatisen. Koka i cirka 20 minuter.','Koka broccolin i 4–5 minuter. Stek äggen i olja tills de stelnat.','Fördela på tallrikar, salta och servera.']),
 r('chicken-dinner','Enkel kycklingpanna','dinner','all',30,true,'rice',[['chicken',350],['rice',180],['broccoli',300],['onion',100],['oil',15],['salt',3]],['Koka riset enligt förpackningen.','Skär kycklingen i jämna bitar och stek i olja med hackad lök tills kycklingen är helt genomstekt, med en innertemperatur på 75 °C.','Tillsätt broccoli och lite vatten. Låt sjuda tills broccolin är mjuk, salta och servera med ris.']),
 r('mince-pasta','Vardagspasta med köttfärssås','dinner','all',30,false,'pasta',[['mince',300],['pasta',200],['tomato',400],['onion',100],['carrot',150],['oil',10],['salt',3]],['Fräs hackad lök och riven morot i olja.','Tillsätt köttfärsen och stek tills den är genomstekt. Rör ner tomater och sjud i 15 minuter.','Koka pastan enligt förpackningen. Smaka av såsen med salt och servera.']),
];
recipes.push(
 // Breakfast: more cold, cooked and plant-based choices.
 r('overnight-apple','Äppelhavre på burk','breakfast','vegan',10,true,'oats',[['oats',120],['oatdrink',300],['apple',2]],['Rör ihop havregryn och havredryck och fördela i två burkar.','Riv äpplet och blanda ner. Låt stå i cirka 5 minuter så att grynen mjuknar. För längre förberedelse kan burkarna förvaras övertäckta i kylskåp över natten.']),
 r('banana-pancakes','Små banan- och havrepannkakor','breakfast','vegan',20,false,'oats',[['oats',120],['banana',2],['oatdrink',150],['oil',10],['salt',1]],['Mixa havregrynen till mjöl. Mosa banan och blanda med havremjöl, havredryck och salt.','Låt smeten stå i 5 minuter. Stek små pannkakor i olja på medelvärme tills de är fasta och gyllene på båda sidor.']),
 r('cheese-cucumber-toast','Ostmacka med krispig gurka','breakfast','vegetarian',5,true,'toast',[['bread',160],['cheese',60],['cucumber',120]],['Skiva gurkan tunt och skär osten i skivor.','Lägg ost och gurka på brödet. Rosta brödet först om du vill.']),
 r('apple-peanut-bowl','Äpple, yoghurt och jordnötskräm','breakfast','vegetarian',5,true,'apple',[['yogurt',400],['apple',2],['peanut',40]],['Tärna äpplena och fördela yoghurten i skålar.','Rör jordnötssmöret mjukt med en sked yoghurt och ringla över. Toppa med äpple.']),
 r('scrambled-spinach','Äggröra med spenat på toast','breakfast','vegetarian',15,true,'toast',[['eggs',4],['spinach',100],['bread',160],['oil',10],['salt',2]],['Tina och värm spenaten i en panna med olja.','Vispa äggen lätt med salt, häll i pannan och rör på låg värme tills de stelnat. Servera på rostat bröd.']),
 r('banana-yogurt','Yoghurtskål med banan','breakfast','vegetarian',5,true,'oats',[['yogurt',400],['banana',2],['oats',80]],['Fördela yoghurt och havregryn i skålar.','Skiva banan och lägg ovanpå. Låt gärna grynen mjukna några minuter.']),
 r('chickpea-toast','Kikärtsmacka med citron','breakfast','vegan',10,true,'toast',[['chickpeas',250],['bread',160],['lemon',0.5],['oil',10],['salt',2]],['Skölj kikärterna och mosa dem med olja, citronsaft och salt.','Bred röran på brödet. Spara citronresten i kylskåp.']),
 r('potato-breakfast','Frukostpotatis med ägg','breakfast','vegetarian',25,true,'potato',[['potato',400],['eggs',2],['oil',15],['salt',2]],['Tärna potatisen smått och koka den i 8–10 minuter. Häll av vattnet.','Stek potatisen i olja tills den är helt mjuk. Stek äggen tills de stelnat och servera med lite salt.']),
 r('apple-oat-pancake','Äppelplättar med yoghurt','breakfast','vegetarian',20,false,'apple',[['oats',120],['eggs',2],['milk',150],['apple',1],['yogurt',150],['oil',10]],['Mixa havregryn, ägg och mjölk till en smet. Riv äpplet och vänd ner det.','Stek små plättar i lite olja på medelvärme tills de stelnat på båda sidor. Servera med yoghurt.']),
 r('warm-apple-oats','Varm äppelgröt med jordnötssmör','breakfast','vegan',12,true,'oats',[['oats',120],['oatdrink',400],['apple',2],['peanut',30],['salt',1]],['Skär äpplena i små bitar. Koka med havregryn, havredryck och salt i cirka 7 minuter under omrörning.','Rör ner jordnötssmöret och servera varmt.']),
 // Lunch: salads, soups, skillets and practical lunchboxes.
 r('couscous-chickpea','Couscoussallad med kikärter','lunch','vegan',15,true,'rice',[['couscous',160],['chickpeas',300],['cucumber',200],['lemon',0.5],['oil',15],['salt',2]],['Tillaga couscous enligt förpackningen och fluffa med en gaffel.','Blanda med sköljda kikärter och tärnad gurka. Smaka av med citron, olja och salt.']),
 r('green-pea-soup','Grön ärtsoppa med bröd','lunch','vegan',15,true,'soup',[['peas',500],['oatdrink',200],['bread',140],['oil',10],['salt',3]],['Koka ärterna i 400 ml vatten i cirka 7 minuter.','Tillsätt havredryck, olja och salt. Mixa slätt och värm igen. Servera med brödet.']),
 r('mushroom-omelette','Svampomelett med bröd','lunch','vegetarian',20,true,'potato',[['mushroom',250],['eggs',4],['bread',140],['oil',15],['salt',2]],['Skiva svampen och stek den i olja tills vätskan kokat bort.','Vispa äggen med salt och häll över svampen. Tillaga på låg värme tills äggen stelnat, gärna under lock. Servera med bröd.']),
 r('bean-corn-salad','Matig bön- och majssallad','lunch','vegan',10,true,'rice',[['beans',380],['corn',200],['cucumber',200],['bread',140],['lemon',0.5],['oil',15],['salt',2]],['Skölj bönorna och låt majsen rinna av. Skär gurkan i tärningar.','Blanda med citron, olja och salt. Servera med bröd.']),
 r('pea-pasta','Pasta med grön ärtkräm','lunch','vegan',20,true,'pasta',[['pasta',180],['peas',300],['garlic',5],['oil',15],['lemon',0.5],['salt',3]],['Koka pastan enligt förpackningen och ärterna i en separat kastrull.','Mixa ärter med vitlök, olja, citron, salt och lite pastavatten. Vänd ihop med pastan.']),
 r('tofu-scramble-wrap','Tofuröra i wrap','lunch','vegan',15,true,'wrap',[['tofu',300],['tortilla',160],['spinach',150],['curry',3],['oil',10],['salt',2]],['Smula tofun och stek i olja med curry i några minuter.','Tillsätt spenat och lite vatten. Värm tills spenaten är klar, salta och fyll värmda tortillabröd.']),
 r('cheese-bean-toast','Varm bön- och osttoast','lunch','vegetarian',15,true,'toast',[['bread',200],['beans',250],['cheese',80],['tomato',150],['salt',2]],['Mosa sköljda bönor med tomater och salt. Bred röran på hälften av brödskivorna.','Lägg på ost och resterande bröd. Värm i en smörgåsgrill eller torr panna på låg värme tills osten smält och fyllningen är varm.']),
 r('carrot-couscous','Morotscouscous med linser','lunch','vegan',25,true,'rice',[['couscous',160],['lentils',120],['carrot',250],['oil',15],['curry',3],['salt',3]],['Koka sköljda linser i vatten enligt förpackningen. Tillaga couscousen separat.','Riv morötterna och fräs med olja och curry. Blanda ner avrunna linser och couscous och salta.']),
 r('salmon-rice-lunch','Laxlåda med ris och ärter','lunch','all',30,true,'rice',[['salmon',300],['rice',160],['peas',250],['lemon',0.5],['oil',10],['salt',3]],['Koka riset och ärterna enligt förpackningarna.','Stek laxen i olja på medelvärme tills den är genomlagad. Smaka av med citron och salt och servera med ris och ärter.']),
 r('potato-lentil-soup','Potatis- och linssoppa','lunch','vegan',30,true,'soup',[['potato',400],['lentils',120],['carrot',150],['garlic',5],['oil',10],['salt',3]],['Tärna potatis och morot smått. Fräs hackad vitlök försiktigt i olja i en kastrull.','Tillsätt potatis, morot, sköljda linser och 700 ml vatten. Sjud tills allt är mjukt, cirka 20 minuter. Salta.']),
 // Dinner: more choices for short-time, vegetarian and mixed-diet plans.
 r('tomato-couscous','Tomatcouscous med bönor','dinner','vegan',15,true,'rice',[['couscous',180],['beans',380],['tomato',400],['garlic',5],['oil',10],['salt',3]],['Värm olja och finhackad vitlök i en kastrull. Tillsätt tomater och sköljda bönor och sjud 8 minuter.','Tillaga couscousen enligt förpackningen och servera med bönsåsen. Smaka av med salt.']),
 r('mushroom-pasta','Krämig svamp- och spenatpasta','dinner','vegan',25,true,'pasta',[['pasta',200],['mushroom',250],['spinach',150],['oatdrink',200],['oil',15],['salt',3]],['Koka pastan enligt förpackningen. Skiva svampen och stek i olja tills vätskan kokat bort.','Tillsätt spenat och havredryck och sjud 8 minuter. Blanda med pastan och smaka av med salt.']),
 r('broccoli-cheese-pasta','Broccolipasta med ost','dinner','vegetarian',20,true,'pasta',[['pasta',200],['broccoli',350],['cheese',80],['milk',150],['salt',3]],['Koka pastan och lägg i broccolin de sista minuterna. Spara lite kokvatten och häll av resten.','Rör ner riven ost och mjölk på låg värme. Späd med lite kokvatten tills det blir krämigt och salta.']),
 r('lemon-lentil-rice','Citronlinser med ris','dinner','vegan',25,true,'rice',[['lentils',160],['rice',160],['carrot',200],['lemon',0.5],['oil',15],['salt',3]],['Koka riset. Koka linser och små morotstärningar i en separat kastrull enligt linsernas förpackning.','Låt linserna rinna av och smaka av med citron, olja och salt. Servera med riset.']),
 r('chickpea-potato-pan','Potatispanna med kikärter','dinner','vegan',30,true,'potato',[['potato',600],['chickpeas',300],['spinach',200],['garlic',5],['oil',20],['salt',3]],['Tärna potatisen och koka 10 minuter. Häll av vattnet.','Stek potatisen i olja tills den är genomstekt. Tillsätt hackad vitlök, sköljda kikärter och spenat och värm tills spenaten är klar. Salta.']),
 r('lentil-burgers','Linsbiffar med potatis','dinner','vegan',40,false,'potato',[['lentils',160],['oats',60],['potato',600],['carrot',150],['oil',25],['salt',3]],['Koka linserna mjuka och låt dem rinna av ordentligt. Koka potatisen separat.','Mosa linserna och blanda med havregryn, riven morot och salt. Låt smeten vila 5 minuter.','Forma små biffar och stek i olja tills de håller ihop och fått färg. Servera med potatisen.']),
 r('corn-quesadilla','Quesadillas med majs och bönor','dinner','vegetarian',20,true,'wrap',[['tortilla',240],['beans',250],['corn',150],['cheese',100],['salt',2]],['Mosa sköljda bönor lätt och blanda med majs och lite salt.','Fördela bönröra och riven ost på hälften av tortillabröden. Lägg på resten och stek i torr panna på medel-låg värme tills fyllningen är varm och osten har smält.']),
 r('salmon-potato','Citronlax med potatis','dinner','all',35,true,'potato',[['salmon',350],['potato',600],['broccoli',250],['lemon',0.5],['oil',15],['salt',3]],['Koka potatisen och koka broccolin separat de sista minuterna.','Stek laxen i olja tills den är genomlagad. Smaka av med citron och salt och servera tillsammans.']),
 r('chicken-couscous','Kyckling med citroncouscous','dinner','all',30,true,'rice',[['chicken',350],['couscous',180],['peas',250],['lemon',0.5],['oil',15],['salt',3]],['Tillaga couscous enligt förpackningen. Koka ärterna.','Skär kycklingen i jämna bitar och stek i olja tills den är helt genomstekt, med en innertemperatur på 75 °C.','Blanda couscous och ärter med citron och salt och servera med kycklingen.']),
 r('tofu-tomato-curry','Tofugryta med tomat och ris','dinner','vegan',25,true,'curry',[['tofu',400],['tomato',400],['rice',180],['curry',4],['oil',15],['salt',3]],['Koka riset enligt förpackningen.','Tärna tofun och stek den i olja med curry. Tillsätt tomater och sjud 12 minuter. Salta och servera med riset.']),
 r('white-bean-mash','Bönmos med citron och varm spenat','dinner','vegan',15,true,'potato',[['beans',500],['spinach',250],['bread',180],['lemon',0.5],['oil',20],['salt',3]],['Skölj och värm bönorna med lite vatten. Mosa med hälften av oljan, citron och salt.','Värm spenaten i resten av oljan tills den är klar och servera med bönmos och bröd.']),
 r('vegetable-fried-rice','Stekt ris med ägg och ärter','dinner','vegetarian',25,false,'rice',[['rice',180],['eggs',3],['peas',200],['carrot',150],['oil',20],['salt',3]],['Koka riset enligt förpackningen och låt det ånga av. Riv moroten.','Stek morot och ärter i olja. Skjut åt sidan, knäck i äggen och rör tills de stelnat.','Blanda ner det nykokta riset och stek tills allt är ordentligt varmt. Smaka av med salt.']),
 r('mince-bean-pot','Köttfärs- och böngryta','dinner','all',30,true,'curry',[['mince',250],['beans',300],['tomato',400],['rice',160],['corn',100],['oil',10],['salt',3]],['Koka riset. Bryn köttfärsen i olja tills den är genomstekt.','Tillsätt tomater, sköljda bönor och majs. Sjud 15 minuter, salta och servera med riset.']),
);
recipes.push(...extraRecipes);
for(const recipe of recipes){
 recipe.cuisine??=recipe.ingredients.some(i=>i.id==='tortilla'||i.id==='corn')?'texmex':recipe.ingredients.some(i=>i.id==='curry'||i.id==='tofu')?'asian':recipe.ingredients.some(i=>i.id==='pasta'||i.id==='couscous')?'mediterranean':'nordic';
}
export const cuisineOptions=[['nordic','Husmanskost'],['mediterranean','Medelhav'],['asian','Asiatiskt inspirerat'],['texmex','Texmex']];
export const recipeMap=Object.fromEntries(recipes.map(r=>[r.id,r]));
export const mealNames={breakfast:'Frukost',lunch:'Lunch',dinner:'Middag'};
