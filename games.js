'use strict';
const $=s=>document.querySelector(s), modal=$('#game');
const config={
greetings:{title:'Hello, friend!',topic:'Приветствие · Знакомство · Прощание',hero:'Финн · твой новый друг',note:'Давай поговорим!',total:8},
numbers:{title:'Star collector',topic:'Счёт от 1 до 10',hero:'Бип · исследователь звёзд',note:'Каждая звезда на счету!',total:10},
colors:{title:'Color magic',topic:'Цвета на английском',hero:'Луми · художник сада',note:'Раскрасим этот мир!',total:10}
};
const dialogues=[
{cue:'Hello!',ru:'Финн здоровается. Поздоровайся в ответ.',answer:'Hi!',options:['Hi!','Goodbye!','Good night!'],translation:'Привет!'},
{cue:'Good morning!',ru:'Сейчас утро. Поприветствуй Финна.',answer:'Good morning!',options:['Good evening!','Good morning!','See you!'],translation:'Доброе утро!'},
{cue:"What is your name?",ru:'Финн спрашивает, как тебя зовут. Представься как Алекс.',answer:'My name is Alex.',options:['I am fine, thank you.','My name is Alex.','Goodbye!'],translation:'Меня зовут Алекс.'},
{cue:'My name is Finn. Nice to meet you!',ru:'Финн представился. Скажи, что тоже рад знакомству.',answer:'Nice to meet you too!',options:['Good night!','Nice to meet you too!','My name is Finn.'],translation:'Тоже рад знакомству!'},
{cue:'How are you?',ru:'Финн спрашивает, как дела. Ответь: «Хорошо, спасибо».',answer:'I am fine, thank you.',options:['I am fine, thank you.','See you tomorrow!','Hello!'],translation:'У меня всё хорошо, спасибо.'},
{cue:'Goodbye, Alex!',ru:'Пора идти домой. Попрощайся с Финном.',answer:'Goodbye, Finn!',options:['Good morning!','My name is Alex.','Goodbye, Finn!'],translation:'До свидания, Финн!'},
{cue:'See you tomorrow!',ru:'Вы встретитесь завтра. Скажи: «До завтра!»',answer:'See you tomorrow!',options:['Nice to meet you!','See you tomorrow!','How are you?'],translation:'До завтра!'},
{cue:'Good night!',ru:'Уже поздно, пора спать. Пожелай спокойной ночи.',answer:'Good night!',options:['Good morning!','Good night!','Hi!'],translation:'Спокойной ночи!'}
];
const numberWords=['one','two','three','four','five','six','seven','eight','nine','ten'];
const colors=[['red','#e64946','красный'],['blue','#357cdb','синий'],['yellow','#f5cf43','жёлтый'],['green','#4c9f57','зелёный'],['orange','#f1933c','оранжевый'],['purple','#975dbe','фиолетовый'],['pink','#ed99bc','розовый'],['brown','#906047','коричневый'],['black','#30343d','чёрный'],['white','#ffffff','белый']];
function shuffle(items){return [...items].sort(()=>Math.random()-.5)}
let state=null, sound=true, utterance=null, speechId=0, voiceList=[], saved={};
try{const value=JSON.parse(localStorage.getItem('little-adventures-v2')||'{}');if(value&&typeof value==='object'&&!Array.isArray(value))saved=value}catch{$('#storage-note').textContent='Сохранение недоступно — можно играть без него'}
function refresh(){for(const key of Object.keys(config)){if(Number.isInteger(saved[key])&&saved[key]>=1&&saved[key]<=3)$('#saved-'+key).textContent='★'.repeat(saved[key])+' Пройдено'}}
refresh();
function button(label,fn,cls='answer'){const b=document.createElement('button');b.type='button';b.className=cls;b.textContent=label;b.onclick=fn;return b}
function stopSpeech(){speechId++;if('speechSynthesis'in window)window.speechSynthesis.cancel();utterance=null}
function voices(){if('speechSynthesis'in window)voiceList=window.speechSynthesis.getVoices()}
if('speechSynthesis'in window){voices();window.speechSynthesis.addEventListener('voiceschanged',voices)}
function speak(text){
 stopSpeech();const id=speechId;
 if(!sound){$('#audio-status').textContent='Звук выключен. Включи его кнопкой вверху страницы.';return}
 if(!('speechSynthesis'in window)){ $('#audio-status').textContent='Этот браузер не поддерживает озвучку. Все задания доступны с текстом.';return }
 voices();utterance=new SpeechSynthesisUtterance(text);utterance.lang='en-US';utterance.rate=.82;utterance.pitch=1;
 const english=voiceList.filter(v=>/^en[-_]/i.test(v.lang));utterance.voice=english.find(v=>v.lang==='en-US'&&v.localService)||english.find(v=>v.lang==='en-US')||english[0]||null;
 $('#audio-status').textContent='Подготовка голоса…';
 utterance.onstart=()=>{if(id===speechId)$('#audio-status').textContent='Слушай и повторяй'};
 utterance.onend=()=>{if(id===speechId){$('#audio-status').textContent='Можно послушать ещё раз';utterance=null}};
 utterance.onerror=e=>{if(id===speechId&&!['canceled','interrupted'].includes(e.error))$('#audio-status').textContent='Не удалось включить голос. Проверь английский голос в настройках браузера и нажми «Послушать» ещё раз.'};
 window.speechSynthesis.resume();window.speechSynthesis.speak(utterance);
 setTimeout(()=>{if(id===speechId&&$('#audio-status').textContent==='Подготовка голоса…')$('#audio-status').textContent='Голос не отвечает. Попробуй ещё раз или проверь английский голос в настройках устройства.'},6000);
}
$('#sound-toggle').onclick=()=>{sound=!sound;$('#sound-toggle').textContent=sound?'♪ Звук включён':'♪ Звук выключен';$('#sound-toggle').setAttribute('aria-pressed',String(sound));if(!sound)stopSpeech()};
$('#close').onclick=()=>modal.close();
modal.addEventListener('close',()=>{stopSpeech();state=null;document.body.style.overflow=''});
$('#restart').onclick=()=>{if(state)start(state.id)};
document.querySelectorAll('[data-game]').forEach(b=>b.onclick=()=>{start(b.dataset.game);modal.showModal();document.body.style.overflow='hidden'});
function start(id){stopSpeech();state={id,index:0,mistakes:0,locked:false,order:id==='colors'?shuffle(colors):id==='numbers'?shuffle(numberWords.map((w,i)=>i)):dialogues};
const c=config[id];modal.className=id;$('#game-title').textContent=c.title;$('#game-topic').textContent=c.topic;$('#hero-name').textContent=c.hero;$('#hero-note').textContent=c.note;$('#restart').hidden=false;render()}
function render(){stopSpeech();const s=state,c=config[s.id];s.locked=false;$('#board').replaceChildren();$('#actions').replaceChildren();$('#feedback').textContent='';$('#audio-status').textContent='';$('#listen').hidden=false;$('#progress').max=c.total;$('#progress').value=s.index;$('#progress-label').textContent='Задание '+(s.index+1)+' из '+c.total;
if(s.id==='greetings')renderDialogue();else if(s.id==='numbers')renderNumber();else renderColor()}
function wrong(message){state.mistakes++;$('#feedback').textContent=message}
function success(message){state.locked=true;$('#feedback').textContent=message;$('#progress').value=state.index+1;$('#board').querySelectorAll('button').forEach(b=>b.disabled=true);$('#actions').replaceChildren(button(state.index+1===config[state.id].total?'Мой результат →':'Дальше →',()=>{state.index++;if(state.index===config[state.id].total)finish();else render()},'primary'))}
function renderDialogue(){const item=dialogues[state.index];$('#instruction').textContent=item.ru;$('#question').textContent='Финн: “'+item.cue+'”';$('#listen').onclick=()=>speak(item.cue);
shuffle(item.options).forEach(option=>{const b=button(option,()=>{if(state.locked)return;speak(option);if(option===item.answer){b.classList.add('correct');success('Отлично! '+item.answer+' — '+item.translation)}else{b.classList.add('wrong');b.disabled=true;wrong('Эта реплика здесь не подходит. Прочитай ситуацию и попробуй ещё.')}});$('#board').append(b)})}
function renderNumber(){const n=state.order[state.index]+1,word=numberWords[n-1];let count=0;$('#instruction').textContent='Послушай число. Нажимай на звёзды, чтобы зажечь нужное количество. Повторное нажатие убирает звезду.';$('#question').textContent='Collect '+word+' stars';$('#listen').onclick=()=>speak(word);const field=document.createElement('div');field.className='star-field';const counter=document.createElement('div');counter.className='counter';counter.textContent='Собрано: 0';counter.setAttribute('aria-live','polite');
for(let i=0;i<10;i++){const b=button('★',()=>{if(state.locked)return;const selected=b.getAttribute('aria-pressed')==='true';b.setAttribute('aria-pressed',String(!selected));count+=selected?-1:1;counter.textContent='Собрано: '+count;if(!selected)speak(numberWords[count-1])},'star');b.setAttribute('aria-pressed','false');b.setAttribute('aria-label','Звезда '+(i+1));field.append(b)}
$('#board').append(field,counter);$('#actions').append(button('Проверить',()=>{if(state.locked)return;if(count===n){speak(word);success('Верно! '+n+' — '+word+'. Отличная коллекция!')}else wrong('Сейчас звёзд: '+count+'. Нужно '+n+' ('+word+'). Добавь или убери звёзды и проверь ещё раз.')},'primary'))}
function renderColor(){const target=state.order[state.index];let selected=null;$('#instruction').textContent='Послушай название цвета, выбери краску и раскрась цветок.';$('#question').textContent='Paint it '+target[0]+'!';$('#listen').onclick=()=>speak(target[0]);const stage=document.createElement('div');stage.className='flower-stage';stage.innerHTML='<svg viewBox="0 0 300 170" role="img" aria-label="Цветок для раскрашивания"><path d="M150 150V80" stroke="#5b8e56" stroke-width="9" stroke-linecap="round"/><path d="M147 130Q95 131 106 103Q145 98 147 130M154 145Q207 139 196 113Q162 112 154 145" fill="#82ad65"/><g id="petals" fill="#e2e1db" stroke="#a4a99e" stroke-width="2"><ellipse cx="150" cy="42" rx="23" ry="30"/><ellipse cx="181" cy="64" rx="30" ry="23" transform="rotate(-25 181 64)"/><ellipse cx="170" cy="98" rx="23" ry="30" transform="rotate(-30 170 98)"/><ellipse cx="131" cy="98" rx="23" ry="30" transform="rotate(30 131 98)"/><ellipse cx="119" cy="64" rx="30" ry="23" transform="rotate(25 119 64)"/></g><circle cx="150" cy="75" r="19" fill="#f6cc62"/><path d="M143 80Q150 87 157 80" fill="none" stroke="#785c37" stroke-width="2"/><circle cx="144" cy="71" r="2" fill="#785c37"/><circle cx="157" cy="71" r="2" fill="#785c37"/></svg>';
const palette=document.createElement('div');palette.className='palette';shuffle(colors).forEach(color=>{const b=button('',()=>{if(state.locked)return;selected=color;palette.querySelectorAll('button').forEach(x=>x.setAttribute('aria-pressed','false'));b.setAttribute('aria-pressed','true');$('#petals').setAttribute('fill',color[1]);speak(color[0]);$('#feedback').textContent='Краска выбрана. Нажми «Раскрасить».'},'swatch');b.style.background=color[1];b.title=color[2];b.setAttribute('aria-label',color[2]);b.setAttribute('aria-pressed','false');palette.append(b)});$('#board').append(stage,palette);$('#actions').append(button('Раскрасить',()=>{if(state.locked)return;if(!selected){$('#feedback').textContent='Сначала выбери краску.';return}if(selected[0]===target[0]){speak(target[0]);success('Красиво! '+target[0]+' — '+target[2]+'.')}else{wrong('Ты выбрал цвет '+selected[2]+'. Нужен '+target[2]+' ('+target[0]+'). Попробуй другую краску.')}},'primary'))}
function finish(){stopSpeech();const c=config[state.id],stars=state.mistakes===0?3:state.mistakes<=3?2:1;saved[state.id]=Math.max(Number(saved[state.id])||0,stars);try{localStorage.setItem('little-adventures-v2',JSON.stringify(saved))}catch{$('#storage-note').textContent='Сохранение недоступно — результат останется до перезагрузки'}refresh();$('#progress-label').textContent='Пройдено '+c.total+' из '+c.total;$('#instruction').textContent='Приключение завершено';$('#question').textContent='Ты отлично потрудился!';$('#listen').hidden=true;$('#audio-status').textContent='';$('#feedback').textContent='';$('#board').innerHTML='<div class="result"><div class="stars">'+'★'.repeat(stars)+'☆'.repeat(3-stars)+'</div><h3>'+c.total+' открытий!</h3><p>Ошибок: '+state.mistakes+'.<br>Повтори приключение, чтобы лучше запомнить слова.</p></div>';$('#actions').replaceChildren(button('Играть ещё',()=>start(state.id),'primary'),button('К другим героям',()=>modal.close()));state.locked=true}


const nameKey='little-adventures-player';
let playerName='';
try{playerName=localStorage.getItem(nameKey)||'';if(localStorage.getItem('little-adventures-welcome')==='yes')$('#welcome').hidden=true}catch{}
$('#player-name').value=playerName;
function updateTown(){const total=Object.keys(config).reduce((n,id)=>n+(Number.isInteger(saved[id])&&saved[id]>=1&&saved[id]<=3?saved[id]:0),0);$('#total-stars').textContent='★ '+total+' / 9';$('#total-stars').setAttribute('aria-label','Собрано звёзд: '+total+' из 9');$('#town-greeting').textContent=playerName?'С возвращением, '+playerName+'!':'ТВОЙ ГОРОД АНГЛИЙСКОГО'}
updateTown();
$('#welcome-form').addEventListener('submit',e=>{e.preventDefault();playerName=$('#player-name').value.trim();try{localStorage.setItem(nameKey,playerName);localStorage.setItem('little-adventures-welcome','yes')}catch{}$('#welcome').hidden=true;updateTown();document.querySelector('[data-game]').focus()});
if(!$('#welcome').hidden){document.querySelector('header').inert=true;document.querySelector('main').inert=true}
$('#welcome-form').addEventListener('submit',()=>{document.querySelector('header').inert=false;document.querySelector('main').inert=false;document.querySelector('[data-game]').focus()});
$('#change-player').onclick=()=>{$('#welcome').hidden=false;document.querySelector('header').inert=true;document.querySelector('main').inert=true;$('#player-name').focus()};
modal.addEventListener('close',updateTown);
const celebrateObserver=new MutationObserver(()=>{if(!state||!state.locked||!$('#feedback').textContent)return;document.querySelector('.reward-pop')?.remove();const p=document.createElement('div');p.className='reward-pop';p.setAttribute('aria-hidden','true');p.textContent=state.id==='colors'?'✦ Beautiful!':state.id==='numbers'?'★ Well done!':'✦ Great!';modal.append(p);setTimeout(()=>p.remove(),1150)});
celebrateObserver.observe($('#feedback'),{childList:true});

