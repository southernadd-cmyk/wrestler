/* RINGFAX — a read-only teletext view of the actual career.
   No hooks into match simulation, no calls to the career RNG and no new saved state. */
(function installRingfax(root){'use strict';
 const D=root.OfficeData;
 const C={page:100,sub:0,entry:'',hold:false};

 // RINGFAX PAGE 777 — THE WRESTLING QUIZ CHALLENGE (inspired by teletext quizzes,
 // not copying Bamboozle's name, presenter or question copy).
 // Each factual answer is traceable to the source in the question bank.
 const QUIZ_POOL=[
  {q:"What was Big Daddy's real name?",
   a:['Mick McManus','Shirley Crabtree','Peter Thornley','Max Crabtree'],correct:1,
   fact:'Big Daddy was Shirley Crabtree.',source:'https://wrestlingheritage.co.uk/shirley-crabtree/'},
  {q:'Which channel carried wrestling in the classic World of Sport programme?',
   a:['BBC One','Channel 4','ITV','BBC Two'],correct:2,
   fact:'World of Sport featured ITV wrestling.',source:'https://www.wrestling-titles.com/europe/uk/britainhistory.html'},
  {q:'Who was the famous voice of televised British wrestling?',
   a:['Dickie Davies','Kent Walton','Harry Carpenter','Brian Moore'],correct:1,
   fact:'Kent Walton commentated for decades.',source:'https://wrestlingheritage.co.uk/kent-walton/'},
  {q:'Whom did Kendo Nagasaki unmask in 1966?',
   a:['Count Bartelli','Mick McManus','Billy Robinson','Giant Haystacks'],correct:0,
   fact:'Count Bartelli lost his mask in 1966.',source:'https://wrestlingheritage.co.uk/count-bartelli/'},
  {q:'In what year did ITV end its original regular wrestling coverage?',
   a:['1986','1990','1988','1992'],correct:2,
   fact:'The original ITV run ended in 1988.',source:'https://wrestlingheritage.co.uk/a-year-of-wrestling-1988/'},
  {q:'Who faced Big Daddy at Wembley Arena in 1981?',
   a:['Kendo Nagasaki','Giant Haystacks','Mick McManus','Johnny Saint'],correct:1,
   fact:'Big Daddy beat Haystacks at Wembley.',source:'https://wrestlingheritage.co.uk/shirley-crabtree/'},
  {q:'Who teamed with Dynamite Kid as the British Bulldogs?',
   a:['Bret Hart','Finlay','Davey Boy Smith','William Regal'],correct:2,
   fact:"Davey Boy Smith was Dynamite Kid's tag partner.",source:'https://www.wwe.com/superstars/britishbulldog'},
  {q:"What was Dynamite Kid's real name?",
   a:['Davey Boy Smith','Thomas Billington','Darren Matthews','Peter Thornley'],correct:1,
   fact:'Dynamite Kid was Thomas Billington.',source:'https://www.wwe.com/article/dynamite-kid-passes-away'},
  {q:'Which title did British Bulldog win at SummerSlam 1992?',
   a:['WWE Championship','European Championship','Intercontinental Title','World Tag Team Title'],correct:2,
   fact:'He beat Bret Hart for the Intercontinental title.',source:'https://www.wwe.com/shows/summerslam/1992'},
  {q:'Where was SummerSlam 1992 held?',
   a:['Royal Albert Hall','Wembley Arena','Wembley Stadium','Manchester Arena'],correct:2,
   fact:'The event was held at Wembley Stadium.',source:'https://www.wwe.com/shows/summerslam/1992/venue'},
  {q:'Which wrestler was a Blackpool native known as Regal?',
   a:['William Regal','Johnny Saint','Dynamite Kid','Davey Boy Smith'],correct:0,
   fact:'William Regal came from Blackpool.',source:'https://www.wwe.com/superstars/william-regal'},
  {q:'What weapon was strongly associated with Belfast wrestler Finlay?',
   a:['Kendo stick','Shillelagh','Brass bell','Steel chair'],correct:1,
   fact:'Finlay was famous for his shillelagh.',source:'https://www.wwe.com/superstars/finlay'}
,
  {q:"Who was nicknamed Rollerball?",a:["Mark Rocco","Jim Breaks","Tony St Clair","Steve Grey"],correct:0,fact:"Mark Rocco's famous ring nickname was Rollerball.",source:"https://wrestlingheritage.co.uk/mark-rollerball-rocco/"},
  {q:"Which masked wrestler did Mark Rocco portray in Japan?",a:["Tiger Mask","Black Tiger","Kendo Nagasaki","The Outlaw"],correct:1,fact:"Rocco wrestled in Japan as Black Tiger.",source:"https://wrestlingheritage.co.uk/mark-rollerball-rocco/"},
  {q:"What British ring name did the original Tiger Mask use?",a:["Sammy Lee","Johnny Saint","Jon Cortez","Bobby Ryan"],correct:0,fact:"Satoru Sayama wrestled in Britain as Sammy Lee.",source:"https://wrestlingheritage.co.uk/mark-rollerball-rocco/"},
  {q:"Who founded Wrestling Enterprises in 1970?",a:["Jackie Pallo","Brian Dixon","Max Crabtree","Norman Morrell"],correct:1,fact:"Brian Dixon founded Wrestling Enterprises in 1970.",source:"https://www.wrestling-titles.com/europe/uk/asw/"},
  {q:"Wrestling Enterprises later became which promotion?",a:["Joint Promotions","Dale Martin","All Star Wrestling","Big Time Wrestling"],correct:2,fact:"Wrestling Enterprises became All Star Wrestling.",source:"https://www.wrestling-titles.com/europe/uk/asw/"},
  {q:"What year did Wrestling Enterprises begin?",a:["1960","1970","1980","1990"],correct:1,fact:"Brian Dixon's promotion began in 1970.",source:"https://www.wrestling-titles.com/europe/uk/asw/"},
  {q:"Who beat Jim Breaks for the world lightweight title in 1976?",a:["Steve Grey","George Kidd","Johnny Saint","Marty Jones"],correct:2,fact:"Johnny Saint took the world lightweight title in November 1976.",source:"https://wrestlingheritage.co.uk/a-year-of-wrestling-1976/"},
  {q:"Who retired as world lightweight champion in 1976?",a:["George Kidd","Les Kellett","Mark Rocco","Johnny Saint"],correct:0,fact:"George Kidd retired in 1976.",source:"https://wrestlingheritage.co.uk/a-year-of-wrestling-1976/"},
  {q:"Who beat Mark Rocco for the British light-heavyweight title in 1976?",a:["Marty Jones","Jim Breaks","Dave Finlay","Johnny Saint"],correct:0,fact:"Marty Jones won that title from Rocco in December 1976.",source:"https://wrestlingheritage.co.uk/a-year-of-wrestling-1976/"},
  {q:"Which wrestler was also known as Mr TV?",a:["Mick McManus","Kent Walton","Jackie Pallo","Big Daddy"],correct:2,fact:"Jackie Pallo became known as Mr TV.",source:"https://wrestlingheritage.co.uk/jackie-pallo/"},
  {q:"Which wrestler was nicknamed the Dulwich Destroyer?",a:["Mick McManus","Jackie Pallo","Johnny Saint","Jim Breaks"],correct:0,fact:"Mick McManus was known as the Dulwich Destroyer.",source:"https://wrestlingheritage.co.uk/mick-mcmanus/"},
  {q:"Which British star had a legendary feud with Jackie Pallo?",a:["Davey Boy Smith","Mick McManus","Mark Rocco","Steve Grey"],correct:1,fact:"Jackie Pallo and Mick McManus had a celebrated rivalry.",source:"https://wrestlingheritage.co.uk/the-mcmanus-pallo-feud/"},
  {q:"Which commentator was a fixture on ITV's televised wrestling?",a:["Kent Walton","Brian Moore","Barry Davies","John Motson"],correct:0,fact:"Kent Walton became the voice of ITV wrestling.",source:"https://wrestlingheritage.co.uk/commentators-a-z/"},
  {q:"Who also appeared as a mid-round ITV wrestling analyst?",a:["Bret Hart","Mick McManus","Frank Bruno","Dynamite Kid"],correct:1,fact:"McManus contributed mid-round analysis with Kent Walton.",source:"https://wrestlingheritage.co.uk/commentators-a-z/"},
  {q:"Which Japanese wrestler appeared for All Star as Fuji Yamada?",a:["Jushin Liger","Shinjiro Otani","Satoru Sayama","Mitsuharu Misawa"],correct:0,fact:"Fuji Yamada later became Jushin Thunder Liger.",source:"https://wrestlingheritage.co.uk/fuji-yamada/"},
  {q:"Who did Fuji Yamada defeat for a world title in 1986?",a:["Giant Haystacks","Rollerball Rocco","Big Daddy","Johnny Saint"],correct:1,fact:"Fuji Yamada won the world heavy-middleweight title from Mark Rocco.",source:"https://wrestlingheritage.co.uk/fuji-yamada/"},
  {q:"Which Japanese ring name was associated with Fuji Yamada?",a:["Black Tiger","Tiger Mask","Jushin Liger","The Great Sasuke"],correct:2,fact:"Fuji Yamada became famous as Jushin Thunder Liger.",source:"https://wrestlingheritage.co.uk/fuji-yamada/"},
  {q:"What venue hosted WWF SummerSlam 1992?",a:["Wembley Arena","Royal Albert Hall","Wembley Stadium","The O2"],correct:2,fact:"SummerSlam 1992 took place at Wembley Stadium.",source:"https://www.wwe.com/shows/summerslam/1992"},
  {q:"Who entered SummerSlam 1992 as Intercontinental Champion?",a:["British Bulldog","Bret Hart","Randy Savage","The Undertaker"],correct:1,fact:"Bret Hart held the Intercontinental title entering his match.",source:"https://www.wwe.com/shows/summerslam/1992"},
  {q:"Who won the Intercontinental title at SummerSlam 1992?",a:["British Bulldog","Mr Perfect","Shawn Michaels","Bret Hart"],correct:0,fact:"British Bulldog beat Bret Hart to win the title.",source:"https://www.wwe.com/shows/summerslam/1992"},
  {q:"Which boxer accompanied British Bulldog at SummerSlam 1992?",a:["Frank Bruno","Lennox Lewis","Nigel Benn","Chris Eubank"],correct:1,fact:"Lennox Lewis accompanied British Bulldog at Wembley.",source:"https://www.wwe.com/shows/summerslam/history/greatestmatches"},
  {q:"How were Bret Hart and British Bulldog related in 1992?",a:["Brothers","Cousins","Brothers-in-law","Uncle and nephew"],correct:2,fact:"Bret Hart and Davey Boy Smith were brothers-in-law.",source:"https://www.wwe.com/shows/summerslam/1992"},
  {q:"In which city was SummerSlam 1992 held?",a:["Cardiff","Manchester","Birmingham","London"],correct:3,fact:"Wembley Stadium is in London.",source:"https://www.wwe.com/shows/summerslam/1992"},
  {q:"Who became the first WWE United Kingdom Champion?",a:["Pete Dunne","Tyler Bate","Trent Seven","Wolfgang"],correct:1,fact:"Tyler Bate won the inaugural UK Championship tournament.",source:"https://www.wwe.com/shows/wwe-united-kingdom-championship-tournament/2017"},
  {q:"Who did Tyler Bate defeat in the inaugural UK title final?",a:["Pete Dunne","Mark Andrews","Wolfgang","Joseph Conners"],correct:0,fact:"Tyler Bate beat Pete Dunne in the first UK title final.",source:"https://www.wwe.com/shows/wwe-united-kingdom-championship-tournament/2017"},
  {q:"Where was the first WWE United Kingdom Championship tournament held?",a:["Liverpool","Blackpool","Leeds","Bristol"],correct:1,fact:"The inaugural tournament took place in Blackpool.",source:"https://www.wwe.com/shows/wwe-united-kingdom-championship-tournament/2017"},
  {q:"Who won the UK title from Tyler Bate at TakeOver Chicago in 2017?",a:["Trent Seven","Wolfgang","Pete Dunne","Mark Andrews"],correct:2,fact:"Pete Dunne defeated Tyler Bate in Chicago.",source:"https://www.wwe.com/shows/wwenxt/nxt-takeover-chicago-2017-05-20/article/wwe-united-kingdom-championship-pete-dunne"},
  {q:"What nickname is associated with Pete Dunne?",a:["The Bruiserweight","The Hitman","The Dynamite Kid","The Villain"],correct:0,fact:"Pete Dunne is known as The Bruiserweight.",source:"https://www.wwe.com/shows/wwe-united-kingdom-championship-tournament/2017"},
  {q:"Which famous British wrestler was known for his technical lightweight style?",a:["Big Daddy","Johnny Saint","Giant Haystacks","Mick McManus"],correct:1,fact:"Johnny Saint was celebrated for brilliant lightweight wrestling.",source:"https://wrestlingheritage.co.uk/johnny-saint/"},
  {q:"Which promotion signed Johnny Saint in the early 1980s?",a:["Joint Promotions","Wrestling Enterprises","WCW","TNA"],correct:1,fact:"Johnny Saint joined Brian Dixon's Wrestling Enterprises.",source:"https://wrestlingheritage.co.uk/a-year-of-wrestling-1982/"},
  {q:"Which British wrestler's feud with Tiger Mask continued in Japan?",a:["Mark Rocco","Mick McManus","Jim Breaks","Giant Haystacks"],correct:0,fact:"Rocco and Tiger Mask clashed in Japan as Black Tiger and Tiger Mask.",source:"https://wrestlingheritage.co.uk/a-year-of-wrestling-1981/"},
  {q:"Which wrestler was billed as the son of Jackie Pallo?",a:["Mick McManus Jr","Jackie Pallo Jr","Johnny Saint Jr","Bert Royal Jr"],correct:1,fact:"Jackie Pallo Junior followed his father into wrestling.",source:"https://wrestlingheritage.co.uk/jackie-pallo-jr/"},
  {q:"Which British wrestler was renowned for mock tantrums in the ring?",a:["Jim Breaks","Johnny Saint","Billy Robinson","Davey Boy Smith"],correct:0,fact:"Jim Breaks was famous for his tantrums and crowd work.",source:"https://wrestlingheritage.co.uk/jim-breaks/"},
  {q:"Who was the champion Johnny Saint followed after George Kidd retired?",a:["Jim Breaks","George Kidd","Tony St Clair","Mark Rocco"],correct:1,fact:"Saint followed George Kidd as a world lightweight champion.",source:"https://wrestlingheritage.co.uk/a-year-of-wrestling-1976/"},
  {q:"In which year did Pete Dunne first win the WWE UK Championship?",a:["2015","2016","2017","2019"],correct:2,fact:"Pete Dunne won the title at TakeOver Chicago in 2017.",source:"https://www.wwe.com/shows/wwenxt/nxt-takeover-chicago-2017-05-20/article/wwe-united-kingdom-championship-pete-dunne"},
  {q:"Which city hosted the 2017 NXT TakeOver where Pete Dunne won the UK title?",a:["Cardiff","Chicago","Toronto","Orlando"],correct:1,fact:"Pete Dunne won the UK title at NXT TakeOver: Chicago.",source:"https://www.wwe.com/shows/wwenxt/nxt-takeover-chicago-2017-05-20/article/wwe-united-kingdom-championship-pete-dunne"},
  {"q":"Which wrestler performed as Kendo Nagasaki?","a":["Peter Thornley","George Kidd","Wayne Bridges","Pat Roach"],"correct":0,"fact":"Peter Thornley was the original Kendo Nagasaki.","source":"https://wrestlingheritage.co.uk/kendo-nagasaki/"},
  {"q":"Who first exposed Kendo Nagasaki's face on British TV?","a":["Big Daddy","Billy Howes","Mick McManus","Mark Rocco"],"correct":1,"fact":"Billy Howes unmasked Nagasaki in a televised 1971 bout.","source":"https://wrestlingheritage.co.uk/kendo-nagasaki/"},
  {"q":"In which year did Kendo Nagasaki voluntarily unmask on TV?","a":["1969","1983","1977","1992"],"correct":2,"fact":"His famous voluntary unmasking ceremony took place in 1977.","source":"https://wrestlingheritage.co.uk/a-year-of-wrestling-1977/"},
  {"q":"Which British grappler portrayed Bomber in Auf Wiedersehen, Pet?","a":["Les Kellett","Steve Logan","Tony St Clair","Pat Roach"],"correct":3,"fact":"Pat Roach played Brian 'Bomber' Busbridge.","source":"https://wrestlingheritage.co.uk/pat-roach/"},
  {"q":"Which wrestler was known as the Birmingham Bomber?","a":["Pat Roach","Johnny Saint","Jim Breaks","Mark Rocco"],"correct":0,"fact":"Pat Roach carried the Birmingham Bomber nickname.","source":"https://wrestlingheritage.co.uk/evolution-of-tvs-finest/"},
  {"q":"What was Big Daddy's villainous earlier nickname?","a":["Masked Marauder","Blond Bombshell","Iron Duke","Black Tiger"],"correct":1,"fact":"Before becoming a hero, Big Daddy wrestled as the Blond Bombshell.","source":"https://wrestlingheritage.co.uk/a-year-of-wrestling-1977/"},
  {"q":"Which wrestler was called Mums and Dads' Favourite?","a":["Giant Haystacks","Dave Finlay","Big Daddy","Steve Grey"],"correct":2,"fact":"Big Daddy became a family-friendly crowd favourite.","source":"https://wrestlingheritage.co.uk/a-year-of-wrestling-1977/"},
  {"q":"Which promoter was Big Daddy's brother?","a":["Brian Dixon","Dale Martin","Paul Lincoln","Max Crabtree"],"correct":3,"fact":"Max Crabtree was Shirley Crabtree's brother.","source":"https://wrestlingheritage.co.uk/shirley-crabtree/"},
  {"q":"What Welsh town was Adrian Street from?","a":["Brynmawr","Cardiff","Swansea","Aberystwyth"],"correct":0,"fact":"Adrian Street grew up in Brynmawr, Wales.","source":"https://wrestlingheritage.co.uk/adrian-street/"},
  {"q":"Which wrestler was dubbed The Exotic One?","a":["Johnny Saint","Adrian Street","Kendo Nagasaki","Jim Breaks"],"correct":1,"fact":"Adrian Street was famed for his flamboyant 'Exotic' persona.","source":"https://wrestlingheritage.co.uk/adrian-street/"},
  {"q":"What earlier nickname did Adrian Street use?","a":["The Hitman","Rollerball","Nature Boy","The Bruiserweight"],"correct":2,"fact":"Adrian Street was billed as 'Nature Boy' early in his career.","source":"https://wrestlingheritage.co.uk/adrian-street/"},
  {"q":"Who was associated with comic wrestling and slapstick?","a":["Billy Robinson","Dynamite Kid","Johnny Saint","Les Kellett"],"correct":3,"fact":"Les Kellett was famous for physical comedy in the ring.","source":"https://wrestlingheritage.co.uk/les-kellett/"},
  {"q":"Which famed lightweight was renowned for technical skill?","a":["George Kidd","Big Daddy","Giant Haystacks","King Kong Kirk"],"correct":0,"fact":"George Kidd was renowned for technical lightweight wrestling.","source":"https://wrestlingheritage.co.uk/george-kidd/"},
  {"q":"Which French wrestler appeared in Britain before becoming Andre the Giant?","a":["Jean Ferre","Rene Lasartesse","Luc Bejar","Andre Bollet"],"correct":0,"fact":"Jean Ferre later achieved global fame as Andre the Giant.","source":"https://wrestlingheritage.co.uk/a-year-of-wrestling-1969/"},
  {"q":"Who wore an elaborate samurai-inspired masked gimmick?","a":["Bobby Barnes","Mick McManus","Kendo Nagasaki","Bert Royal"],"correct":2,"fact":"Kendo Nagasaki was presented as a mysterious masked samurai.","source":"https://wrestlingheritage.co.uk/kendo-nagasaki/"},
  {"q":"What role did Brian Dixon first work in wrestling?","a":["Commentator","Timekeeper","Ring doctor","Referee"],"correct":3,"fact":"Brian Dixon began his wrestling career as a referee.","source":"https://www.postwrestling.com/2023/05/28/uk-wrestling-promoter-brian-dixon-passes-away/"},
  {"q":"Which real dog accompanied the British Bulldogs?","a":["Matilda","Winston","Rover","Spot"],"correct":0,"fact":"Matilda was the British Bulldogs' mascot.","source":"https://www.wwe.com/superstars/britishbulldog"},
  {"q":"At WrestleMania 2, who lost the tag titles to the Bulldogs?","a":["The Hart Foundation","Valentine and Beefcake","Demolition","The Rockers"],"correct":1,"fact":"The Bulldogs defeated Greg Valentine and Brutus Beefcake.","source":"https://www.wwe.com/superstars/britishbulldog"},
  {"q":"In which Canadian territory did the British Bulldogs compete?","a":["Montreal Grand Prix","Maple Leaf Wrestling","Stampede Wrestling","World Class"],"correct":2,"fact":"Davey Boy Smith and Dynamite Kid competed in Calgary's Stampede Wrestling.","source":"https://www.wwe.com/superstars/britishbulldog"},
  {"q":"Which wrestling patriarch welcomed the Bulldogs to Calgary?","a":["Verne Gagne","Vince McMahon","Fritz Von Erich","Stu Hart"],"correct":3,"fact":"Stu Hart brought the pair to Stampede Wrestling.","source":"https://www.wwe.com/superstars/britishbulldog"},
  {"q":"Which classic team included Bret Hart and Jim Neidhart?","a":["Hart Foundation","Demolition","The Rockers","British Strong Style"],"correct":0,"fact":"Bret Hart and Jim Neidhart were the Hart Foundation.","source":"https://www.wwe.com/article/dynamite-kid-passes-away"},
  {"q":"Who formed the British tag team Moustache Mountain?","a":["Pete Dunne and Mark Andrews","Tyler Bate and Trent Seven","Zack Gibson and James Drake","Dunne and Bate"],"correct":1,"fact":"Moustache Mountain was Bate and Seven.","source":"https://www.wwe.com/shows/wwe-united-kingdom-championship-tournament/2018"},
  {"q":"Who is nicknamed the Big Strong Boi?","a":["Pete Dunne","Trent Seven","Tyler Bate","Joe Coffey"],"correct":2,"fact":"Tyler Bate uses the Big Strong Boi nickname.","source":"https://www.wwe.com/superstars/tyler-bate"},
  {"q":"Which trio wrestled as British Strong Style?","a":["Regal, Finlay and Barrett","Hart, Smith and Neidhart","Drake, Gibson and Wolfgang","Dunne, Bate and Seven"],"correct":3,"fact":"Pete Dunne, Tyler Bate and Trent Seven teamed as British Strong Style.","source":"https://www.wwe.com/shows/nxtuk/2019-6-12/article/british-strong-style-vs-imperium"},
  {"q":"Which team beat Moustache Mountain for the first NXT UK tag titles?","a":["Grizzled Young Veterans","The Hunt","Gallus","Imperium"],"correct":0,"fact":"Zack Gibson and James Drake won the inaugural UK tag titles.","source":"https://www.wwe.com/shows/nxtuk/nxt-uk-takeover-blackpool-2019"},
  {"q":"Who made up the Grizzled Young Veterans?","a":["Bate and Seven","Gibson and Drake","Coffey and Wolfgang","Aichner and Barthel"],"correct":1,"fact":"Zack Gibson and James Drake formed the Grizzled Young Veterans.","source":"https://www.wwe.com/shows/nxtuk/nxt-uk-takeover-blackpool-2019"},
  {"q":"Which NXT UK star called himself Liverpool's Number One?","a":["James Drake","Trent Seven","Zack Gibson","Tyler Bate"],"correct":2,"fact":"Zack Gibson used the Liverpool's Number One nickname.","source":"https://www.wwe.com/shows/nxtuk/nxt-uk-takeover-blackpool-2019"},
  {"q":"Who were the classic British tag team The Royals?","a":["Street and Barnes","Daddy and Haystacks","Saint and Grey","Bert Royal and Vic Faulkner"],"correct":3,"fact":"Brothers Bert Royal and Vic Faulkner were The Royals.","source":"https://wrestlingheritage.co.uk/top-tag-teams-top-3/"},
  {"q":"What was the relationship between Bert Royal and Vic Faulkner?","a":["Brothers","Father and son","Uncle and nephew","No family relation"],"correct":0,"fact":"Bert Royal and Vic Faulkner were brothers.","source":"https://wrestlingheritage.co.uk/tag-team-wrestling/"},
  {"q":"Which pair made up the original British Hells Angels team?","a":["Mick McManus and Steve Logan","Adrian Street and Bobby Barnes","The Royals","The Bulldogs"],"correct":1,"fact":"Adrian Street and Bobby Barnes teamed as the Hells Angels.","source":"https://wrestlingheritage.co.uk/a-year-of-wrestling-1965/"},
  {"q":"Which three wrestlers represented the NXT UK group Gallus?","a":["Dunne, Seven and Bate","Bate, Mastiff and Dragunov","Joe, Mark Coffey and Wolfgang","Aichner, Barthel and WALTER"],"correct":2,"fact":"Gallus comprised Joe Coffey, Mark Coffey and Wolfgang.","source":"https://www.wwe.com/shows/nxtuk/2019-6-19/article/mark-coffey-wolfgang-the-hunt"},
  {"q":"Who was British Bulldog's tag partner for another 1996 title win?","a":["Kane","Steve Austin","X-Pac","Owen Hart"],"correct":3,"fact":"The British Bulldog partnered Owen Hart for a 1996 tag reign.","source":"https://www.wwe.com/superstars/britishbulldog"},
  {"q":"Which trio opposed British Strong Style as Imperium in 2019?","a":["WALTER, Aichner and Barthel","Coffey, Coffey and Wolfgang","Gibson, Drake and Dunne","Bate, Seven and Andrews"],"correct":0,"fact":"WALTER, Fabian Aichner and Marcel Barthel formed Imperium.","source":"https://www.wwe.com/shows/nxtuk/2019-6-12/article/british-strong-style-vs-imperium"},
  {"q":"Which tag team won the NXT titles at London's Royal Albert Hall in 2018?","a":["Gallus","Moustache Mountain","The Revival","The Bar"],"correct":1,"fact":"Bate and Seven defeated the Undisputed ERA at Royal Albert Hall.","source":"https://www.wwe.com/shows/wwe-united-kingdom-championship-tournament/nxt-uk-championship/article/moustache-mountain-def"},
  {"q":"Who were Moustache Mountain's opponents at that 2018 title win?","a":["The Usos","Gibson and Drake","Kyle O'Reilly and Roderick Strong","The Authors of Pain"],"correct":2,"fact":"Bate and Seven beat O'Reilly and Strong.","source":"https://www.wwe.com/shows/wwe-united-kingdom-championship-tournament/nxt-uk-championship/article/moustache-mountain-def"},
  {"q":"Who beat Moustache Mountain to regain the NXT tag titles in 2018?","a":["Gallus","British Bulldogs","The Hunt","Undisputed ERA"],"correct":3,"fact":"O'Reilly and Strong won back the NXT tag championship.","source":"https://www.wwe.com/shows/wwenxt/2018-07-11/article/undisputed-era-def-moustache-mountain-nxt-tag-team-titles"},
  {"q":"At which WrestleMania did the British Bulldogs first win WWF tag gold?","a":["WrestleMania 3","WrestleMania 4","WrestleMania 2","WrestleMania 1"],"correct":2,"fact":"The British Bulldogs won the WWF tag titles at WrestleMania 2.","source":"https://www.wwe.com/superstars/britishbulldog"},
  {"q":"Which British wrestler had the adopted ring persona of the King of the Cruiserweights?","a":["Wade Barrett","Neville","Pete Dunne","Tyler Bate"],"correct":1,"fact":"Neville was called the King of the Cruiserweights.","source":"https://www.wwe.com/superstars/neville"},
  {"q":"Which wrestler used the Tyler Driver '97?","a":["Trent Seven","Zack Gibson","Tyler Bate","Pete Dunne"],"correct":2,"fact":"The Tyler Driver '97 was Tyler Bate's signature move.","source":"https://www.wwe.com/shows/nxtuk/2018-11-28-ep-02"},
  {"q":"Which wrestler's lariat was called the Seven Stars Lariat?","a":["WALTER","Noam Dar","Joe Coffey","Trent Seven"],"correct":3,"fact":"Trent Seven used the Seven Stars Lariat.","source":"https://www.wwe.com/shows/nxtuk/wwe-nxt-uk-feb-24-2022"},
  {"q":"In which London neighbourhood is the Electric Ballroom?","a":["Camden","Brixton","Islington","Chelsea"],"correct":0,"fact":"The Electric Ballroom, PROGRESS's home venue, is in Camden, London.","source":"https://progresswrestling.com/history-made-at-super-strong-style-16/"},
  {"q":"Which company uses numbered 'Chapter' events?","a":["New Japan","PROGRESS Wrestling","CMLL","WWE"],"correct":1,"fact":"PROGRESS names its shows with chapter numbers.","source":"https://progresswrestling.com/recap-a-memorable-2025-for-progress/"},
  {"q":"Which PROGRESS tournament is shortened to SSS16?","a":["Summer Slam Series 16","Six-Sided Showdown","Super Strong Style 16","Strong Style Showdown"],"correct":2,"fact":"SSS16 stands for Super Strong Style 16.","source":"https://progresswrestling.com/history-made-at-super-strong-style-16/"},
  {"q":"Which independent promotion is abbreviated ICW?","a":["International Catch Wrestling","Indie Championship World","Inter-City Wrestling","Insane Championship Wrestling"],"correct":3,"fact":"ICW stands for Insane Championship Wrestling.","source":"https://en.wikipedia.org/wiki/Insane_Championship_Wrestling"},
  {"q":"Which Scottish city was central to ICW's rise?","a":["Glasgow","Aberdeen","Dundee","Perth"],"correct":0,"fact":"ICW was founded and based in Glasgow.","source":"https://en.wikipedia.org/wiki/Insane_Championship_Wrestling"},
  {"q":"Which British group was a federation of promoters?","a":["British Strong Style","Joint Promotions","The Hart Foundation","The Royals"],"correct":1,"fact":"Joint Promotions was an alliance of British wrestling promoters.","source":"https://en.wikipedia.org/wiki/Joint_Promotions"},
  {"q":"Which British promotion is shortened to RevPro?","a":["Rebel Promotion","Royal Exhibition Pro","Revolution Pro Wrestling","Revival Wrestling"],"correct":2,"fact":"RevPro is Revolution Pro Wrestling.","source":"https://en.wikipedia.org/wiki/Revolution_Pro_Wrestling"},
  {"q":"Which British promotion stages the British J-Cup?","a":["All Star Wrestling","PROGRESS","WWE","Revolution Pro Wrestling"],"correct":3,"fact":"Revolution Pro Wrestling runs the British J-Cup.","source":"https://en.wikipedia.org/wiki/Revolution_Pro_Wrestling"},
  {"q":"Which move is a jumping kick using both feet?","a":["DDT","Dropkick","Piledriver","Chokeslam"],"correct":1,"fact":"A dropkick hits the opponent with both feet while airborne.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"Which submission entangles an opponent's legs in a figure four?","a":["Sleeper hold","Full nelson","Figure-four leglock","Crossface"],"correct":2,"fact":"A figure-four leglock uses the wrestler's legs to trap the opponent's.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"Which hold folds an opponent's legs back while they lie face down?","a":["Ankle lock","Octopus stretch","Armbar","Boston crab"],"correct":3,"fact":"The Boston crab bends the opponent's legs and back.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"What is the rear waist-lock suplex with a backward arch?","a":["German suplex","Vertical suplex","Fisherman suplex","Snapmare"],"correct":0,"fact":"A German suplex is performed from behind with a backward bridge.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"Which move drops a foe head-first from a front facelock?","a":["Dropkick","DDT","Splash","Powerslam"],"correct":1,"fact":"The DDT uses a front facelock to drive an opponent down.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"Which aerial move is a backward somersault onto an opponent?","a":["Splash","Diving elbow","Moonsault","Flying headbutt"],"correct":2,"fact":"A moonsault is a backward-flipping aerial attack.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"Which move flips an opponent with the wrestler's legs around their head?","a":["Lariat","Powerbomb","Chokeslam","Hurricanrana"],"correct":3,"fact":"A hurricanrana uses a jumping headscissors to flip a foe.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"What does a springboard move use to launch the wrestler?","a":["Ring ropes","Turnbuckle padding","Steel steps","Ringside barrier"],"correct":0,"fact":"A springboard uses the ropes as a launching point.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"What strike uses an extended arm against a running opponent?","a":["Forearm smash","Clothesline","Dropkick","Uppercut"],"correct":1,"fact":"A clothesline strikes with an outstretched arm.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"Which move is a snap kick to an opponent's chin?","a":["Leg drop","Spear","Superkick","Senton"],"correct":2,"fact":"A superkick is a thrusting kick generally aimed at the head.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"What body parts are most at risk from a piledriver?","a":["Hands and wrists","Shins and ankles","Shoulders and hips","Head and neck"],"correct":3,"fact":"A piledriver drives an opponent downward head-first.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"Which wrestling kick strikes the back of the opponent's head?","a":["Enzuigiri","Dropkick","Roundhouse to the ribs","Big boot"],"correct":0,"fact":"An enzuigiri is a kick targeting the back of the head.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"Which submission twists the opponent's foot and ankle?","a":["Sleeper hold","Ankle lock","Abdominal stretch","Camel clutch"],"correct":1,"fact":"An ankle lock applies pressure by twisting the foot and ankle.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"Which move is a dive through the ropes to the outside?","a":["Moonsault","Shooting star press","Suicide dive","Standing splash"],"correct":2,"fact":"A suicide dive sends a wrestler through the ropes to the floor.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"Which throw flips a foe over the attacker's hip?","a":["DDT","German suplex","Spinebuster","Hip toss"],"correct":3,"fact":"The hip toss uses a turn of the hips to throw the opponent.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"Which submission compresses an opponent's neck from behind?","a":["Sleeper hold","Figure-four","Boston crab","Kimura lock"],"correct":0,"fact":"A sleeper hold applies pressure around the neck.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_moves"},
  {"q":"What does kayfabe describe in wrestling?","a":["An accidental injury","Keeping the fiction real","A tag-team move","A last-minute cancellation"],"correct":1,"fact":"Kayfabe is the presentation of wrestling's fictional story as real.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What is a 'shoot' in pro wrestling?","a":["A championship defence","A match opening","Something unscripted","A referee signal"],"correct":2,"fact":"A shoot refers to genuine, unscripted action.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"In wrestling, who is the 'babyface'?","a":["The villain","The referee","The manager","The heroic character"],"correct":3,"fact":"Babyface or face means the sympathetic hero.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What does 'heel' mean in wrestling?","a":["Villain character","Heavyweight contender","Assistant referee","Technical grappler"],"correct":0,"fact":"A heel is a character presented as a villain.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What happens on a 'hot tag'?","a":["Both teams are disqualified","Fresh partner makes a comeback","A manager takes over","The referee stops the contest"],"correct":1,"fact":"A hot tag brings a fresh partner in for a surge of offence.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What is a 'squash' match?","a":["Two-out-of-three falls","A six-person tag","One-sided quick victory","A draw without time limit"],"correct":2,"fact":"A squash is a deliberately one-sided match.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What is a 'promo' in wrestling?","a":["A title belt","A rehearsal ring","A submission hold","A spoken segment"],"correct":3,"fact":"A promo is a speech or segment that develops characters or feuds.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What is a 'heel turn'?","a":["Hero becomes villain","Manager becomes referee","Wrestler changes weight class","Tag bout becomes singles"],"correct":0,"fact":"A heel turn changes a wrestler's character to a villain.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What does 'selling' a wrestling move mean?","a":["Selling tickets","Reacting as if hurt","Changing attire","Bribing an official"],"correct":1,"fact":"Selling makes an opponent's offence appear effective.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What is a 'no-sell'?","a":["Losing by countout","Skipping an entrance","Showing little reaction to a move","Refusing a booking"],"correct":2,"fact":"A no-sell portrays an attack as ineffective.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What does taking a 'bump' mean?","a":["Winning a belt","Starting a promo","Applying a headlock","Falling to sell a move"],"correct":3,"fact":"A bump is a fall taken in response to wrestling action.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What is a 'run-in'?","a":["Outsider interrupts the match","Wrestler runs the ropes","Referee enters the ring","Wrestler warms up"],"correct":0,"fact":"A run-in is interference by someone not in the bout.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What does it mean to 'put someone over'?","a":["Suspend a wrestler","Make another wrestler look strong","Change a venue","Switch promotions"],"correct":1,"fact":"Putting someone over helps elevate their standing with the crowd.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What is a 'job' in wrestling slang?","a":["A televised interview","A special entrance","A planned loss","A ring repair"],"correct":2,"fact":"A wrestler doing a job loses to help establish another.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What is a 'spot' in a wrestling match?","a":["A disqualification","A title contract","A dressing room","Planned action or sequence"],"correct":3,"fact":"A spot is a planned action or sequence in a match.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What does a 'double turn' involve?","a":["Two wrestlers switch alignments","Two title changes","Two referees","Two simultaneous countouts"],"correct":0,"fact":"A double turn changes a face into a heel and vice versa.","source":"https://en.wikipedia.org/wiki/Glossary_of_professional_wrestling_terms"},
  {"q":"What does 'best two out of three falls' require?","a":["Win three pins","Win two falls","One knockout only","A full hour"],"correct":1,"fact":"The first wrestler to score two falls wins.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"In an Iron Man match, what decides the winner?","a":["First pinfall","A ladder retrieval","Most falls within time","Leaving the cage"],"correct":2,"fact":"An Iron Man match scores falls across a fixed time period.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"How many wrestlers take part in a Triple Threat match?","a":["Two","Four","Six","Three"],"correct":3,"fact":"Triple Threat is a match involving three competitors.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"How many wrestlers take part in a Fatal Four-Way?","a":["Four","Three","Six","Eight"],"correct":0,"fact":"A Fatal Four-Way involves four wrestlers.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"What is the goal of most battle royals?","a":["Score most falls in an hour","Be the last remaining","Escape a cage","Retrieve a belt"],"correct":1,"fact":"Battle royals usually end when only one competitor remains.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"What eliminates someone in the WWE Royal Rumble?","a":["Any touch of the floor","A one-count","Over the top rope, both feet down","Leaving through the cage door"],"correct":2,"fact":"A Royal Rumble elimination requires both feet on the floor after going over the top rope.","source":"https://www.wwe.com/shows/royalrumble"},
  {"q":"What does a No Disqualification stipulation remove?","a":["Pinfall victories","Entrances","The referee","Disqualification as a finish"],"correct":3,"fact":"A No Disqualification match generally cannot end via disqualification.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"Where can falls count in a Falls Count Anywhere match?","a":["Outside the ring too","Only at ringside","Only inside a cage","Only in a corner"],"correct":0,"fact":"Falls Count Anywhere allows pinfalls outside the ring.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"How is a ladder match typically won?","a":["Scoring three pinfalls","Retrieving an object above ring","Throwing opponent outside","Winning every round"],"correct":1,"fact":"A ladder match is usually won by retrieving a suspended prize.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"What usually wins a tables match?","a":["Making an opponent submit","First to climb a ladder","Putting foe through a table","Winning two falls"],"correct":2,"fact":"A tables match generally ends when an opponent goes through a table.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"What is the stake in a Hair vs Hair match?","a":["Winner cuts a promo","Loser loses a title","Winner changes name","Loser has their head shaved"],"correct":3,"fact":"The loser of a Hair vs Hair match has their hair cut.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"What surrounds the ring in a steel cage match?","a":["A mesh cage","A moat","A row of tables","Scaffolding only"],"correct":0,"fact":"A steel cage match encloses the ring in mesh walls.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"What must a wrestler say to lose an I Quit match?","a":["I submit","I quit","I surrender now","I concede the belt"],"correct":1,"fact":"An I Quit match ends when a wrestler verbally quits.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"Who surrounds the ring in a lumberjack match?","a":["Four referees","Only managers","Other wrestlers","The commentary team"],"correct":2,"fact":"Lumberjacks surround the ring and return escapees to it.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"How does a gauntlet match generally work?","a":["All opponents start at once","Only submissions count","No entrances take place","Opponents enter successively"],"correct":3,"fact":"Gauntlet bouts feature successive opponents.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"What defines a handicap wrestling match?","a":["Unequal numbers of wrestlers","No time limit","Only a champion competing","Two referees"],"correct":0,"fact":"A handicap match pits teams with unequal numbers against each other.","source":"https://en.wikipedia.org/wiki/Professional_wrestling_match_types"},
  {"q":"Which English city is WWE's Paige associated with?","a":["Blackpool","Preston","Norwich","Newcastle"],"correct":2,"fact":"Paige came from a wrestling family in Norwich.","source":"https://www.wwe.com/superstars/paige"},
  {"q":"What nickname did Paige use in WWE's women's division?","a":["The Empress","The Man","The Queen","The Anti-Diva"],"correct":3,"fact":"Paige was billed as the Anti-Diva.","source":"https://www.wwe.com/superstars/paige"},
  {"q":"Whom did Paige defeat to win the Divas title in 2014?","a":["AJ Lee","Charlotte Flair","Lita","Beth Phoenix"],"correct":0,"fact":"Paige shocked AJ Lee to win the Divas Championship.","source":"https://www.wwe.com/classics/titlehistory/divas"},
  {"q":"What was the ring name of Paige's wrestling mother?","a":["Luna Vachon","Sweet Saraya","Molly Holly","Ivory"],"correct":1,"fact":"Paige's mother was known as Sweet Saraya.","source":"https://en.wikipedia.org/wiki/Saraya_Knight"},
  {"q":"Who was the very first NXT UK Women's Champion?","a":["Toni Storm","Kay Lee Ray","Rhea Ripley","Meiko Satomura"],"correct":2,"fact":"Rhea Ripley won the inaugural tournament.","source":"https://www.wwe.com/shows/nxtuk/2018-11-28-ep-02"},
  {"q":"Who took the NXT UK Women's title from Rhea Ripley?","a":["Paige","Nikki Cross","Jinny","Toni Storm"],"correct":3,"fact":"Toni Storm beat Ripley at NXT UK TakeOver: Blackpool.","source":"https://www.wwe.com/superstars/toni-storm"},
  {"q":"Who won the 2018 Mae Young Classic tournament?","a":["Toni Storm","Kairi Sane","Shayna Baszler","Rhea Ripley"],"correct":0,"fact":"Toni Storm won the 2018 Mae Young Classic.","source":"https://www.wwe.com/superstars/toni-storm"},
  {"q":"Who did Toni Storm beat in the 2018 Mae Young Classic final?","a":["Dakota Kai","Io Shirai","Tegan Nox","Bianca Belair"],"correct":1,"fact":"Storm defeated Io Shirai in the final.","source":"https://www.wwe.com/superstars/toni-storm"},
  {"q":"Who took Toni Storm's NXT UK title at TakeOver Cardiff?","a":["Rhea Ripley","Piper Niven","Kay Lee Ray","Xia Brookside"],"correct":2,"fact":"Kay Lee Ray defeated Storm at TakeOver: Cardiff.","source":"https://www.wwe.com/shows/nxtuk/nxt-uk-takeover-cardiff-2019/article/toni-storm-vs-kay-lee-ray-results"},
  {"q":"Who ended Kay Lee Ray's NXT UK title reign?","a":["Jinny","Becky Lynch","Blair Davenport","Meiko Satomura"],"correct":3,"fact":"Meiko Satomura defeated Ray in June 2021.","source":"https://www.wwe.com/shows/nxtuk/wwe-nxt-uk-june-10-2021"},
  {"q":"Which Scottish champion was nicknamed the Scary Queen of Scots?","a":["Kay Lee Ray","Piper Niven","Isla Dawn","Nikki Cross"],"correct":0,"fact":"Kay Lee Ray was dubbed the Scary Queen of Scots.","source":"https://www.wwe.com/shows/nxtuk/article/wwe-nxt-uk-results-june-10-2021"},
  {"q":"What later WWE ring name did Kay Lee Ray adopt?","a":["Nikki A.S.H.","Alba Fyre","Doudrop","Tegan Nox"],"correct":1,"fact":"Kay Lee Ray later wrestled as Alba Fyre.","source":"https://en.wikipedia.org/wiki/Alba_Fyre"},
  {"q":"Which Scottish wrestler appeared in WWE as Doudrop?","a":["Nikki Cross","Kay Lee Ray","Piper Niven","Isla Dawn"],"correct":2,"fact":"Piper Niven used the WWE name Doudrop.","source":"https://en.wikipedia.org/wiki/Piper_Niven"},
  {"q":"Which Welsh wrestler used 'The Girl with the Shiniest Wizard'?","a":["Xia Brookside","Becky Lynch","Nina Samuels","Tegan Nox"],"correct":3,"fact":"Tegan Nox was known as The Girl with the Shiniest Wizard.","source":"https://www.wwe.com/section/mae-young-classic-competitors/article/tegan-nox"},
  {"q":"What wrestling move inspired Tegan Nox's Shiniest Wizard nickname?","a":["Shining Wizard knee","Moonsault","Spear","Powerbomb"],"correct":0,"fact":"Tegan Nox used a Shining Wizard knee strike.","source":"https://www.wwe.com/section/mae-young-classic-competitors/article/tegan-nox"},
  {"q":"Which NXT UK wrestler is Robbie Brookside's daughter?","a":["Toni Storm","Xia Brookside","Jinny","Isla Dawn"],"correct":1,"fact":"Xia Brookside is the daughter of British wrestler Robbie Brookside.","source":"https://www.wwe.com/section/mae-young-classic-competitors/article/xia-brookside"},
  {"q":"What does Nikki A.S.H. stand for?","a":["Always Super Heroic","Another Scottish Hero","Almost a Superhero","Absolute Super Hero"],"correct":2,"fact":"Nikki A.S.H. meant Nikki Almost a Superhero.","source":"https://www.wwe.com/shows/raw/article/nikki-ash-raw-womens-title-reign"},
  {"q":"Who won the women's Money in the Bank match in 2021?","a":["Charlotte Flair","Rhea Ripley","Asuka","Nikki A.S.H."],"correct":3,"fact":"Nikki A.S.H. won the 2021 ladder match.","source":"https://www.wwe.com/shows/moneyinthebank/article/wwe-money-in-the-bank-match-results"},
  {"q":"Which title did Nikki A.S.H. cash in for in July 2021?","a":["Raw Women's title","NXT UK Women's title","Women's Tag title","NXT Women's title"],"correct":0,"fact":"Nikki cashed in to become Raw Women's Champion.","source":"https://www.wwe.com/shows/raw/2021-07-19"},
  {"q":"Which wrestler was called the Mosh Pit Kid?","a":["Toni Storm","Rhea Ripley","Paige","Meiko Satomura"],"correct":1,"fact":"Rhea Ripley used the Mosh Pit Kid nickname.","source":"https://www.wwe.com/superstars/rhea-ripley"},
  {"q":"Who won the first women's Super Strong Style 16 tournament?","a":["Jinny","Alexxis Falcon","Rhio","Toni Storm"],"correct":2,"fact":"Rhio won the inaugural women's SSS16 tournament in 2026.","source":"https://progresswrestling.com/history-made-at-super-strong-style-16/"},
  {"q":"Which British wrestler won the 2019 Women's Royal Rumble?","a":["Paige","Nikki Cross","Tegan Nox","Becky Lynch"],"correct":3,"fact":"Irish star Becky Lynch won the 2019 Women's Royal Rumble.","source":"https://www.wwe.com/shows/royalrumble/2019"},
  {"q":"Which Irish star is nicknamed 'The Man'?","a":["Becky Lynch","Finn Balor","Sheamus","JD McDonagh"],"correct":0,"fact":"Becky Lynch uses the nickname The Man.","source":"https://www.wwe.com/superstars/becky-lynch"},
  {"q":"Which NXT UK wrestler used the 'Broken Wings' finishing move?","a":["Toni Storm","Kay Lee Ray","Xia Brookside","Piper Niven"],"correct":2,"fact":"Xia Brookside used Broken Wings to defeat Amale in 2020.","source":"https://www.wwe.com/shows/nxtuk/wwe-nxt-uk-april-2-2020"},
  {"q":"Who won the men's 2020 Royal Rumble match?","a":["Brock Lesnar","Roman Reigns","Drew McIntyre","Seth Rollins"],"correct":2,"fact":"Drew McIntyre won the 2020 Men's Royal Rumble.","source":"https://www.wwe.com/shows/royalrumble/2020/article/royal-rumble-2020-results"},
  {"q":"Whom did Drew McIntyre eliminate in the 2020 Rumble?","a":["The Undertaker","CM Punk","The Rock","Brock Lesnar"],"correct":3,"fact":"McIntyre eliminated Brock Lesnar from the 2020 Royal Rumble.","source":"https://www.wwe.com/article/the-five-coolest-moments-of-the-2020-royal-rumble-matches"},
  {"q":"Who lost the WWE title to Drew McIntyre at WrestleMania 36?","a":["Brock Lesnar","Kofi Kingston","Seth Rollins","Randy Orton"],"correct":0,"fact":"McIntyre defeated Brock Lesnar for the WWE title.","source":"https://www.wwe.com/superstars/drew-mcintyre"},
  {"q":"What is the name of Drew McIntyre's signature running kick?","a":["Brogue Kick","Claymore","Red Arrow","Bull Hammer"],"correct":1,"fact":"McIntyre uses the Claymore Kick.","source":"https://www.wwe.com/superstars/drew-mcintyre"},
  {"q":"Which Preston-born star won the first season of WWE NXT?","a":["William Regal","Drew McIntyre","Wade Barrett","Neville"],"correct":2,"fact":"Wade Barrett won the first season of NXT.","source":"https://www.wwe.com/superstars/wade-barrett"},
  {"q":"Which renegade WWE faction was initially led by Wade Barrett?","a":["The Shield","Evolution","The Corre","The Nexus"],"correct":3,"fact":"Wade Barrett initially led the Nexus.","source":"https://www.wwe.com/shows/raw/groups-who-changed-wwe"},
  {"q":"What was Bad News Barrett's elbow finisher called?","a":["Bull Hammer","Brogue Kick","Five Knuckle Shuffle","Running Knee"],"correct":0,"fact":"Barrett's signature knockout elbow was the Bull Hammer.","source":"https://www.wwe.com/inside/what-moves-do-superstars-wish-they-could-do"},
  {"q":"Which former WWE star known as Neville is from Newcastle?","a":["Finn Balor","PAC","Sheamus","Pete Dunne"],"correct":1,"fact":"Neville, later known as PAC, hails from Newcastle.","source":"https://www.wwe.com/superstars/neville"},
  {"q":"What aerial finisher was associated with WWE's Neville?","a":["Shooting Star Press","Swanton Bomb","Red Arrow","Frog Splash"],"correct":2,"fact":"Neville's signature aerial move was the Red Arrow.","source":"https://www.wwe.com/superstars/neville"},
  {"q":"Who won WWE's King of the Ring tournament in 2008?","a":["Wade Barrett","Sheamus","King Booker","William Regal"],"correct":3,"fact":"William Regal won the 2008 King of the Ring.","source":"https://www.wwe.com/superstars/william-regal"},
  {"q":"Which British wrestler used the Power of the Punch gimmick?","a":["William Regal","Drew McIntyre","Neville","Pete Dunne"],"correct":0,"fact":"William Regal used a loaded-punch gimmick called Power of the Punch.","source":"https://www.wwe.com/shows/raw/archive/08062007/articles/regalnewgm"},
  {"q":"Who became the first WWE European Champion?","a":["William Regal","British Bulldog","Owen Hart","D'Lo Brown"],"correct":1,"fact":"The British Bulldog was the inaugural European Champion.","source":"https://www.wwe.com/classics/the-legacy-of-european-title"},
  {"q":"Which Irish wrestler was the first WWE Universal Champion?","a":["Sheamus","Becky Lynch","Finn Balor","Jordan Devlin"],"correct":2,"fact":"Finn Balor won the first WWE Universal Championship.","source":"https://www.wwe.com/superstars/finn-balor"},
  {"q":"What Japanese ring name did Finn Balor use before WWE?","a":["Tiger Mask","Black Tiger","Fuji Yamada","Prince Devitt"],"correct":3,"fact":"Finn Balor worked in Japan as Prince Devitt.","source":"https://en.wikipedia.org/wiki/Finn_B%C3%A1lor"},
  {"q":"Which influential New Japan faction did Prince Devitt establish?","a":["Bullet Club","Chaos","Los Ingobernables","Suzuki-gun"],"correct":0,"fact":"Prince Devitt was a founding leader of Bullet Club.","source":"https://en.wikipedia.org/wiki/Bullet_Club"},
  {"q":"Who won the 2012 Men's Royal Rumble match?","a":["Drew McIntyre","Sheamus","John Cena","Randy Orton"],"correct":1,"fact":"Sheamus won the Royal Rumble in 2012.","source":"https://www.wwe.com/superstars/sheamus"},
  {"q":"Which kick is Sheamus's best-known finisher?","a":["Claymore","Superkick","Brogue Kick","Kinshasa"],"correct":2,"fact":"Sheamus uses the Brogue Kick.","source":"https://www.wwe.com/superstars/sheamus"},
  {"q":"Which Irish star won Money in the Bank in 2015?","a":["Finn Balor","Becky Lynch","JD McDonagh","Sheamus"],"correct":3,"fact":"Sheamus won the 2015 Money in the Bank ladder match.","source":"https://www.wwe.com/superstars/sheamus"},
  {"q":"Which British high flyer was nicknamed the Aerial Assassin?","a":["Will Ospreay","Zack Sabre Jr","Pete Dunne","Neville"],"correct":0,"fact":"Will Ospreay was nicknamed the Aerial Assassin.","source":"https://en.wikipedia.org/wiki/Will_Ospreay"},
  {"q":"Whose finishing strike is called the Hidden Blade?","a":["Zack Sabre Jr","Will Ospreay","Drew McIntyre","Wade Barrett"],"correct":1,"fact":"Will Ospreay uses the Hidden Blade elbow strike.","source":"https://en.wikipedia.org/wiki/Will_Ospreay"},
  {"q":"Which British technical wrestler is abbreviated ZSJ?","a":["Zack Gibson","Steve Grey","Zack Sabre Jr","Johnny Saint"],"correct":2,"fact":"ZSJ is Zack Sabre Jr, famed for submission wrestling.","source":"https://en.wikipedia.org/wiki/Zack_Sabre_Jr."},
  {"q":"Who won the New Japan Cup in 2018?","a":["Will Ospreay","Finn Balor","Pete Dunne","Zack Sabre Jr"],"correct":3,"fact":"Zack Sabre Jr won the 2018 New Japan Cup.","source":"https://en.wikipedia.org/wiki/Zack_Sabre_Jr."},
  {"q":"Which Scottish wrestler became famous for 'I Believe in Joe Hendry'?","a":["Joe Hendry","Drew McIntyre","Noam Dar","Grado"],"correct":0,"fact":"Joe Hendry's entrance song repeats 'I Believe in Joe Hendry'.","source":"https://en.wikipedia.org/wiki/Joe_Hendry"},
  {"q":"Which former UK titleholder was also known in WWE as Butch?","a":["Tyler Bate","Pete Dunne","William Regal","Wade Barrett"],"correct":1,"fact":"Pete Dunne used the name Butch on WWE television.","source":"https://en.wikipedia.org/wiki/Pete_Dunne"}
 ];

 // Rotate without affecting career RNG or saved state. The question bank
 // has four 48-question subject groups, yielding 3 from each every week.
 // Across a 16-week season every factual question is used exactly once.
 const QUIZ_SIZE=12,QUIZ_WEEKS=16,QUIZ_GROUPS=4,QUESTIONS_PER_GROUP=48;
 let QUIZ_QUESTIONS=QUIZ_POOL.slice(0,QUIZ_SIZE);
 let quizWeekKey='';
 function shuffleQuiz(values,seed){
  seed=(seed||0x1ab3aef1)>>>0;
  for(let i=values.length-1;i>0;i--){
   seed^=seed<<13;seed^=seed>>>17;seed^=seed<<5;
   const j=(seed>>>0)%(i+1);
   [values[i],values[j]]=[values[j],values[i]];
  }
  return values;
 }
 function syncQuizWeek(s){
  const season=Math.max(1,Math.trunc(Number(s?.season)||1));
  const week=Math.max(1,Math.trunc(Number(s?.week)||1));
  const key=season+':'+week;
  if(key===quizWeekKey)return;
  quizWeekKey=key;
  const cycle=Math.floor((week-1)/QUIZ_WEEKS),slot=(week-1)%QUIZ_WEEKS;
  const selected=[];
  for(let group=0;group<QUIZ_GROUPS;group++){
   const seed=(Math.imul(season,0x9e3779b1)^
    Math.imul(cycle+1,0x85ebca6b)^Math.imul(group+1,0x27d4eb2d))>>>0;
   const deck=QUIZ_POOL.slice(group*QUESTIONS_PER_GROUP,(group+1)*QUESTIONS_PER_GROUP);
   shuffleQuiz(deck,seed);
   selected.push(...deck.slice(slot*3,(slot+1)*3));
  }
  QUIZ_QUESTIONS=shuffleQuiz(selected,(Math.imul(season,0x51ed270b)^
   Math.imul(week,0x7feb352d))>>>0);
  quizReset();
 }
 const quizState={stage:'intro',index:0,checkpoint:0,misses:0,reveal:false};
 const QUIZ_COLOURS=['red','green','yellow','cyan'];
 function quizReset(){
  quizState.stage='intro';quizState.index=0;quizState.checkpoint=0;
  quizState.misses=0;quizState.reveal=false;
 }
 function quizInfo(){
  return {stage:quizState.stage,index:quizState.index,checkpoint:quizState.checkpoint,
   misses:quizState.misses,total:QUIZ_QUESTIONS.length,reveal:quizState.reveal};
 }
 function quizFooter(){
  const f=(colour,tag,action,value)=>({colour,text:tag.padEnd(10,' ').slice(0,10),action,value});
  if(quizState.stage==='question')return QUIZ_COLOURS.map((colour,i)=>
   f(colour,['RED A','GRN B','YEL C','CYN D'][i],'quiz-answer',i));
  if(quizState.stage==='wrong')return [
   f('red','RED RETRY','quiz-retry'),f('green','GRN REVEAL','quiz-reveal'),
   f('yellow','YEL INDEX','go',100),f('cyan','CYN RETRY','quiz-retry')
  ];
  if(quizState.stage==='rules')return [
   f('red','RED START','quiz-start'),f('green','GRN BACK','quiz-back'),
   f('yellow','YEL INDEX','go',100),f('cyan','CYN START','quiz-start')
  ];
  if(quizState.stage==='won')return [
   f('red','RED AGAIN','quiz-start'),f('green','GRN RULES','quiz-rules'),
   f('yellow','YEL INDEX','go',100),f('cyan','CYN AGAIN','quiz-start')
  ];
  return [
   f('red','RED START','quiz-start'),f('green','GRN RULES','quiz-rules'),
   f('yellow','YEL INDEX','go',100),f('cyan','CYN START','quiz-start')
  ];
 }
 function quizPage(){
  const l=[item(' RINGFAX QUIZ: UK WRESTLING','yellow'),item('')];
  if(quizState.stage==='intro'){
   paragraphs(l,'THE WRESTLING QUIZ CHALLENGE!','green');
   l.push(item(''));
   paragraphs(l,'12 QUESTIONS. FOUR COLOUR BUTTONS.');
   paragraphs(l,'ONE CHANCE TO BE THE CHAMPION.');
   l.push(item(''));
   paragraphs(l,'A WRONG ANSWER SENDS YOU TO THE SIN BIN.','cyan');
   paragraphs(l,'CHECKPOINTS AFTER Q4 AND Q8.');
   l.push(item(''));
   paragraphs(l,'RED OR CYAN: START THE QUIZ','yellow');
  }else if(quizState.stage==='rules'){
   paragraphs(l,'RED, GREEN, YELLOW OR CYAN.','cyan');
   paragraphs(l,'CHOOSE ONE ANSWER PER QUESTION.');
   l.push(item(''));
   paragraphs(l,'WRONG ANSWER? A TRIVIA DETOUR.');
   paragraphs(l,'RETRY FROM THE LAST CHECKPOINT.');
   l.push(item(''));
   paragraphs(l,'NO MONEY. NO SAVES. JUST GLORY!','green');
   paragraphs(l,'TO PLAY, PRESS RED OR CYAN.');
  }else if(quizState.stage==='question'){
   const q=QUIZ_QUESTIONS[quizState.index];
   l.push(item(' QUESTION '+(quizState.index+1)+' / '+QUIZ_QUESTIONS.length,'cyan'));
   l.push(item(' ROUND '+(Math.floor(quizState.index/4)+1)+' OF 3','yellow'));
   l.push(item(''));
   paragraphs(l,q.q,'white');
   l.push(item(''));
   q.a.forEach((choice,i)=>{
    l.push({...item(' '+QUIZ_COLOURS[i].toUpperCase()+': '+choice,QUIZ_COLOURS[i]),answerIndex:i});
   });
   l.push(item(' PRESS A COLOUR TO ANSWER','yellow'));
  }else if(quizState.stage==='wrong'){
   const q=QUIZ_QUESTIONS[quizState.index];
   paragraphs(l,'YOU HAVE BEEN BODYSLAMMED!','red');
   l.push(item(''));
   paragraphs(l,'THAT WAS NOT THE RIGHT ANSWER.');
   paragraphs(l,'RETRY FROM QUESTION '+(quizState.checkpoint+1)+'.','cyan');
   l.push(item(''));
   paragraphs(l,'CORRECT: '+q.a[q.correct],'yellow');
   l.push(item(''));
   if(quizState.reveal)paragraphs(l,q.fact,'green');
   else paragraphs(l,'GREEN: REVEAL A TRIVIA FACT.');
   l.push(item(''));
   paragraphs(l,'RED OR CYAN: GET BACK IN THE RING');
  }else if(quizState.stage==='won'){
   paragraphs(l,'YOU ARE THE QUIZ CHAMPION!','yellow');
   l.push(item(''));
   paragraphs(l,'TWELVE QUESTIONS. ALL ANSWERED.');
   paragraphs(l,'THAT IS A MAIN-EVENT PERFORMANCE.','green');
   l.push(item(''));
   paragraphs(l,'WRONG TURNS: '+quizState.misses,'cyan');
   l.push(item(''));
   paragraphs(l,'RED: PLAY AGAIN. YELLOW: INDEX.');
  }
  return l;
 }
 function quizPress(action,value){
  const stage=quizState.stage;
  if(action==='quiz-start'){
   quizState.stage='question';quizState.index=0;quizState.checkpoint=0;
   quizState.misses=0;quizState.reveal=false;return true;
  }
  if(action==='quiz-rules'){quizState.stage='rules';return true;}
  if(action==='quiz-back'){if(stage!=='rules')return false;quizState.stage='intro';return true;}
  if(action==='quiz-reveal'){if(stage!=='wrong')return false;quizState.reveal=!quizState.reveal;return true;}
  if(action==='quiz-retry'){
   if(stage!=='wrong')return false;
   quizState.index=quizState.checkpoint;quizState.stage='question';quizState.reveal=false;
   return true;
  }
  if(action==='quiz-answer'){
   if(stage!=='question'||!['0','1','2','3'].includes(String(value)))return false;
   const correct=QUIZ_QUESTIONS[quizState.index].correct===Number(value);
   if(!correct){
    quizState.stage='wrong';quizState.misses++;quizState.reveal=false;return true;
   }
   quizState.index++;
   if(quizState.index%4===0)quizState.checkpoint=quizState.index;
   quizState.stage=quizState.index===QUIZ_QUESTIONS.length?'won':'question';
   return true;
  }
  return false;
 }

 const HANDLES=[
  ['GRAPPLEGRAN','traditional'],['HEELTURN78','contrarian'],
  ['MATWORKMICK','technical'],['BALCONYSEAT','underdog'],
  ['KAYFABEKEV','traditional'],['TICKETSTUB','business'],
  ['FRONTROWFRAN','underdog'],['BIGSPOTBOB','spectacle']
 ];
 const text=x=>String(x==null?'':x);
 const escape=x=>text(x).replace(/[&<>"']/g,ch=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[ch]));
 const line=(x,w=40)=>text(x).replace(/\s+/g,' ').trim().slice(0,w).padEnd(w,' ');
 function wrap(value,width=38){
  const words=text(value).split(/\s+/).filter(Boolean),out=[];let current='';
  for(let word of words){
   while(word.length>width){
    if(current){out.push(current);current='';}
    out.push(word.slice(0,width));word=word.slice(width);
   }
   if(!word)continue;
   if(current&&current.length+word.length+1>width){out.push(current);current='';}
   current+=(current?' ':'')+word;
  }
  if(current)out.push(current);
  return out.length?out:[''];
 }
 function hash(str){let n=2166136261;for(const c of text(str)){n^=c.charCodeAt(0);n=Math.imul(n,16777619);}return n>>>0;}
 function item(value,colour='white',background='black'){return {text:line(value),colour,background};}
 function paragraphs(lines,value,colour='white'){
  for(const part of wrap(value,38))lines.push(item(' '+part,colour));
 }
 function latest(s){
  const hist=(s?.history||[]).filter(h=>h&&h.cid&&h.name&&h.foe);
  return hist.slice().sort((a,b)=>(b.season-a.season)||(b.week-a.week))[0]||null;
 }
 function recents(s){
  const seen=new Set();
  return (s?.history||[]).filter(h=>{
   if(!h||!h.cid||seen.has(h.cid))return false;
   seen.add(h.cid);return true;
  }).slice().sort((a,b)=>(b.season-a.season)||(b.week-a.week));
 }
 const rankName=id=>D?.findWrestler?.(id)?.short||D?.findWrestler?.(id)?.name||text(id);
 const score=h=>Number.isFinite(h?.stars)?h.stars.toFixed(2)+' stars':'rating not recorded';
 function resultLine(h){
  if(h?.outcome==='nc')return 'NO CONTEST';
  if(!h?.finish||!root.OfficeOutcome?.interpret)return 'RESULT NOT AVAILABLE';
  const out=root.OfficeOutcome.interpret(h,{actualOutcome:h.outcome,bookedFinish:h.bookedFinish});
  if(out.winner==='w')return 'WINNER: '+h.name;
  if(out.winner==='f')return 'WINNER: '+h.foe;
  return 'RESULT NOT AVAILABLE';
 }
 function voices(h,count=3){
  if(!h)return [];
  const rotation=hash(h.cid+'|fan')%HANDLES.length,out=[];
  for(let i=0;i<count;i++){
   const [name,kind]=HANDLES[(rotation+i*3)%HANDLES.length];
   let quote;
   const high=Number.isFinite(h.stars)&&h.stars>=3.5;
   const low=Number.isFinite(h.stars)&&h.stars<2.5;
   switch(kind){
    case 'traditional':quote=high?'A match worth talking about. That is what the sport needs.':low?'Not a classic in my book. Give us something to believe in.':'There is a story here. I want to see where it goes.';break;
    case 'technical':quote=high?'The rating looks fair to me. I would watch a rematch.':low?'The rating speaks for itself. There is room to improve.':'I care about the work between the bells, not the poster.';break;
    case 'spectacle':quote=high?'That gave us something to talk about. More of that, please.':low?'I wanted a night to remember. Next time, perhaps.':'Give me a moment worth remembering and I am happy.';break;
    case 'underdog':quote=high?'I love seeing a good performance get recognised.':low?'One disappointing result should not end a career.':'A wrestler can recover from a poor week. I will keep watching.';break;
    case 'business':quote=high?'That kind of rating should help sell the next card.':low?'Would that performance bring you back next week?':'Fans spend real money. The next show needs to deliver.';break;
    default:quote=high?'Everyone loves this one? Let us see the follow-up.':low?'I am not writing anyone off on one match.':'Not everyone needs to agree about that match.';
   }
   out.push({id:'fan:'+h.cid+':'+name,name,kind,quote,sourceId:h.cid});
  }
  return out;
 }
 const person=id=>D?.findWrestler?.(id)||D?.TALENT?.find(w=>w.id===id)||
  D?.FOES?.find(w=>w.id===id)||null;
 const wrestlerName=id=>id?(person(id)?.name||String(id)):'VACANT';
 const promotionName=id=>D?.PROMOS?.find(p=>p.id===id)?.name||String(id||'Unknown');
 function leader(s,pid,div,exclude=null){
  const cards=s?.territory?.cards?.[pid]||{};
  return Object.entries(cards).filter(([id,v])=>id!==exclude&&v&&
   Number.isFinite(v.score)&&D?.divisionOf?.(id)===div)
   .sort((a,b)=>b[1].score-a[1].score||
    wrestlerName(a[0]).localeCompare(wrestlerName(b[0])))[0]||null;
 }
 function scheduled(s){
  const confirmed=[...(s?.card||[]),...(s?.futureBookings||[])].map(o=>({...o,rfKind:'BOOKED'}));
  const known=new Set(confirmed.map(o=>o.id).filter(Boolean));
  const offered=(s?.offers||[]).filter(o=>!known.has(o.id)).map(o=>({...o,rfKind:'OFFER'}));
  return [...confirmed,...offered].filter(o=>o.pid&&o.rid).sort((a,b)=>
   (a.eventAbs??0)-(b.eventAbs??0)||String(a.pid).localeCompare(String(b.pid))||
   String(a.rid).localeCompare(String(b.rid)));
 }
 const eventWeek=o=>o.eventAbs?
  'S'+(Math.floor((o.eventAbs-1)/16)+1)+'W'+(((o.eventAbs-1)%16)+1):'DATE TBD';
 function openingFans(s){
  const p=D?.PROMOS||[],first=p[0],last=p[p.length-1];
  const champ=s?.territory?.titles?.[first?.id]?.[D?.DIVISION_ORDER?.[0]]?.holder;
  const top=leader(s,first?.id,D?.DIVISION_ORDER?.[0],champ);
  return [
   {name:'GRAPPLEGRAN',quote:champ?
    wrestlerName(champ)+' has the '+first.name+' belt. Now show us a proper defence.':
    'I want a proper championship contest.'},
   {name:'HEELTURN78',quote:last?
    last.name+' have the big stage. Give me a noisy small hall instead.':
    'Big names are fine. I still want a proper villain.'},
   {name:'MATWORKMICK',quote:top?
    wrestlerName(top[0])+' sits high on the '+first.name+' card. Who can outwrestle them?':
    'I am waiting for a technical contest.'},
   {name:'TICKETSTUB',quote:first?
    first.venue+' is one venue I would visit. Earn our ticket money.':
    'Promoters have to earn our ticket money.'}
  ];
 }
 function openingForum(s){
  const p=D?.PROMOS||[];
  const first=p[0],last=p.at(-1);
  const top=first&&leader(s,first.id,D?.DIVISION_ORDER?.[0]);
  return [
   {name:'BALCONYSEAT',quote:first?
    'A room like '+first.venue+' can turn one good comeback into a local legend.':
    'A loud little hall can make a star.'},
   {name:'KAYFABEKEV',quote:last?
    'Big television stages are fine, but who will actually earn the boos at '+last.name+'?':
    'Give me somebody worth booing.'},
   {name:'BIGSPOTBOB',quote:top?
    'I would buy a ticket for '+wrestlerName(top[0])+'. I am not promising a classic.':
    'Give us one moment we will talk about tomorrow.'}
  ];
 }
 function build(s){
  syncQuizWeek(s);
  const h=latest(s),recent=recents(s),P={};
  // The blue header already shows an article title, so don't repeat it
  // as the first editorial line. This applies consistently to every page.
  const add=(number,title,lines,subpages=null)=>{
   const body=lines.slice();
   if(!subpages&&body[0]?.text.trim()===title)body.shift();
   P[number]={number,title,lines:body,...(subpages?{subpages:subpages.map(rows=>rows.slice())}:{})};
  };
    // A proper two-column teletext index, not a conventional app menu.
  // Each 20-character half remains individually clickable in the renderer.
  const pair=(left,right,colour='white')=>({text:line(left,20)+line(right,20),colour,background:'black'});
  const promos=s?.promoters?.length?s.promoters:(D?.PROMOS||[]);
  const circuitTitles=s?.territory?.titles||{};
  const bookings=scheduled(s);
  const openingWeek=(s?.week||1)===1;
  // A source-grounded brief fills available room, never creates an orphan
  // second subpage. The article's repeated title is stripped by add().
  const addOpeningNote=(title,lines,heading,copy,colour='white')=>{
   if(!openingWeek||!copy)return;
   const extra=[item(''),item(' '+heading,'cyan')];
   paragraphs(extra,copy,colour);
   const visible=lines.length-(lines[0]?.text.trim()===title?1:0);
   if(visible+extra.length<=17)lines.push(...extra);
  };
  const mainPromo=promos[0]||null;
  const champ=mainPromo&&circuitTitles[mainPromo.id]?.[D?.DIVISION_ORDER?.[0]]?.holder;
  let a=[
   item(' EDITORIAL / NEWS / READER OPINION','yellow'),
   item(' --------------------------------','blue'),
   pair('101 HEADLINE',openingWeek?'102 OUTLOOK':'102 NEWS','white'),
   pair('103 GRAPEVINE','104 THE ROAD','cyan'),
   pair('200 AFTER BELL','201 THE CRITIC','white'),
   pair('300 WATCHLIST','301 STORYLINES','cyan'),
   pair('302 TITLE TALK','500 FANZONE','white'),
   pair('501 LETTERS','777 RINGFAX QUIZ','cyan'),
   item(' --------------------------------','blue'),
   item(' THE OFFICE, THROUGH FANS EYES','yellow'),
   item(' SEASON '+(s?.season||1)+' / WEEK '+(s?.week||1),'cyan'),
   item(' NOT ANOTHER RESULTS TABLE','green'),
   item(' READ THE STORY BEHIND THE STATS','white'),
   item(' TEST YOUR KNOWLEDGE: PAGE 777','yellow')
  ];
  add(100,'RINGFAX INDEX',a);

  a=[item(h?'THE EDITORIAL LEAD':'WELCOME TO THE CIRCUIT','yellow'),item('')];
  if(h){
   paragraphs(a,'THE BELL HAS RUNG','cyan');
   paragraphs(a,h.name+' met '+h.foe+' at '+(h.promoter||promotionName(h.pid)||'the circuit')+'.');
   a.push(item(''));
   if(h.outcome==='dq'||h.outcome==='nc')
    paragraphs(a,'A controversial ending has given the fans something to argue about.','yellow');
   else if(Number.isFinite(h.stars)&&h.stars>=3.5)
    paragraphs(a,'This contest has people talking. The next booking will carry new expectations.','green');
   else
    paragraphs(a,'The contest is over, but opinion on what it means has only begun.','green');
   a.push(item(''),item(' MORE COMMENT: 200 AND 201','cyan'));
  }else{
   paragraphs(a,'FOUR PROMOTIONS. DIFFERENT TASTES.','cyan');
   paragraphs(a,'On one circuit, brawls and technical wrestling are chasing the same fans.');
   a.push(item(''));
   const first=promos[0],last=promos.at(-1);
   if(first&&last)
    paragraphs(a,first.name+' has a very different stage from '+last.name+'.','yellow');
   a.push(item(''));
   paragraphs(a,'Who gets talked about first? The opening bell will tell us.','green');
   a.push(item(''),item(' 102 SEASON OUTLOOK / 500 FANS','cyan'));
   if(first&&last)addOpeningNote('LATEST HEADLINE',a,'FROM THE BOOKERS',
    (first.voice||first.name)+' favours '+first.desc.toLowerCase()+
    '; '+(last.voice||last.name)+' takes a different view at '+last.name+'.');
  }
  add(101,'LATEST HEADLINE',a);

  // Page 102 begins as a season editorial, then becomes the latest news.
  if(openingWeek){
   a=[item('THE SEASON AHEAD','yellow'),item('')];
   paragraphs(a,'THE BIG QUESTION','cyan');
   paragraphs(a,'Can '+(promos[0]?.venue||'a small hall')+
    ' create as much noise as '+(promos.at(-1)?.venue||'a big arena')+'?');
   a.push(item(''));
   paragraphs(a,'THE DIFFERENT SCHOOLS','cyan');
   const first=promos[0],last=promos.at(-1);
   if(first&&last)
    paragraphs(a,first.name+' brings '+first.desc.toLowerCase()+
     '. '+last.name+' offers '+last.desc.toLowerCase()+'.');
   a.push(item(''));
   paragraphs(a,'WATCH THE NEW NAMES','green');
   paragraphs(a,'A card position cannot make a crowd care. The opening shows still have to earn it.');
   a.push(item(''),item(' EDITORS WATCHLIST: PAGE 300','yellow'));
   add(102,'SEASON OUTLOOK',a);
  }else{
   const absolute=(s.season-1)*16+s.week,territory=s?.territory||{};
   const bulletin=territory.lastResults?.week===absolute?territory.lastResults.matches||[]:[];
   const verified=bulletin.filter(m=>m?.pid&&m?.a&&m?.b&&(m.winner===m.a||m.winner===m.b));
   const moved=(territory.titleLog||[]).filter(m=>m?.week===absolute&&m?.how==='match'&&m?.to&&m?.pid);
   a=[item('CIRCUIT NEWS / S'+s.season+' W'+s.week,'yellow'),item('')];
   if(moved.length){
    a.push(item(' TITLE CHANGES','cyan'));
    const c=moved[0];
    paragraphs(a,wrestlerName(c.to)+' has claimed '+promotionName(c.pid)+' gold.','white');
    a.push(item(''));
    paragraphs(a,'One reign ends. The chase starts again.','yellow');
   }
   a.push(item(' THIS WEEK IN THE RING','cyan'));
   if(verified.length){
    const match=verified[0],loser=match.winner===match.a?match.b:match.a;
    paragraphs(a,wrestlerName(match.winner)+' got past '+wrestlerName(loser)+'. What happens next?');
   }else paragraphs(a,'No new verified circuit results. The next stories remain unwritten.');
   a.push(item(''));
   const buzz=promos.filter(p=>Number.isFinite(territory.business?.[p.id]?.buzz))
    .sort((x,y)=>territory.business[y.id].buzz-territory.business[x.id].buzz||
     x.id.localeCompare(y.id));
   if(buzz.length){
    a.push(item(' PROMOTION BUZZ','cyan'));
    paragraphs(a,buzz[0].name+' is attracting attention, but the next show still has to deliver.','white');
   }
   a.push(item(''),item(' THE ARGUMENT CONTINUES ON P500','yellow'));
   add(102,'CIRCUIT NEWS',a);
  }
  // The Offers screen owns contracts. Ringfax covers opinion, not transactions.
  a=[item('THE GRAPEVINE','yellow'),item(' NOT A CONFIRMED FIXTURE LIST','cyan'),item('')];
  if(bookings.length){
   const lead=bookings[0];
   paragraphs(a,'WORD AROUND THE HALLS','green');
   paragraphs(a,promotionName(lead.pid)+' has an active booking conversation this week.');
   a.push(item(''));
   if(lead.rfKind==='OFFER')
    paragraphs(a,'An approach is being discussed. It is not a signed match.');
   else paragraphs(a,'A booking is in place. Can the performers meet expectations?');
  }else{
   paragraphs(a,'THE RUMOUR MILL IS QUIET','green');
   paragraphs(a,'The opening slate is taking shape. Nobody can call the results yet.');
  }
  a.push(item(''));
  paragraphs(a,'THE REAL QUESTION','cyan');
  paragraphs(a,'Whose style will work in a room that does not already love them?');
  a.push(item(''),item(' OPINION, NOT A CONTRACT','yellow'));
  if(!h&&promos[0]&&promos.at(-1))addOpeningNote('THE GRAPEVINE',a,
   'THE SCOUTS ARGUE',promos[0].voice+' looks for '+promos[0].desc.toLowerCase()+
   '; '+promos.at(-1).voice+' prizes '+promos.at(-1).desc.toLowerCase()+'.','green');
  add(103,'THE GRAPEVINE',a);
  a=[item('FROM THE ROAD','yellow'),item(' THE CIRCUIT HAS MANY FACES','cyan'),item('')];
  const roadShows=[promos[0],promos.at(-1)].filter(Boolean);
  for(const p of roadShows){
   a.push(item(' '+p.venue.toUpperCase(),'green'));
   paragraphs(a,'At '+p.name+', expect '+p.desc.toLowerCase()+'.');
   a.push(item(''));
  }
  paragraphs(a,'A good bout in a warehouse may feel very different on a national broadcast.','yellow');
  a.push(item(''),item(' WHAT DO THE FANS THINK? P500','cyan'));
  if(promos[1]&&promos[2])addOpeningNote('FROM THE ROAD',a,'TWO MORE STOPS',
   promos[1].venue+' and '+promos[2].venue+
   ' promise very different nights on the same circuit.');
  add(104,'FROM THE ROAD',a);
  a=[item('AFTER THE BELL','yellow'),item(' A VIEW FROM THE CHEAP SEATS','cyan'),item('')];
  if(h){
   paragraphs(a,h.name+' and '+h.foe+' have left the ring.');
   a.push(item(''));
   const fan=voices(h,1)[0];
   a.push(item(' '+fan.name+' SAYS:','green'));
   paragraphs(a,'"'+fan.quote+'"');
   a.push(item(''));
   paragraphs(a,'The record tells you who won. It cannot say what the audience remembers.','yellow');
  }else{
   paragraphs(a,'NO BELL HAS RUNG YET','green');
   paragraphs(a,'Will the crowd remember the winner, the underdog or one moment that changes everything?');
   a.push(item(''));
   paragraphs(a,'The match record will keep the result. This page will report the reaction.','yellow');
  }
  a.push(item(''),item(' MORE FAN VIEWS: PAGE 500','cyan'));
  if(!h&&promos[0]&&promos[1])addOpeningNote('AFTER THE BELL',a,'EARLY VERDICT',
   promos[0].venue+' will judge the fight, while '+promos[1].venue+
   ' may remember one big moment. Neither has seen a result yet.','green');
  add(200,'AFTER THE BELL',a);
  a=[item('THE CRITICS CORNER','yellow'),item(' OPINION, NOT A SCOREBOARD','cyan'),item('')];
  if(h){
   paragraphs(a,'REVIEW: '+h.name+' v '+h.foe,'yellow');
   a.push(item(''));
   const tone=Number.isFinite(h.stars)&&h.stars>=3.5?
    'The performance gave fans a reason to ask about a return match.':
    Number.isFinite(h.stars)&&h.stars<2.5?
    'Not every night clicks. The next booking is where a wrestler answers critics.':
    'Plenty to discuss, even if the verdict is unlikely to be unanimous.';
   paragraphs(a,tone);
   a.push(item(''));
   const f=voices(h,2)[1];
   a.push(item(' THE COUNTER-ARGUMENT','green'));
   paragraphs(a,'"'+f.quote+'"');
  }else{
   paragraphs(a,'WHAT MAKES A GREAT MATCH?','green');
   paragraphs(a,'One spectacular move? A quiet technical contest? Or a finish the crowd will remember?');
   a.push(item(''));
   paragraphs(a,'We will argue about the work once the season gets under way.','yellow');
  }
  a.push(item(''),item(' WRITE BACK ON PAGE 501','cyan'));
  if(!h)addOpeningNote('THE CRITIC',a,'THE CRITICS TEST',
   'Can a wrestler make a defeat worthwhile? Can a favourite keep a cold crowd? A rating alone will never tell us.','yellow');
  add(201,'THE CRITIC',a);
  // Card ladder selects editorial subjects; Ringfax does not display ranking
  // positions or numeric scores that are already available in The Office.
  const one=promos[0],two=promos[1]||promos[0];
  const picks=[one&&leader(s,one.id,D?.DIVISION_ORDER?.[0],
    s?.territory?.titles?.[one.id]?.[D?.DIVISION_ORDER?.[0]]?.holder),
   two&&leader(s,two.id,D?.DIVISION_ORDER?.[1],
    s?.territory?.titles?.[two.id]?.[D?.DIVISION_ORDER?.[1]]?.holder)].filter(Boolean);
  const makeSpotlight=id=>{
   const w=person(id)||{},style=w.style||'General';
   const angle=style==='Technical'?'Can ring craft win a noisy crowd over?':
    style==='Brawl'?'Hard contact gets attention. Can it carry a story?':
    style==='Spectacle'?'Big moments travel. Timing makes them matter.':
    'The best story makes a crowd care before the finish.';
   return {name:wrestlerName(id),style,angle};
  };
  a=[item('ONES TO WATCH','yellow'),item(' EDITORS PICKS / NOT RANKINGS','cyan'),item('')];
  for(const [i,entry] of picks.slice(0,2).entries()){
   const subject=makeSpotlight(entry[0]);
   a.push(item(' '+subject.name.toUpperCase(),'yellow'));
   paragraphs(a,subject.style+': '+subject.angle);
   if(i===0)a.push(item(''));
  }
  if(!picks.length)paragraphs(a,'The first names to break through must show us something in the ring.');
  a.push(item(''),item(' WHO WOULD YOU PICK? PAGE 501','green'));
  if(picks.length)addOpeningNote('ONES TO WATCH',a,'WHAT TO WATCH',
   'These names are in the frame, but their next crowd will decide what the headlines are.','green');
  add(300,'ONES TO WATCH',a);
  a=[item('THE LONG VIEW','yellow'),item(' STORYLINES / READER THEORIES','cyan'),item('')];
  const ongoing=Object.values(s?.feuds||{}).filter(f=>f&&f.heat>0&&!f.closed)
   .sort((x,y)=>y.heat-x.heat);
  if(ongoing.length){
   const f=ongoing[0];
   paragraphs(a,wrestlerName(f.wid)+' and '+wrestlerName(f.rid)+' have unfinished business.','yellow');
   a.push(item(''));
   paragraphs(a,'Fans can argue about whose side they are on. The ending still has to happen in the ring.');
  }else{
   paragraphs(a,'WHAT WILL THE FIRST FEUD BE?','green');
   paragraphs(a,'The opening cards will put different styles in the same ring.');
   a.push(item(''));
   paragraphs(a,'A rivalry is earned one encounter at a time. You cannot read it from the rankings.');
  }
  a.push(item(''),item(' READER ARGUMENTS ON PAGE 500','cyan'));
  if(!ongoing.length&&promos[2])addOpeningNote('THE LONG VIEW',a,
   'BOOKER TO WATCH',(promos[2].voice||promos[2].name)+' at '+promos[2].name+
   ' likes a long story. Week one is the opening chapter, not the payoff.','yellow');
  add(301,'THE LONG VIEW',a);
  // Card Ladder already owns champion tables. This editorial only examines
  // the pressure around a genuine title, without reproducing the rankings.
  const division=D?.DIVISION_ORDER?.[0]||'men',titlePromo=promos[0];
  const holder=titlePromo&&circuitTitles[titlePromo.id]?.[division]?.holder;
  const contender=titlePromo&&leader(s,titlePromo.id,division,holder);
  a=[item('TITLE TALK','yellow'),item(' PRESSURE, NOT A BELT DIRECTORY','cyan'),item('')];
  if(holder){
   paragraphs(a,wrestlerName(holder)+' has the gold at '+titlePromo.name+'.','yellow');
   a.push(item(''));
   if(contender)
    paragraphs(a,'Could '+wrestlerName(contender[0])+' make that reign uncomfortable? A question, not a booking.');
   else paragraphs(a,'Who is ready to ask the champion the difficult questions?');
  }else paragraphs(a,'An open belt creates opportunity. The next result could change the story.','yellow');
  a.push(item(''));
  paragraphs(a,'A title only matters when somebody makes fans believe it is worth fighting for.','green');
  const otherDivision=D?.DIVISION_ORDER?.[1]||'women';
  const otherHolder=titlePromo&&circuitTitles[titlePromo.id]?.[otherDivision]?.holder;
  const otherContender=titlePromo&&leader(s,titlePromo.id,otherDivision,otherHolder);
  if(otherHolder&&otherContender)addOpeningNote('TITLE TALK',a,
   'THE OTHER TITLE',wrestlerName(otherHolder)+' holds the other Dockside belt.'+
   ' Could '+wrestlerName(otherContender[0])+' make their reign uncomfortable?');
  add(302,'TITLE TALK',a);
  // Opening-week letters are explicitly opinions about the season, not invented match results.
  const opening=openingFans(s);
  const fans=h?voices(h,8).slice(0,3):openingForum(s);
  a=[item('WHAT THE FANS ARE SAYING','yellow'),item('')];
  if(h){
   paragraphs(a,'TOPIC: '+h.name+' v '+h.foe,'cyan');
   a.push(item(''));
   fans.forEach(f=>{
    a.push(item(' '+f.name,'green'));
    paragraphs(a,'"'+f.quote+'"');
    a.push(item(''));
   });
  }else{
   paragraphs(a,(s?.week||1)===1?'OPENING WEEK / FIRST IMPRESSIONS':'CIRCUIT OPINIONS','cyan');
   a.push(item(''));
   for(const f of fans){
    a.push(item(' '+f.name,'green'));
    paragraphs(a,'"'+f.quote+'"');
    a.push(item(''));
   }
  }
  add(500,'THE FANZONE',a);

  // Keep every letter together. Ordinary 17-line slicing orphaned the final
  // two lines of TICKETSTUB's letter on an almost empty second subpage.
  // Repeat a small title only when a real additional page is required.
  const letterTopic=(s?.week||1)===1?'OPENING WEEK / READERS MAIL':'READERS MAIL / THE CIRCUIT';
  const letterIntro=()=>[item('LETTERS TO RINGFAX','yellow'),item(letterTopic,'cyan')];
  const people=h?voices(h,8).slice(3,8):opening;
  const letterBlocks=people.map(f=>{
   const lines=[item('FROM: '+f.name,'green')];
   if(h)paragraphs(lines,'RE: '+h.name+' v '+h.foe,'cyan');
   paragraphs(lines,f.quote);
   return lines;
  });
  const letterPages=[];
  let letterRows=letterIntro();
  for(const block of letterBlocks){
   // Add a gap only between complete letters, not before the first entry.
   const spacer=letterRows.length>letterIntro().length?1:0;
   if(letterRows.length+spacer+block.length>17&&letterRows.length>letterIntro().length){
    letterPages.push(letterRows);
    letterRows=letterIntro();
   }
   if(letterRows.length>letterIntro().length)letterRows.push(item(''));
   // Long quotations can span a subpage, but their author is repeated; never
   // begin a page with unlabelled trailing text.
   if(letterRows.length+block.length>17){
    const name=people[letterBlocks.indexOf(block)].name;
    let remaining=block.slice(1);
    let label=block[0];
    if(letterRows.length>letterIntro().length){
     letterPages.push(letterRows);
     letterRows=letterIntro();
    }
    while(remaining.length){
     const available=17-letterRows.length-1;
     letterRows.push(label,...remaining.splice(0,available));
     if(remaining.length){
      letterPages.push(letterRows);
      letterRows=letterIntro();
      label=item('FROM: '+name+' (CONT)','green');
     }
    }
   }else letterRows.push(...block);
  }
  letterPages.push(letterRows);
  const allLetters=letterPages.flat();
  add(501,'READERS LETTERS',allLetters,letterPages);
  add(777,'RINGFAX QUIZ',quizPage());
  return P;
 }
 const fast=[101,200,300,500];
 // 4 x 4 pixel-cell letters, sized like a real teletext mosaic masthead.
 // Every row remains exactly forty character cells (no SVG or raster image).
 // A 5×7 ORIGINAL bitmap alphabet used for the Ringfax channel ident.
 // Unlike VT323/Unicode block characters, SVG pixel shapes render identically
 // on Android, Chromium desktop and browser zoom. No BBC lettering is copied.
 const PIXELS={
  A:['01110','10001','10001','11111','10001','10001','10001'],
  B:['11110','10001','10001','11110','10001','10001','11110'],
  C:['01111','10000','10000','10000','10000','10000','01111'],
  D:['11110','10001','10001','10001','10001','10001','11110'],
  E:['11111','10000','10000','11110','10000','10000','11111'],
  F:['11111','10000','10000','11110','10000','10000','10000'],
  G:['01111','10000','10000','10111','10001','10001','01111'],
  H:['10001','10001','10001','11111','10001','10001','10001'],
  I:['11111','00100','00100','00100','00100','00100','11111'],
  J:['00111','00010','00010','00010','10010','10010','01100'],
  K:['10001','10010','10100','11000','10100','10010','10001'],
  L:['10000','10000','10000','10000','10000','10000','11111'],
  M:['10001','11011','10101','10101','10001','10001','10001'],
  N:['10001','11001','10101','10011','10001','10001','10001'],
  O:['01110','10001','10001','10001','10001','10001','01110'],
  P:['11110','10001','10001','11110','10000','10000','10000'],
  Q:['01110','10001','10001','10001','10101','10010','01101'],
  R:['11110','10001','10001','11110','10100','10010','10001'],
  S:['01111','10000','10000','01110','00001','00001','11110'],
  T:['11111','00100','00100','00100','00100','00100','00100'],
  U:['10001','10001','10001','10001','10001','10001','01110'],
  V:['10001','10001','10001','10001','10001','01010','00100'],
  W:['10001','10001','10001','10101','10101','11011','10001'],
  X:['10001','10001','01010','00100','01010','10001','10001'],
  Y:['10001','10001','01010','00100','00100','00100','00100'],
  Z:['11111','00001','00010','00100','01000','10000','11111'],
  ' ':['00000','00000','00000','00000','00000','00000','00000']
 };
 function pixelLogo(word){
  const chars=String(word).toUpperCase().split('').filter(c=>PIXELS[c]).slice(0,9);
  const width=chars.length*6-1;
  let path='';
  for(let c=0;c<chars.length;c++){
   for(let y=0;y<7;y++)for(let x=0;x<5;x++){
    if(PIXELS[chars[c]][y][x]==='1')path+='M'+(c*6+x)+' '+y+'h1v1h-1z';
   }
  }
  return '<svg class="rf-logo-svg" xmlns="http://www.w3.org/2000/svg" '+
   'viewBox="0 0 '+width+' 7" preserveAspectRatio="none" aria-hidden="true" focusable="false" '+
   'shape-rendering="crispEdges"><path fill="#ffed00" d="'+path+'"/></svg>';
 }

 const BANNERS={
  100:['RINGFAX','yellow'],101:['HEADLINE','cyan'],102:['SEASON','yellow'],
  103:['GRAPEVINE','green'],104:['THE ROAD','cyan'],200:['AFTER','green'],
  201:['CRITIC','yellow'],300:['WATCH','green'],301:['STORIES','yellow'],302:['TALK','cyan'],
  500:['FANZONE','magenta'],501:['LETTERS','yellow'],777:['RINGFAX','yellow']
 };
 function mosaic(word){
  // Leave a text equivalent inside the 40×25 model; the graphic is painted
  // on top of these blue cells, never substituted for the page content.
  const label=String(word).toUpperCase().slice(0,30);
  return [(' '.repeat(40)),(' '+label).padEnd(40,' '),
   ' '.repeat(40),' '.repeat(40)];
 }

 const fastext=[
  {text:'101 NEWS  ',page:101,colour:'red'},
  {text:'200 AFTER ',page:200,colour:'green'},
  {text:'300 WATCH ',page:300,colour:'yellow'},
  {text:'500 FANS  ',page:500,colour:'cyan'}
 ];
 function clock(){
  const now=new Date();
  const digits=x=>String(x).padStart(2,'0');
  return digits(now.getHours())+':'+digits(now.getMinutes())+'/'+digits(now.getSeconds());
 }
 function pageCount(p){return p?.subpages?.length||Math.max(1,Math.ceil((p?.lines?.length||0)/17));}
 function screen(s){
  const pages=build(s),p=pages[C.page]||null;
  const full=p?.lines||[item('PAGE NOT FOUND','red'),item(''),item('ENTER A VALID PAGE NUMBER','yellow')];
  const chunks=p?.subpages?p.subpages.map(rows=>rows.slice()):[];
  if(!p?.subpages)for(let i=0;i<full.length;i+=17)chunks.push(full.slice(i,i+17));
  if(!chunks.length)chunks.push([]);
  const sub=Math.min(C.sub,chunks.length-1),body=chunks[sub],rows=[];
  const num=String(C.page).padStart(3,'0');
  const header='P'+num+' RINGFAX '+num+'  S'+(s?.season||1)+' W'+(s?.week||1);
  rows.push(item(header.padEnd(31,' ')+clock(),'white'));
  const [heading,colour]=C.page===102&&(s?.week||1)>1?['CIRCUIT','yellow']:
   (BANNERS[C.page]||['SEARCH','red']);
  mosaic(heading).forEach((value,i)=>rows.push({text:value,colour:i===1?colour:'white',background:'blue'}));
  const title=p?.title||'PAGE NOT FOUND';
  const pageInfo=chunks.length>1?'  '+(sub+1)+'/'+chunks.length:'';
  rows.push(item(' '+title.slice(0,35-pageInfo.length).padEnd(35-pageInfo.length,' ')+pageInfo,'white','blue'));
  for(let i=0;i<17;i++)rows.push(body[i]||item(''));
  const links=C.page===777?quizFooter():fastext;
  rows.push({...item(links.map(f=>f.text).join('')) ,segments:links});
  rows.push(item(chunks.length>1?
   'PAGE '+(C.entry||num).padEnd(3,' ')+' '+(C.hold?'HOLD':'AUTO')+'  < > SUBPAGES':
   'PAGE '+(C.entry||num).padEnd(3,' ')+'    TYPE 3 DIGITS TO CHANGE PAGE','yellow'));
  if(rows.length!==25||rows.some(row=>row.text.length!==40))
   throw Error('Ringfax grid must be 25 rows of 40 cells');
  return {page:C.page,title,rows,sub,subpages:chunks.length,exists:!!p};
 }
 function press(action,value,s){
  syncQuizWeek(s||root.OfficeGame?.S);
  if(action.startsWith('quiz-')){
   if(C.page!==777)return false;
   C.sub=0;C.hold=true;
   return quizPress(action,value);
  }
  const state=s||root.OfficeGame?.S;
  const pages=build(state);
  if(action==='digit'){
   if(!/^[0-9]$/.test(text(value)))return false;
   C.entry=(C.entry+value).slice(0,3);
   if(C.entry.length===3){const next=Number(C.entry);if(next===777&&C.page!==777)quizReset();
    C.page=next;C.sub=0;C.entry='';C.hold=next===777;}
  }else if(action==='go'){
   const p=Number(value);if(!Number.isInteger(p)||p<0||p>999)return false;
   if(p===777&&C.page!==777)quizReset();
   C.page=p;C.sub=0;C.entry='';C.hold=p===777;
  }else if(action==='clear')C.entry='';
  else if(action==='backspace')C.entry=C.entry.slice(0,-1);
  else if(action==='left'||action==='right'){
   const len=pageCount(pages[C.page]);
   if(len<2)return false;
   C.sub=(C.sub+(action==='left'?-1:1)+len)%len;C.hold=true;
  }else if(action==='hold'){
   if(pageCount(pages[C.page])<2||C.page===777)return false;
   C.hold=!C.hold;
  }
  else return false;
  return true;
 }
 function key(k,s){
  if(/^[0-9]$/.test(k))return press('digit',k,s);
  if(k==='ArrowLeft')return press('left',null,s);
  if(k==='ArrowRight')return press('right',null,s);
  if(k===' '||k==='Spacebar')return press('hold',null,s);
  if(k==='Backspace')return press('backspace',null,s);
  if(k==='Escape'&&C.page===777)return press('go',100,s);
  const i=['F1','F2','F3','F4'].indexOf(k);
  if(i>=0){const link=C.page===777?quizFooter()[i]:null;
   return link?press(link.action,link.value,s):press('go',fast[i],s);
  }
  return false;
 }

 // The quiz shares Ringfax's standard masthead, with a Bamboozle-style game below.
 // Game state, 40x25 text data, keyboard controls and checkpoint logic are unchanged.


 function quizMascot(){
  // Genuine teletext-style mosaic blocks based on the supplied crowned
  // wrestler reference, not an embedded photo or scaled bitmap file.
  // 24 x 20 teletext cells, each with a 2 x 3 mosaic block matrix.
  // Packed 3-bit palette indices in pairs (48 x 60 block grid):
  // 0 black, 1 yellow, 2 white, 3 blue, 4 red.
  const blocks=[
   'AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAACQAAAAAAAAAAAAAAAAAAAAACSSAAAAAAAAAAA',
   'AAAAAAAAAAACQAAAAAAAAAAAAAAAAAASSAACQAASSSAAAAAAAAAAACSSSAASSAASSSQAAAAA',
   'AAAAACQAASSSSSSAACSAAAAAAAAACSAACSSAASSAAASAAAAAAAAACQAAAASEgSAAAASAAAAA',
   'AAAACQAAAASEgSAAAACAAAAAAAAAAQkAAAAAAAAAAECAAAAAAAAAAQkAASSSSSSQAEQAAAAA',
   'AAAAAAACSASQCSQCSAQAAAAAAAAAAASCSSSSSSSSSCAAAAAAAAAAACSCSSSSSSSSSSAAAAAA',
   'AAAAACSSQAAAAAAAASAAAAAAAAAAASQAABJJIIBAACAAAAAAAAAAAKAAJJJJBIJBJAAAAAAA',
   'AAAAJIAAJJJJJBIJJIIAAAAAAAAAJAAAJJJJJJJJJIBAAAAAAAAAIBABJJJJJJJJJJBIAAAA',
   'AAAAAJAJJJJJJJJJJJIJAAAAAAAABIABJJAAABJAABIJAAAAAAABJAABJAJJIBIBJIIBAAAA',
   'AAABIAABJBJAABIAAJIBAAAAAAAJAAAJJJACQJJACAIAIAAAAAAJBJBJJAJJJJJBJJIBIAAA',
   'AABIBJAJJJJJJJJJJJIBJAAAAABIBIAJJJJJJJJIBJIBJAAAAJJAJAAJJJJJJBJIJJIABIAA',
   'AJJAAAAJJJJJIJJJBJIAAIAAAJAAAAIAJJJJBJJJBJIAAIAAABIBABIAJJJJIAAABJIJBAAA',
   'AAJJAJIAJJJJJJABJJIBIAAAAABJABABJJJBJJJJJJIBIAAAAAJJAAIJJJIJJJJJBJAAIAAA',
   'AAJAAAJJJJJJAJJJJJAAJAAAABIAAAJJJJJJJJJJJJAIJAAAABIABAJAJJJJJIABJIAIBAAA',
   'AAJAJAJIJJJJJJJJJIBIIAAAAABJIAJMBJJJJJJJJIBJAAAAAAAAAAJJAJJJJJJJJAJAAAAA',
   'AAAAAAJJIBJJBJJIJAJAAAAAAAAAAABJJAJJIAABIAAAAAAAAAACSAAJJJJJJJJJIAAAAAAA',
   'AACSSSQAJJJJJJJJAAAAAAAAAASQSSSQBJJJAAAAASQAAAAAAASACSSSAJJJJJJJASSSAAAA',
   'AAAAAACSQBJJJJJJACSSAAAADbbbYAACSAJJJJJIASSSQAAADbbbbbYASQBJJJJACSSCSAAA',
   'DbbbbbbYASABJJIASQAACAAAbbbbbbbbYCSAAAACQADbAAAAbbbbbbbAAAAASSQSADbbbbYA',
   'bbbbYAAACSSQQCQADbbbbbbAbbbbAAAaSSSQQAQADbbbbbbYbbYADbbSSSQASSQSTbbbbbbY',
   'bYAbbbaSSAAAAAASSTbbbbbYbbbbbaSSQAAAAAACSSbbbbbYAAAAAAAAAAAAAAAAAAAAAAAA'
  ].join('');
  const alphabet='ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/';
  const indices=[];
  for(const ch of blocks){
   const n=alphabet.indexOf(ch);
   indices.push(n>>3,n&7);
  }
  const paths=['','','','',''];
  for(let y=0;y<60;y++){
   for(let x=0;x<48;){
    const shade=indices[y*48+x],start=x;
    while(x<48&&indices[y*48+x]===shade)x++;
    if(shade)paths[shade]+='M'+start+' '+y+'h'+(x-start)+'v1h-'+(x-start)+'z';
   }
  }
  const palette=['','#ff0','#fff','#00f','#f00'];
  return '<svg class="rf-bz-face" viewBox="0 0 48 60" '+
   'preserveAspectRatio="xMidYMax meet" data-facing="right" '+
   'role="img" aria-label="Chunky yellow crowned wrestling quiz host in Teletext mosaic blocks" '+
   'shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg">'+
   '<g transform="translate(48 0) scale(-1 1)">'+
   [1,2,3,4].map(i=>'<path fill="'+palette[i]+'" d="'+paths[i]+'"/>').join('')+
   '</g></svg>';
 }
 function quizPresentation(){
  const stage=quizState.stage,links=quizFooter(),q=QUIZ_QUESTIONS[quizState.index],n=quizState.index+1;
  let title,message,choices;
  if(stage==='question'){
   title='Question '+n+'. Wrestling.'; message=q.q; choices=q.a;
  }else if(stage==='intro'){
   title='RINGFAX QUIZ';
   message='New questions every game week. Twelve questions, four colours. Ready?';
   choices=['Start quiz','How to play'];
  }else if(stage==='rules'){
   title='How to play';
   message='Choose red, green, yellow or cyan. Wrong answers return you to the last checkpoint.';
   choices=['Start quiz','Go back'];
  }else if(stage==='wrong'){
   title='You have been bodyslammed!';
   message='Correct: '+q.a[q.correct]+'. '+(quizState.reveal?q.fact:'Retry from question '+(quizState.checkpoint+1)+'.');
   choices=['Try again','Reveal trivia'];
  }else{
   title='You are the Quiz Champion!';
   message='Twelve questions answered! Wrong turns: '+quizState.misses+'. A main-event performance.';
   choices=['Play again','Rules'];
  }
  const choicesHtml=links.slice(0,choices.length).map((link,i)=>{
   const colour=QUIZ_COLOURS[i],label=choices[i];
   return '<button type="button" class="rf-bz-choice rf-bz-'+colour+
    '" data-rf-action="'+link.action+'" data-rf-value="'+(link.value??'')+
    '" aria-label="'+escape(colour+' choice: '+label)+'">'+
    '<span class="rf-bz-square" aria-hidden="true"></span>'+
    '<span class="rf-bz-answer">'+escape(label)+'</span></button>';
  }).join('');
  const footer=links.map((link,i)=>i<choices.length?
   '<button type="button" class="rf-bz-fast rf-bz-'+QUIZ_COLOURS[i]+
    '" data-rf-action="'+link.action+'" data-rf-value="'+(link.value??'')+
    '" aria-label="'+escape(QUIZ_COLOURS[i]+' Fastext: '+choices[i])+'">?????</button>':
   '<span class="rf-bz-fast rf-bz-'+QUIZ_COLOURS[i]+'" aria-hidden="true">?????</span>').join('');
  return '<div class="rf-bz-page rf-bz-stage-'+stage+'">'+
   '<div class="rf-bz-hero"><div class="rf-bz-bubble"><strong>'+escape(title)+
   '</strong><span>'+escape(message)+'</span></div>'+
   '<div class="rf-bz-mascot">'+quizMascot()+'</div></div>'+
   '<div class="rf-bz-rule" aria-hidden="true"></div>'+
   '<div class="rf-bz-answers" role="group" aria-label="Four colour answer keys">'+choicesHtml+'</div>'+
   '<div class="rf-bz-instruction">PRESS THE COLOUR OF YOUR CHOICE.</div>'+
   '<div class="rf-bz-rule" aria-hidden="true"></div>'+
   '<div class="rf-bz-footer" role="group" aria-label="Fastext colour keys">'+footer+'</div>'+
   '</div>';
 }

 function view(s){
  const v=screen(s),pages=build(s),favourites=[
   [100,'Index','Home'],[101,'Headline','Editorial'],[102,(s?.week||1)===1?'Outlook':'News','Scene reports'],
   [200,'After Bell','Reaction'],[300,'Watchlist','Editors picks'],[302,'Title Talk','Opinion'],
   [500,'Fanzone','Fan discussion'],[501,'Letters','Reader mail']
  ];
  const renderedRows=v.rows.map((r,i)=>{
   // Four genuine teletext Fastext fields: click the colour to turn the page.
   if(r.segments){
    return '<div class="rf-row rf-fastext">'+r.segments.map(f=>
     '<button type="button" class="rf-fast-seg rf-fast-'+f.colour+
     '" data-rf-action="'+(f.action||'go')+'" data-rf-value="'+(f.value??f.page??'')+
     '" aria-label="'+escape(f.action==='quiz-answer'?'Answer '+['A','B','C','D'][f.value]:'Select '+f.text.trim())+
     '">'+escape(f.text)+'</button>').join('')+'</div>';
   }
   // The row is still exactly 40 cells. A scalable 5×7 pixel logo overlays
   // rows 1–4; this does not alter the teletext model or its navigation.
   if(i===1){
    // A consistent Ringfax channel masthead; the page title is row six.
    return '<div class="rf-row rf-mosaic rf-bg-blue rf-logo-row">'+escape(r.text)+
     '<div class="rf-logo-art" aria-hidden="true">'+pixelLogo('RINGFAX')+'</div></div>';
   }

   if(C.page===777&&r.answerIndex!==undefined){
    return '<button type="button" class="rf-row rf-quiz-answer rf-'+r.colour+
     '" data-rf-action="quiz-answer" data-rf-value="'+r.answerIndex+
     '" aria-label="'+QUIZ_COLOURS[r.answerIndex]+' answer: '+escape(r.text.trim())+
     '">'+escape(r.text)+'</button>';
   }
   // Index rows have two independently navigable 20-cell columns.
   if(v.page===100&&i>=6&&i<=22){
    const halves=[r.text.slice(0,20),r.text.slice(20,40)];
    const links=halves.map(x=>x.match(/^\s*(\d{3})\s+\S/));
    if(links.some(x=>x&&pages[Number(x[1])])){
     return '<div class="rf-row rf-'+r.colour+' rf-index-row">'+halves.map((half,j)=>{
      const m=links[j],jump=m&&pages[Number(m[1])]?Number(m[1]):null;
      return jump!==null?
       '<button type="button" class="rf-index-half" data-rf-action="go" data-rf-value="'+jump+
       '" aria-label="Open Ringfax page '+jump+'">'+escape(half)+'</button>':
       '<span class="rf-index-half">'+escape(half)+'</span>';
     }).join('')+'</div>';
    }
   }
   const bg=r.background&&r.background!=='black'?' rf-bg-'+r.background:'';
   return '<div class="rf-row rf-'+r.colour+bg+(i>=1&&i<=4?' rf-mosaic':'')+
    (i===0?' rf-header':i===5?' rf-section':'')+'">'+escape(r.text)+'</div>';
  });
  const rows=renderedRows.join('');
  // Page 777 uses the EXACT same rendered six header rows as every other
  // Ringfax page, including the identical pixel logo, size and grid treatment.
  // Only the body after row six is bespoke. The index link overlays row six.
  const quizHeader='<div class="rf-bz-shared-header">'+
   renderedRows.slice(0,6).join('')+
   '<button type="button" class="rf-bz-home" data-rf-action="go" data-rf-value="100" '+
   'aria-label="Return to Ringfax index page 100">100 INDEX</button></div>';
  const quick=favourites.map(([number,label,desc])=>
   '<button type="button" class="rf-page-link'+(v.page===number?' is-current':'')+'" data-rf-action="go" data-rf-value="'+number+'"'+
   (v.page===number?' aria-current="page"':'')+'><span class="rf-link-number">'+number+'</span>'+
   '<span class="rf-link-name">'+escape(label)+'</span><span class="rf-link-detail">'+escape(desc)+'</span></button>').join('');
  const pads=[1,2,3,4,5,6,7,8,9,0].map(n=>
   '<button type="button" data-rf-action="digit" data-rf-value="'+n+'" aria-label="Ringfax digit '+n+'">'+n+'</button>').join('');
  const quizControls=C.page===777?'<div class="rf-quiz-remote" role="group" aria-label="Quiz colour buttons">'+
   quizFooter().map((link,i)=>{
    const a=quizState.stage==='question'?QUIZ_QUESTIONS[quizState.index].a[i]:
     (link.action==='go'?'EXIT TO INDEX':link.text.trim().replace(/^(RED|GRN|YEL|CYN)\s+/,''));
    return '<button type="button" class="rf-quiz-key rf-quiz-key-'+link.colour+
     '" data-rf-action="'+link.action+'" data-rf-value="'+(link.value??'')+
     '" aria-label="'+escape((quizState.stage==='question'?['Red','Green','Yellow','Cyan'][i]+' answer: ':'')+a)+
     '"><span class="rf-quiz-key-colour">'+['RED','GREEN','YELLOW','CYAN'][i]+
     '</span><span>'+escape(a)+'</span></button>';
   }).join('')+'</div>':'';
  const refs=(s?.history||[]).filter(h=>h?.cid&&h?.wid).slice(0,2).map(h=>
   '<button class="btn sm" type="button" data-record="w:'+escape(h.wid)+'">Open '+escape(h.name||'wrestler')+' record</button>').join('');
  const srText=escape('Page '+v.page+', '+v.title+', subpage '+(v.sub+1)+' of '+v.subpages+'. '+
   v.rows.slice(6,23).map(r=>r.text.trim()).filter(Boolean).join(' '));
  return '<section class="rf-wrap'+(C.page===777?' rf-quiz-active':'')+'" aria-label="Ringfax wrestling teletext">'+
   '<div class="rf-display">'+
   '<header class="rf-display-header"><div class="rf-brand"><span class="rf-signal" aria-hidden="true">■</span>'+
   '<strong>RINGFAX</strong><span class="rf-brand-tag">WRESTLING INFORMATION SERVICE</span></div>'+
   '<span class="rf-edition">S'+(s?.season||1)+' W'+(s?.week||1)+' <span class="rf-edition-page">P'+v.page+'</span></span></header>'+
   '<div class="rf-mini-nav">'+
   '<button data-rf-action="go" data-rf-value="100" type="button">100 INDEX</button>'+
   '<button data-rf-action="go" data-rf-value="200" type="button">200 RESULTS</button>'+
   '<button data-rf-action="go" data-rf-value="500" type="button">500 FANS</button></div>'+
   '<div id="rf-screen" class="rf-screen'+(C.page===777?' rf-quiz-screen':'')+'" role="region" aria-label="Ringfax teletext page">'+
    (C.page===777?'<div class="rf-teletext-grid" aria-hidden="true">'+rows+'</div>'+quizHeader+quizPresentation():rows)+'</div>'+
   '<p class="rf-display-caption">LIVE FROM THE CIRCUIT <span>●</span> READ-ONLY EDITION <span>●</span> '+escape(v.title)+'</p>'+
   '</div>'+
   '<aside class="rf-console" aria-label="Ringfax controls">'+
   quizControls+
   '<div class="rf-console-title"><span>RINGFAX DIRECTORY</span><strong>PAGE '+v.page+'</strong></div>'+
   '<div class="rf-page-grid" role="group" aria-label="Go to a Ringfax page">'+quick+'</div>'+
   '<div class="rf-operator"><div class="rf-operator-label"><span>GO TO PAGE</span><span>3 DIGITS</span></div>'+
   '<div class="rf-jump"><input id="rf-page-entry" type="text" inputmode="numeric" autocomplete="off"'+
   ' maxlength="3" pattern="[0-9]{3}" placeholder="e.g. 501" aria-label="Ringfax three-digit page number">'+
   '<button type="button" data-rf-action="jump" aria-label="Open entered Ringfax page">GO</button></div></div>'+
   (v.subpages>1?
    '<div class="rf-sub-nav" role="group" aria-label="Reader subpages">'+
    '<button type="button" data-rf-action="left" aria-label="Previous Ringfax subpage">◀ PREV</button>'+
    '<span aria-label="Subpage '+(v.sub+1)+' of '+v.subpages+'">'+(v.sub+1)+' / '+v.subpages+'</span>'+
    '<button type="button" data-rf-action="right" aria-label="Next Ringfax subpage">NEXT ▶</button></div>'+
    '<button type="button" class="rf-hold" data-rf-action="hold" aria-pressed="'+C.hold+'">'+
      (C.hold?'▶ RESUME AUTOMATIC PAGES':'Ⅱ HOLD THIS SUBPAGE')+'</button>':'')+
   '<details class="rf-keypad"><summary>TELETEXT NUMBER PAD <span aria-hidden="true">▾</span></summary>'+
   '<div class="rf-pad-grid">'+pads+'<button type="button" data-rf-action="clear">CLEAR</button></div></details>'+
   (refs?'<div class="rf-records">'+refs+'</div>':'')+
   '<p class="rf-help">Choose a page or enter three digits. F1–F4 open the coloured sections.'+
   (v.subpages>1?' Arrow keys change subpages.':'')+'</p>'+
   '<details class="rf-access"><summary>Read this page as plain text</summary><pre>'+escape(v.rows.map(r=>r.text.trimEnd()).join('\n'))+'</pre></details>'+
   '<p class="rf-disclaimer">Fan comments are fictional; match results come from your career.</p>'+
   '</aside>'+
   '<p id="rf-announcement" class="sr" role="status" aria-live="polite">'+srText+'</p>'+
   '</section>';
 }
 function fit(){
  const d=root.document;
  const el=d?.querySelector('#rf-screen');
  if(!el||typeof root.getComputedStyle!=='function')return;
  const cs=root.getComputedStyle(el),
   px=name=>parseFloat(cs[name])||0,
   width=el.clientWidth-px('paddingLeft')-px('paddingRight')-2,
   height=el.clientHeight-px('paddingTop')-px('paddingBottom')-2;
  if(width<=0||height<=0)return;
  // Measure ACTUAL rendered text. On Android, teletext fallback fonts and
  // Unicode mosaics don't necessarily share the width of a VT323 letter.
  const probe=d.createElement('span');
  probe.style.cssText='position:absolute;left:-99999px;top:-99999px;visibility:hidden;white-space:pre;font-family:VT323,monospace;font-size:100px;font-weight:400;letter-spacing:0';
  el.appendChild(probe);
  const strings=['M'.repeat(40),'W'.repeat(40),'0'.repeat(40),'RINGFAX'.repeat(5).padEnd(40,' ')];
  const ratio=Math.max(...strings.map(value=>{
   probe.textContent=value;
   return probe.getBoundingClientRect().width/4000;
  }));
  probe.remove();
  let size=Math.min(36,height/(25*1.12),width/(40*ratio))*.965;
  size=Math.max(7.5,Math.floor(size*100)/100);
  // Fit the HEIGHT first, then widen the 40 text cells uniformly to occupy
  // the entire page. Otherwise the small glyphs leave a blank right side.
  const applySize=()=>{
   el.style.setProperty('--rf-font-size',size+'px');
   const naturalWidth=40*ratio*size;
   const stretch=Math.min(2.6,Math.max(1,width/Math.max(naturalWidth,1)));
   el.style.setProperty('--rf-stretch',stretch.toFixed(4));
   el.style.setProperty('--rf-row-width',(100/stretch).toFixed(4)+'%');
  };
  applySize();
  el.style.setProperty('--rf-tracking','0px');
  // Check untransformed cell widths for clipping after fitting.
  for(let attempt=0;attempt<6;attempt++){
   const rows=el.querySelectorAll('.rf-row');
   if(!Array.from(rows).some(row=>row.scrollWidth>row.clientWidth+1))break;
   size=Math.max(7.5,Math.floor(size*95)/100);
   applySize();
  }
 }
 if(root.document&&root.document.fonts?.ready)root.document.fonts.ready.then(fit);
 if(root.addEventListener)root.addEventListener('resize',fit);
 if(typeof root.setInterval==='function'&&root.document){
  // Broadcast clock is real wall-clock time, never an invented in-game day.
  root.setInterval(()=>{
   const h=root.document.querySelector('#rf-screen .rf-header');
   if(h&&root.OfficeGame?.S)h.textContent=screen(root.OfficeGame.S).rows[0].text;
  },1000);
  root.setInterval(()=>{
   if(C.page===777||C.hold||root.document.hidden||!root.document.querySelector('#rf-screen'))return;
   const p=build(root.OfficeGame?.S)[C.page],n=pageCount(p);
   if(n>1){C.sub=(C.sub+1)%n;root.document.dispatchEvent(new root.Event('ringfax-page-rotated'));}
  },8000);
 }
 root.OfficeRingfax={build,screen,view,fit,press,key,voices,quizInfo,
  get quizQuestions(){return QUIZ_QUESTIONS.map(q=>({...q,a:q.a.slice()}));},
  reset:()=>{C.page=100;C.sub=0;C.entry='';C.hold=false;quizReset();}};
})(typeof window!=='undefined'?window:globalThis);
