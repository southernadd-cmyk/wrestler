'use strict';
// Ringfax Phase 1 — actual career fixture, pure teletext and deterministic fan voices.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {engine}=require('./_world.cjs');
const {root}=engine(1337);
const {OfficeGame:G,OfficeRingfax:R}=root;
assert.ok(R,'Ringfax module is loaded through the same script list as the browser');
G.fresh();
const s=G.S;
const original=JSON.stringify(s),seed=s.seed;
function grid(page){
 assert.equal(R.press('go',page,s),true);
 const v=R.screen(s);
 assert.equal(v.rows.length,25,'40x25 teletext row count for '+page);
 for(const [i,row] of v.rows.entries())assert.equal(row.text.length,40,'row '+i+' should have exactly 40 cells on page '+page);
 return v;
}
for(const p of [100,101,102,103,104,200,201,300,301,302,500,501])grid(p);
const openingPages=[100,101,102,103,104,200,201,300,301,302];
for(const number of openingPages){
 assert.equal(grid(number).subpages,1,'opening-week page '+number+' must fit one teletext page');
 assert.ok(R.build(s)[number].lines.length<=17,'no overflowing opening story on page '+number);
}
const edition=R.build(s);
assert.equal(s.promoters.length,4,'fixture has four promotions for genuine source data');
const editorialTitles={
 101:'LATEST HEADLINE',102:'SEASON OUTLOOK',103:'THE GRAPEVINE',
 104:'FROM THE ROAD',200:'AFTER THE BELL',201:'THE CRITIC',
 300:'ONES TO WATCH',301:'THE LONG VIEW',302:'TITLE TALK'
};
for(const [page,title] of Object.entries(editorialTitles)){
 assert.equal(edition[page].title,title,'page '+page+' is an editorial feature');
 assert.ok(edition[page].lines.some(row=>row.text.trim()),'page '+page+' is substantive');
}
const fullEdition=Object.values(edition).filter(p=>p.number!==777).flatMap(p=>p.lines)
 .map(r=>r.text.trim()).join('\n');
for(const duplicate of [
 'CHAMPIONS - THE ENTIRE CIRCUIT','RECENT COMPLETED MATCHES',
 'RECORDED MATCH RATINGS','CARD LADDER /','THE CIRCUIT CARD LEADERS',
 'BOOKINGS AND OPPORTUNITIES','THE FOUR PROMOTIONS'
]){
 assert.ok(!fullEdition.includes(duplicate),
  'Ringfax should not duplicate the Office management screen '+duplicate);
}
assert.ok(grid(100).rows.some(row=>row.text.includes('102 OUTLOOK')),
 'week-one index labels page 102 as an outlook');
assert.ok(edition[102].lines.some(row=>row.text.includes('THE BIG QUESTION')),
 'season outlook provides editorial questions rather than a titles table');
assert.ok(edition[300].lines.some(row=>row.text.includes('EDITORS PICKS')),
 'watchlist is editorial, not the Card Ladder');
assert.ok(!edition[300].lines.some(row=>/^\d\.\s/.test(row.text)),
 'watchlist must not display ranking positions');
assert.ok(edition[302].lines.some(row=>row.text.includes('PRESSURE')),
 'title page discusses stakes instead of listing every champion');
assert.ok(edition[302].lines.length<=17,'title opinion column fits one subpage');
for(const x of [200,201,300,302]){
 const source=edition[x].lines.map(row=>row.text).join(' ');
 assert.ok(!source.includes('stars'),'editorial page '+x+' must not copy match grades');
}
const forum=edition[500].lines.map(row=>row.text.trim()).filter(Boolean).join('|');
const mail=edition[501].lines.map(row=>row.text.trim()).filter(Boolean).join('|');
assert.ok(forum.includes('BALCONYSEAT')&&forum.includes('KAYFABEKEV'),
 'Fanzone contains distinct opening-week forum contributors');
assert.ok(!mail.includes('BALCONYSEAT')&&!mail.includes('KAYFABEKEV'),
 'letters are not just a repeat of the forum');
assert.ok(mail.includes('GRAPPLEGRAN')&&mail.includes('TICKETSTUB'),
 'letters retain the different written correspondence');
const freshSnapshot=JSON.stringify(s);
// Week two uses current, actual circuit news and never reprints the preview.
const weekTwo=JSON.parse(JSON.stringify(s));
weekTwo.week=2;
const oldHolder=weekTwo.territory.titles.dock.men.holder;
const challenger=Object.keys(weekTwo.territory.cards.dock).find(id=>
 id!==oldHolder&&root.OfficeData.divisionOf(id)==='men');
assert.ok(challenger,'the test fixture provides a second male wrestler');
weekTwo.territory.titles.dock.men.holder=challenger;
weekTwo.territory.lastResults={
 week:2,matches:[{pid:'dock',div:'men',a:oldHolder,b:challenger,
  winner:challenger,title:true,stars:3.5}]
};
weekTwo.territory.titleLog??=[];
weekTwo.territory.titleLog.unshift({
 week:2,how:'match',pid:'dock',div:'men',from:oldHolder,to:challenger
});
weekTwo.territory.business??={};
weekTwo.territory.business.dock={buzz:49};
const weekTwoBefore=JSON.stringify(weekTwo);
const weekTwoNews=R.build(weekTwo);
assert.equal(weekTwoNews[102].title,'CIRCUIT NEWS',
 'page 102 becomes live news from week two onward');
assert.ok(weekTwoNews[102].lines.some(row=>row.text.includes('TITLE CHANGES')),
 'verified title change produces news commentary');
assert.ok(weekTwoNews[102].lines.some(row=>row.text.includes('THIS WEEK IN THE RING')),
 'confirmed result underpins the newsroom story');
assert.ok(weekTwoNews[102].lines.some(row=>row.text.includes('PROMOTION BUZZ')),
 'buzz is covered editorially without reproducing numeric standings');
assert.ok(weekTwoNews[102].lines.length<=17,'weekly edition fits one page');
assert.equal(JSON.stringify(weekTwo),weekTwoBefore,'week two editorial cannot change state');
const noReport=JSON.parse(JSON.stringify(weekTwo));
delete noReport.territory.lastResults;
noReport.territory.titleLog=[];
assert.equal(R.build(noReport)[102].title,'CIRCUIT NEWS',
 'news page is not a stale season preview in quiet weeks');
assert.ok(R.build(noReport)[102].lines.some(r=>r.text.includes('No new verified circuit results')),
 'do not invent match results during quiet weeks');
assert.equal(JSON.stringify(s),freshSnapshot,'reading the edition remains read-only');

const index=grid(100);
assert.ok(index.rows.slice(1,5).some(x=>x.text.includes('RINGFAX')),'model retains a readable RINGFAX text equivalent');
assert.ok(R.view(s).includes('class="rf-logo-svg"'),'masthead uses a scalable custom pixel logo');
assert.ok(R.view(s).includes('shape-rendering="crispEdges"'),'logo uses crisp pixel edges, not Unicode font blocks');
assert.match(R.view(s),/rf-logo-svg[^>]*>\s*<path fill="#ffed00" d="M[\d ]+h1v1h-1z/,'pixel paths are present in the masthead');
assert.ok(index.rows.slice(1,5).every(x=>!x.text.includes('█')),'masthead does not use oversized fallback glyphs');
assert.ok(index.rows.slice(1,5).every(x=>x.background==='blue'),'mosaic logo has a blue field');
assert.equal(index.rows[23].segments?.length,4,'four in-grid Fastext controls');
assert.equal(index.rows[23].segments.reduce((n,x)=>n+x.text.length,0),40,'Fastext is exactly forty cells');
assert.ok(R.view(s).includes('rf-index-half'),'index rows provide individual column links');
assert.ok(R.view(s).includes('rf-mosaic'),'block headings render as text cells');
assert.equal(JSON.stringify(s),original,'opening and reading the teletext cannot mutate career state');
assert.equal(s.seed,seed,'Ringfax cannot consume the main career RNG');
// The original opening letters were 20 rows and broke TICKETSTUB's final
// sentence onto a nearly empty second page. All four now stay together.
const openingLetters=grid(501);
assert.equal(openingLetters.subpages,1,'week-one readers letters must fit on one page');
assert.equal(R.build(s)[501].subpages.length,1,'single editorial page, not 17-row slicing');
assert.ok(R.build(s)[501].lines.length<=17,'week-one letters stay within the content budget');
for(const handle of ['GRAPPLEGRAN','HEELTURN78','MATWORKMICK','TICKETSTUB']){
 assert.equal(openingLetters.rows.filter(r=>r.text.includes('FROM: '+handle)).length,1,
  'the entire opening letter from '+handle+' stays in view');
}
assert.ok(openingLetters.rows.some(r=>r.text.includes('Earn our ticket money')),
 'the last letter is not orphaned on a second subpage');
assert.ok(!R.view(s).includes('class="rf-sub-nav"'),
 'single-page readers letters show no previous or next controls');
assert.ok(!R.view(s).includes('class="rf-hold"'),
 'single-page readers letters show no pointless Hold control');
assert.ok(!openingLetters.rows[24].text.includes('HOLD')&&!openingLetters.rows[24].text.includes('SUBPAGES'),
 'single-page teletext status line does not advertise nonexistent subpages');
for(const key of ['ArrowLeft','ArrowRight',' '])
 assert.equal(R.key(key,s),false,'single-page '+key+' does not navigate or hold');
assert.equal(R.screen(s).sub,0,'single-page navigation cannot change the subpage');
const empty=grid(500);
assert.match(empty.rows.map(x=>x.text).join(' '),/OPENING WEEK/i,'opening-week fan opinions appear before the first match');
assert.match(empty.rows.map(x=>x.text).join(' '),/BALCONYSEAT|KAYFABEKEV/,'Fanzone uses distinct readers from the Letters page');
assert.doesNotMatch(empty.rows.map(x=>x.text).join(' '),/WINNER:/,'opening-week letters do not invent match results');

s.cash=99999;
assert.equal(G.sign('rex'),null);
const c={id:'ringfax-p1-fixture',pid:'dock',wid:'rex',rid:'silas',
 slot:'mid',finish:'lose_clean',purse:250,eventAbs:G.abs()};
const fin={stars:3.5,crowd:70,crowdPeak:75,outcome:'booked',botches:0,
 script:.85,adj:{purseMul:1,rep:0,trust:0,heat:0,morale:0},
 minutes:12,plan:'safe',stamina:60,injury:0,ignored:0,callsUsed:[],log:[]};
s.card.push(c);G.applyResult(c,fin);
const h=s.history.find(x=>x.cid===c.id);
assert.ok(h,'the fixture must be a genuinely settled career result');
const prior=JSON.stringify(s),postSeed=s.seed;
const expected=JSON.stringify(R.voices(h,3));
assert.equal(JSON.stringify(R.voices(h,3)),expected,'fan voices are deterministic');
assert.equal(new Set(R.voices(h,3).map(f=>f.name)).size,3,'first fan page contains three distinct contributors');
assert.ok(R.voices(h,3).every(f=>f.sourceId===h.cid),'every fan letter is anchored in the actual result');

const news=grid(101);
assert.match(news.rows.map(x=>x.text).join(' '),/Rex|Silas/,'editorial headline refers to the actual participants');
const results=grid(200);
assert.match(results.rows.map(x=>x.text).join(' '),/CHEAP SEATS/,'post-match column reports fan reaction, not the results table');
let fan=grid(500);
assert.match(fan.rows.map(x=>x.text).join('\n'),/THE FANZONE/);
assert.match(fan.rows.map(x=>x.text).join('\n'),/GRAPPLE|HEELTURN|MATWORK|BALCONY|KAYFABE|TICKET|FRONTROW|BIGSPOT/);
assert.ok(R.view(s).includes('data-rf-action="digit"'));
assert.ok(R.view(s).includes('data-rf-action="jump"'),'players can enter a three-digit page directly');
assert.ok(R.view(s).includes('rf-page-grid'),'page directory remains visible');
assert.ok(R.view(s).includes('data-rf-value="500"'),'the Fanzone has a direct shortcut');
assert.equal(typeof R.fit,'function','the screen has a viewport font fitting hook');
assert.ok(R.view(s).includes('plain text'));
let letters=grid(501);
const letterStory=R.build(s)[501];
const postMatchForum=R.build(s)[500].lines.map(row=>row.text).join('\n');
const postMatchLetters=letterStory.lines.map(row=>row.text).join('\n');
for(const name of R.voices(h,8).slice(0,3).map(f=>f.name))
 assert.ok(!postMatchLetters.includes('FROM: '+name),
  'post-match letters should not repeat Fanzone author '+name);
assert.notEqual(postMatchForum,postMatchLetters,'post-match forums and mail have different content');

assert.ok(letters.subpages>=2,'five post-match letters can span complete subpages');
assert.equal(letterStory.subpages.length,letters.subpages,'custom subpage model matches the screen');
const contributorNames=R.voices(h,8).slice(3,8).map(f=>f.name);
for(const name of contributorNames){
 assert.ok(letterStory.subpages.some(rows=>rows.some(row=>row.text.includes('FROM: '+name))),
  'post-match letter from '+name+' must not disappear');
}
for(const [i,rows] of letterStory.subpages.entries()){
 assert.ok(rows.length<=17,'post-match subpage '+(i+1)+' stays within 17 lines');
 assert.equal(rows[0].text.trim(),'LETTERS TO RINGFAX','every subpage repeats the letters masthead');
 assert.ok(rows.slice(2).some(row=>row.text.startsWith('FROM: ')),
  'every subpage identifies the author instead of beginning with an orphaned paragraph');
}
assert.ok(R.view(s).includes('class="rf-sub-nav"'),
 'multipage letters show previous/next navigation');
assert.ok(R.view(s).includes('class="rf-hold"'),
 'multipage letters show Hold');
assert.ok(letters.rows[24].text.includes('SUBPAGES'),'multipage teletext has page navigation prompt');
R.press('right',null,s);
assert.equal(R.screen(s).sub,1,'right navigates to a genuine second letter page');
assert.equal(R.screen(s).rows[6].text.trim(),'LETTERS TO RINGFAX',
 'following subpage starts with a full letter heading');
assert.ok(R.view(s).includes('aria-pressed="true"'),
 'turning a subpage manually pauses automatic rotation');
R.press('left',null,s);
assert.equal(R.screen(s).sub,0,'left returns to the first subpage');
assert.ok(R.view(s).includes('data-record="w:rex"'),'a real wrestler profile link is provided');

grid(999);
assert.match(R.screen(s).rows.map(x=>x.text).join(' '),/PAGE NOT FOUND/);
R.press('go',100,s);
R.press('digit','2',s);R.press('digit','0',s);R.press('digit','0',s);
assert.equal(R.screen(s).page,200,'three-digit remote goes to a page');
R.key('F4',s);
assert.equal(R.screen(s).page,500,'F4 goes straight to the Fanzone');
assert.equal(JSON.stringify(s),prior,'teletext interaction must not write career state');
assert.equal(s.seed,postSeed,'teletext must not consume the career RNG');

// Integration contracts: keep desktop/mobile navigation and the static-hosted script ordering intact.
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const ui=fs.readFileSync(path.join(__dirname,'../assets/js/ui.js'),'utf8');
assert.ok(html.includes('assets/js/ringfax.js'));
assert.ok(html.includes('assets/css/ringfax.css'));
assert.ok(html.indexOf('assets/js/ringfax.js')<html.indexOf('assets/js/ui.js'),'module loads before UI');
assert.ok(ui.includes("['ringfax','Ringfax']"),'Ringfax appears in ordinary navigation');
assert.ok(ui.includes("ringfax:renderRingfax"),'Ringfax route has a real screen');
assert.ok(ui.includes('ringfax-page-rotated'),'subpage auto-rotation integrates with the route');

// Secret page 777 is not linked from the directory: it must be entered manually.
R.press('go',100,s);
assert.ok(!R.view(s).includes('data-rf-value="777"'),'secret quiz is not openly listed');
const quizBank=R.quizQuestions;
assert.equal(quizBank.length,12,'Bamboozle-style run has twelve questions');
for(const [i,q] of quizBank.entries()){
 assert.equal(q.a.length,4,'quiz question '+(i+1)+' has four colours');
 assert.equal(new Set(q.a).size,4,'each option must be different');
 assert.ok(Number.isInteger(q.correct)&&q.correct>=0&&q.correct<4,'one correct answer');
 assert.match(q.source,/^https:\/\//,'trivia question has a verifiable source');
}
const beforeQuiz=JSON.stringify(s),quizSeed=s.seed;
for(const d of ['7','7','7'])assert.ok(R.press('digit',d,s));
assert.equal(R.screen(s).page,777);
assert.equal(R.quizInfo().stage,'intro');
assert.equal(R.screen(s).subpages,1,'quiz intro fits one teletext page');
assert.ok(R.view(s).includes('rf-quiz-active'),'secret page exposes answer controls');
assert.equal(R.key('F2',s),true,'green button opens the rules');
assert.equal(R.quizInfo().stage,'rules');
assert.equal(R.key('F1',s),true,'red starts quiz from rules');
assert.equal(R.quizInfo().stage,'question');
assert.equal(R.view(s).split('class="rf-bz-choice rf-bz-').length-1,4,'four classic answer buttons are clickable');
assert.ok(R.view(s).includes('class="rf-bz-bubble"'),'question appears in a white speech bubble');
assert.ok(R.view(s).includes('class="rf-bz-mascot"'),'original yellow quiz mascot is rendered');
assert.ok(R.view(s).includes('PRESS THE COLOUR OF YOUR CHOICE'),'blue instruction strip is rendered');
assert.equal(R.screen(s).rows[23].segments.length,4);
assert.ok(R.screen(s).rows[23].segments.every(f=>f.action==='quiz-answer'));
const colouredAnswers=R.build(s)[777].lines.filter(row=>Number.isInteger(row.answerIndex));
assert.equal(colouredAnswers.length,4,'each question has four coloured answer lines');
for(const [i,colour] of ['red','green','yellow','cyan'].entries()){
 assert.equal(colouredAnswers[i].colour,colour,'answer '+(i+1)+' colour matches the Fastext button');
 assert.ok(colouredAnswers[i].text.startsWith(colour.toUpperCase()+': '),
  'answer line spells out its matching Fastext colour');
 assert.ok(R.view(s).includes('class="rf-bz-choice rf-bz-'+colour+'"'),
  'interactive answer is styled with a coloured teletext square');
}


// Wrong-answer detour, optional reveal and comeback.
assert.ok(R.press('quiz-answer',(quizBank[0].correct+1)%4,s));
assert.equal(R.quizInfo().stage,'wrong');
assert.equal(R.key('F2',s),true);
assert.equal(R.quizInfo().reveal,true);
assert.equal(R.key('F1',s),true);
assert.equal(R.quizInfo().index,0,'wrong answer restarts at checkpoint');
for(let i=0;i<quizBank.length;i++){
 const info=R.quizInfo();
 assert.equal(info.stage,'question','question '+(i+1)+' is active');
 assert.equal(info.index,i);
 const page=R.screen(s);
 assert.equal(page.subpages,1,'one question per complete teletext page');
 assert.ok(page.rows.every(row=>row.text.length===40),'question grid never overflows');
 if(i===5){
  assert.equal(info.checkpoint,4,'checkpoint after question four');
  R.press('quiz-answer',(quizBank[i].correct+1)%4,s);
  assert.equal(R.quizInfo().stage,'wrong');
  R.press('quiz-retry',null,s);
  assert.equal(R.quizInfo().index,4,'mid-run wrong answer returns to question five');
  R.press('quiz-answer',quizBank[4].correct,s);
  assert.equal(R.quizInfo().index,5);
 }
 assert.ok(R.press('quiz-answer',quizBank[i].correct,s));
}
assert.equal(R.quizInfo().stage,'won','all twelve correct answers win');
assert.equal(R.quizInfo().checkpoint,12);
assert.match(R.screen(s).rows.map(row=>row.text).join(' '),/QUIZ CHAMPION/);
assert.equal(R.screen(s).subpages,1);
assert.equal(JSON.stringify(s),beforeQuiz,'quiz cannot change any career property');
assert.equal(s.seed,quizSeed,'quiz consumes zero game RNG');
R.press('go',100,s);
R.press('go',777,s);
assert.equal(R.quizInfo().stage,'intro','re-entering the hidden page gives a fresh quiz');
R.press('go',100,s);

console.log('PASS Ringfax Phase 1 + secret quiz: read-only, 40x25 pages, actual results, deterministic Fanzone, remote and route');
