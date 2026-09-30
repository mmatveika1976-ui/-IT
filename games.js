'use strict';
const $ = s => document.querySelector(s);
const modal = $('#modal'), board = $('#board'), status = $('#status');
const shuffle = values => { const a = [...values]; for(let i=a.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[a[i],a[j]]=[a[j],a[i]]} return a };
const words = [
 [['key','🔑','ключ'],['map','🗺️','карта'],['book','📖','книга'],['hat','👒','шляпа']],
 [['apple','🍎','яблоко'],['banana','🍌','банан'],['carrot','🥕','морковь'],['bread','🍞','хлеб']],
 [['sun','☀️','солнце'],['moon','🌙','луна'],['star','⭐','звезда'],['tree','🌳','дерево']]
];
const phrases = [
 [['Привет!','Hello !'],['Спасибо!','Thank you !'],['До свидания!','Goodbye !']],
 [['Воды, пожалуйста.','Water , please .'],['Мне нужен билет.','I need a ticket .'],['Где автобус?','Where is the bus ?']],
 [['Я хочу яблоко.','I want an apple .'],['Сколько это стоит?','How much is it ?'],['Вы можете мне помочь?','Can you help me ?']]
];
const animals = [['fish','🐠','рыба'],['crab','🦀','краб'],['whale','🐳','кит'],['turtle','🐢','черепаха'],['dolphin','🐬','дельфин'],['octopus','🐙','осьминог']];
const games = {
 treasure:{name:'Treasure Words',icon:'🗝️',description:'Найди картинку по английскому слову. За каждое открытие получаешь монеты.',levels:['Вещи исследователя','Вкусный привал','Природа острова']},
 world:{name:'Travel Talk',icon:'🌍',description:'Собери английскую фразу из слов. Нажми слово в ответе, чтобы вернуть его обратно.',levels:['Первые слова','В дороге','На прогулке']},
 ocean:{name:'Ocean Match',icon:'🐢',description:'Соедини английское название с картинкой животного. Сначала нажми слово, затем картинку.',levels:['3 морских друга','4 морских друга','6 морских друзей']}
};
let progress = {}, saving = true, current = '', state = null;
try { const saved=JSON.parse(localStorage.getItem('english-adventures-v1')||'{}'); if(saved && typeof saved==='object' && !Array.isArray(saved)) progress=saved } catch {saving=false}
function record(id){const v=progress[id];return v && typeof v==='object' && !Array.isArray(v)?v:{}}
function savedLevel(id,level){const v=record(id)[level];return v && Number.isFinite(v.stars) && Number.isFinite(v.score)?v:null}
function save(){try{localStorage.setItem('english-adventures-v1',JSON.stringify(progress))}catch{saving=false}}
function btn(text,action,cls='answer'){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=text;b.onclick=action;return b}
function speak(text){if(!('speechSynthesis' in window))return;window.speechSynthesis.cancel();const u=new SpeechSynthesisUtterance(text);u.lang='en-US';u.rate=.8;window.speechSynthesis.speak(u)}
function stop(){state=null;if('speechSynthesis' in window)window.speechSynthesis.cancel()}
function clean(){board.replaceChildren();board.className='';$('#question').replaceChildren();$('#actions').replaceChildren();status.textContent='';$('#meter').hidden=true}
function refreshLibrary(){Object.keys(games).forEach(id=>{const el=document.querySelector(`[data-game="${id}"] .description`);const done=[0,1,2].filter(n=>savedLevel(id,n)).length;el.textContent=done?`${done} / 3 levels complete · Play again`:({treasure:'Find the word. Collect the treasure.',world:'Build a phrase. Start a journey.',ocean:'Match the words. Meet ocean friends.'})[id]})}
function menu(id=current){stop();current=id;clean();$('#title').textContent=games[id].name;$('#hint').textContent=games[id].description;$('#question').textContent='Выбери уровень';board.className='levels';
 games[id].levels.forEach((title,i)=>{const result=savedLevel(id,i),unlocked=i===0||!!savedLevel(id,i-1);const b=btn(`${i+1}. ${title}\n${result?'★'.repeat(result.stars)+'☆'.repeat(3-result.stars)+' · '+result.score+' points':unlocked?'Начать':'🔒 Пройди предыдущий уровень'}`,()=>begin(id,i),'level');b.disabled=!unlocked;board.append(b)});
 $('#actions').append(btn('← К витрине',()=>modal.close()));if(!saving)status.textContent='Сохранение недоступно. Прогресс хранится только до закрытия страницы.';
}
function begin(id,level){stop();current=id;clean();state={id,level,score:0,mistakes:0,hints:0,done:0,total:id==='treasure'?4:id==='world'?3:[3,4,6][level],roundErrors:0,hinted:false,locked:false,review:[]};$('#title').textContent=games[id].name;$('#hint').textContent=games[id].description;$('#meter').hidden=false;
 if(id==='treasure'){state.items=shuffle(words[level]);wordRound()}else if(id==='world'){state.items=phrases[level];phraseRound()}else{state.items=shuffle(animals).slice(0,state.total);matchRound()}
 hud();
}
function hud(){if(!state)return;$('#meter').hidden=false;$('#meter-label').textContent=`Уровень ${state.level+1} · ${state.done} / ${state.total} · ${state.score} coins`;$('#progress').max=state.total;$('#progress').value=state.done}
function mistake(message){state.mistakes++;state.roundErrors++;status.textContent=message;hud()}
function hint(action){if(!state||state.locked)return;if(!state.hinted){state.hints++;state.hinted=true}action()}
function actions(help){const bar=$('#actions');bar.replaceChildren();bar.append(btn('← Уровни',()=>menu()),btn('↻ Заново',()=>begin(current,state.level)));if(help)bar.append(btn('💡 Подсказка',()=>hint(help)))}
function resetRound(){board.replaceChildren();board.className='';$('#question').replaceChildren();status.textContent='';state.locked=false;state.roundErrors=0;state.hinted=false}
function award(){state.score+=Math.max(20,100-state.roundErrors*20-(state.hinted?30:0));state.done++;hud()}
function nextButton(next){const b=btn(state.done===state.total?'Результат →':'Дальше →',()=>{if(state.done===state.total)finish();else next()},'primary');$('#actions').append(b);b.focus()}
function wordRound(){resetRound();const item=state.items[state.done];$('#question').append(document.createTextNode(`Find the ${item[0]}`));if('speechSynthesis' in window)$('#question').append(btn('🔊',()=>speak(item[0]),'sound'));
 board.className='word-grid';shuffle(words[state.level]).forEach(choice=>{const b=btn(choice[1],()=>{if(state.locked)return;if(choice[0]===item[0]){state.locked=true;b.classList.add('correct');award();state.review.push(item[0]+' — '+item[2]);status.textContent=`Yes! ${item[0]} — ${item[2]}. Сокровище найдено!`;[...board.children].forEach(c=>c.disabled=true);nextButton(wordRound)}else{b.disabled=true;b.classList.add('wrong');mistake(`${choice[0]} — ${choice[2]}. Ищи ${item[0]}. Попробуй ещё!`) }},'picture');b.setAttribute('aria-label',choice[2]);board.append(b)});
 actions(()=>{status.textContent=`${item[0]} — ${item[2]}. Найди ${item[1]}. С подсказкой награда меньше.`});
}
function phraseRound(){resetRound();const item=state.items[state.done],tokens=item[1].split(' '),picked=[];$('#question').textContent=item[0];board.className='phrase-board';const answer=document.createElement('div');answer.className='sentence';answer.setAttribute('aria-label','Твой ответ');const pool=document.createElement('div');pool.className='word-bank';const caption=document.createElement('p');caption.textContent='Нажимай слова по порядку. Пунктуация тоже часть фразы.';board.append(answer,caption,pool);
 const check=btn('Проверить',()=>{if(state.locked||picked.length!==tokens.length)return;const actual=picked.map(p=>p.word).join(' ');if(actual===item[1]){state.locked=true;award();const phrase=item[1].replace(/ ([!?,.])/g,'$1');state.review.push(phrase+' — '+item[0]);status.textContent='Excellent! '+phrase;board.querySelectorAll('button').forEach(b=>b.disabled=true);check.disabled=true;if('speechSynthesis' in window)$('#actions').append(btn('🔊 Послушать',()=>speak(phrase)));nextButton(phraseRound)}else{mistake('Пока не совсем так. Нажми на слова в ответе, чтобы изменить порядок, или возьми подсказку.');answer.classList.add('needs-fix')}},'primary');check.disabled=true;
 function render(){answer.replaceChildren();answer.classList.remove('needs-fix');if(!picked.length){const placeholder=document.createElement('span');placeholder.textContent='Твоя фраза появится здесь';answer.append(placeholder)}picked.forEach((p,index)=>answer.append(btn(p.word,()=>{if(state.locked)return;p.button.disabled=false;picked.splice(index,1);render()},'word-chip')));check.disabled=picked.length!==tokens.length}
 shuffle(tokens.map((word,id)=>({word,id}))).forEach(p=>{const b=btn(p.word,()=>{if(state.locked)return;b.disabled=true;picked.push({word:p.word,button:b});render()},'word-chip');pool.append(b)});render();actions(()=>{status.textContent='Образец: '+item[1].replace(/ ([!?,.])/g,'$1')+'. Собери такую фразу из слов.'});$('#actions').append(check);
}
function matchRound(){resetRound();$('#question').textContent='Match the word to the animal';board.className='match-board';const left=document.createElement('div'),right=document.createElement('div');left.className=right.className='match-column';board.append(left,right);let selected=null;const buttons=[];
 shuffle(state.items).forEach(item=>{const b=btn(item[0],()=>{if(state.locked)return;left.querySelectorAll('button').forEach(c=>{c.classList.remove('selected');c.setAttribute('aria-pressed','false')});selected={item,button:b};b.classList.add('selected');b.setAttribute('aria-pressed','true');status.textContent='Теперь выбери картинку справа.';if('speechSynthesis' in window)speak(item[0])},'match-word');b.setAttribute('aria-pressed','false');left.append(b);buttons.push(b)});
 shuffle(state.items).forEach(item=>{const b=btn(item[1],()=>{if(state.locked)return;if(!selected){status.textContent='Сначала выбери английское слово слева.';return}if(item[0]===selected.item[0]){b.disabled=selected.button.disabled=true;b.classList.add('correct');selected.button.classList.add('correct');selected.button.classList.remove('selected');selected.button.setAttribute('aria-pressed','false');award();state.review.push(item[0]+' — '+item[2]);status.textContent=`Great! ${item[0]} — ${item[2]}.`;selected=null;state.roundErrors=0;state.hinted=false;if(state.done===state.total){state.locked=true;nextButton(()=>{})}}else{mistake(`Это ${item[0]} — ${item[2]}. Найди пару для ${selected.item[0]}.`)}},'match-picture');b.setAttribute('aria-label',item[2]);right.append(b);buttons.push(b)});
 actions(()=>{if(!selected){status.textContent='Выбери слово слева, чтобы увидеть его перевод.';state.hints--;state.hinted=false;return}status.textContent=`${selected.item[0]} — ${selected.item[2]} ${selected.item[1]}.`});
}
function finish(){const s=state;const penalty=s.mistakes+s.hints,stars=penalty===0?3:penalty<=3?2:1;const previous=savedLevel(current,s.level);progress[current]={...record(current),[s.level]:{stars:Math.max(stars,previous?.stars||0),score:Math.max(s.score,previous?.score||0)}};save();clean();$('#question').textContent='★'.repeat(stars)+'☆'.repeat(3-stars);board.className='results';const title=document.createElement('h3');title.textContent='Level complete!';const detail=document.createElement('p');detail.textContent=`${s.score} coins · Ошибок: ${s.mistakes} · Подсказок: ${s.hints}`;const review=document.createElement('ul');s.review.forEach(text=>{const li=document.createElement('li');li.textContent=text;review.append(li)});board.append(title,detail,review);status.textContent=stars===3?'Отлично! Все задания выполнены без подсказок.':'Уровень пройден! Повтори его без подсказок, чтобы получить три звезды.';if(!saving)status.textContent+=' Сохранение в браузере недоступно.';$('#actions').append(btn('← Уровни',()=>menu()),btn('Повторить',()=>begin(current,s.level)));if(s.level<2)$('#actions').append(btn('Следующий уровень →',()=>begin(current,s.level+1),'primary'));refreshLibrary();state=null;$('#actions button').focus()}
document.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>{menu(b.dataset.game);modal.showModal()});$('.close').onclick=()=>modal.close();modal.addEventListener('close',stop);refreshLibrary();
