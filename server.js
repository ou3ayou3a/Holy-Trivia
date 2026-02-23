const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const path = require('path');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET', 'POST'] }
});

app.use(express.static(path.join(__dirname, 'public')));

// ─── In-memory room store ───────────────────────────────────────────────────
const rooms = {}; // roomCode -> roomState

function makeCode() {
  return Math.random().toString(36).slice(2, 8).toUpperCase();
}

function getRoom(code) { return rooms[code] || null; }

function sortedScores(room) {
  return Object.entries(room.scores)
    .sort((a, b) => b[1] - a[1])
    .map(([key, pts]) => ({ key, pts }));
}

// ─── Question Bank ──────────────────────────────────────────────────────────
const QB = {
  easy:[
    {q:"How many days did it rain during Noah's flood?",a:["40 days and 40 nights","7 days and nights","100 days","20 days"],c:0,ref:"Genesis 7:12",ex:"It rained for forty days and forty nights, flooding the entire earth.",cat:"Old Testament"},
    {q:"What was the name of the garden where Adam and Eve lived?",a:["Garden of Eden","Garden of Gethsemane","Garden of Olives","Garden of Paradise"],c:0,ref:"Genesis 2:8",ex:"God planted a garden eastward in Eden and placed Adam there.",cat:"Old Testament"},
    {q:"How many disciples did Jesus choose?",a:["12","7","10","24"],c:0,ref:"Matthew 10:1",ex:"Jesus called twelve disciples and gave them authority.",cat:"Gospel"},
    {q:"Who was swallowed by a great fish?",a:["Jonah","Elijah","Moses","Isaiah"],c:0,ref:"Jonah 1:17",ex:"The Lord provided a great fish to swallow Jonah for three days and nights.",cat:"Old Testament"},
    {q:"What did Moses part so Israel could escape Egypt?",a:["The Red Sea","The Jordan River","The Nile River","The Dead Sea"],c:0,ref:"Exodus 14:21",ex:"Moses stretched out his hand and the Lord drove the sea back.",cat:"Old Testament"},
    {q:"In what city was Jesus born?",a:["Bethlehem","Nazareth","Jerusalem","Jericho"],c:0,ref:"Luke 2:4-7",ex:"Joseph went to Bethlehem, city of David, where Jesus was born.",cat:"Gospel"},
    {q:"What was the first miracle Jesus performed?",a:["Turning water into wine","Healing a blind man","Walking on water","Feeding 5,000 people"],c:0,ref:"John 2:11",ex:"At the wedding in Cana, Jesus turned water into wine.",cat:"Gospel"},
    {q:"Who betrayed Jesus for 30 pieces of silver?",a:["Judas Iscariot","Peter","Thomas","Pontius Pilate"],c:0,ref:"Matthew 26:15",ex:"Judas agreed to betray Jesus for thirty pieces of silver.",cat:"Gospel"},
    {q:"How many commandments did God give Moses on Mount Sinai?",a:["10","5","12","7"],c:0,ref:"Exodus 20:1-17",ex:"God gave Moses the Ten Commandments on tablets of stone.",cat:"Old Testament"},
    {q:"What is the shortest verse in the Bible?",a:["Jesus wept","Pray without ceasing","God is love","Rejoice always"],c:0,ref:"John 11:35",ex:"'Jesus wept' — two words showing Christ's compassion at the tomb of Lazarus.",cat:"Gospel"},
    {q:"On which day did God rest after creation?",a:["The seventh day","The sixth day","The fifth day","The third day"],c:0,ref:"Genesis 2:2",ex:"God rested on the seventh day from all his work, blessing it and making it holy.",cat:"Old Testament"},
    {q:"What giant did the young David defeat?",a:["Goliath","Og","Samson","Sisera"],c:0,ref:"1 Samuel 17:50",ex:"David struck the Philistine giant Goliath with a stone from his sling.",cat:"Old Testament"},
    {q:"Who was the mother of Jesus?",a:["Mary","Martha","Elizabeth","Sarah"],c:0,ref:"Luke 1:31",ex:"The angel Gabriel told Mary she would conceive the Son of God.",cat:"Gospel"},
    {q:"What did Jesus ride into Jerusalem on?",a:["A donkey","A horse","A camel","A white mule"],c:0,ref:"Matthew 21:7",ex:"Jesus rode into Jerusalem on a donkey, fulfilling Zechariah's prophecy.",cat:"Gospel"},
    {q:"Which psalm begins with 'The Lord is my shepherd'?",a:["Psalm 23","Psalm 1","Psalm 91","Psalm 119"],c:0,ref:"Psalm 23:1",ex:"Psalm 23 is the famous shepherd psalm written by David.",cat:"Wisdom"},
    {q:"What food did God send from heaven to feed the Israelites?",a:["Manna","Bread and fish","Honey","Quail alone"],c:0,ref:"Exodus 16:15",ex:"God rained down bread from heaven called manna every morning.",cat:"Old Testament"},
    {q:"What was the name of the first woman?",a:["Eve","Sarah","Miriam","Deborah"],c:0,ref:"Genesis 3:20",ex:"Adam named his wife Eve because she would become the mother of all the living.",cat:"Old Testament"},
    {q:"Who led the Israelites out of Egypt?",a:["Moses","Joshua","Aaron","Abraham"],c:0,ref:"Exodus 13:17",ex:"God led the Israelites out of Egypt through Moses.",cat:"Old Testament"},
    {q:"What is the last book of the Bible?",a:["Revelation","Acts","Jude","Hebrews"],c:0,ref:"Revelation 1:1",ex:"The Book of Revelation is the final book of the New Testament.",cat:"Prophecy"},
    {q:"What happened to Lot's wife when she looked back at Sodom?",a:["She turned into a pillar of salt","She was struck blind","She died immediately","She turned to stone"],c:0,ref:"Genesis 19:26",ex:"Lot's wife disobeyed and looked back, turning into a pillar of salt.",cat:"Old Testament"},
    {q:"How many books are in the Bible?",a:["66","39","72","77"],c:0,ref:"General Knowledge",ex:"The Protestant Bible contains 66 books — 39 OT and 27 NT.",cat:"General"},
    {q:"What did God create on the very first day?",a:["Light","Water","Animals","Land"],c:0,ref:"Genesis 1:3",ex:"God said 'Let there be light' — the very first act of creation.",cat:"Old Testament"},
    {q:"Who built the ark?",a:["Noah","Abraham","Moses","Solomon"],c:0,ref:"Genesis 6:14",ex:"God commanded Noah to build an ark of cypress wood.",cat:"Old Testament"},
    {q:"What were the names of the first two brothers in the Bible?",a:["Cain and Abel","Jacob and Esau","Moses and Aaron","Peter and Andrew"],c:0,ref:"Genesis 4:1-2",ex:"Cain was a farmer and Abel a shepherd — the first brothers.",cat:"Old Testament"},
    {q:"Where did Jesus grow up?",a:["Nazareth","Bethlehem","Jerusalem","Capernaum"],c:0,ref:"Luke 2:51",ex:"Jesus went to Nazareth with his parents and grew up there.",cat:"Gospel"},
    {q:"What was the name of Abraham's wife?",a:["Sarah","Rebekah","Rachel","Leah"],c:0,ref:"Genesis 17:15",ex:"God renamed Sarai to Sarah; she became the mother of Isaac.",cat:"Old Testament"},
    {q:"How many days was Jesus in the tomb before rising?",a:["3 days","7 days","1 day","40 days"],c:0,ref:"Matthew 12:40",ex:"Jesus said he would be in the heart of the earth three days and three nights.",cat:"Gospel"},
    {q:"What is the first book of the Bible?",a:["Genesis","Exodus","Numbers","Leviticus"],c:0,ref:"Genesis 1:1",ex:"Genesis means 'beginning' and opens with creation.",cat:"Old Testament"},
    {q:"Who wrote most of the Psalms?",a:["David","Solomon","Moses","Asaph"],c:0,ref:"Psalms headings",ex:"David is attributed with writing 73 of the 150 psalms.",cat:"Wisdom"},
    {q:"In the Christmas story, what guided the wise men to Jesus?",a:["A bright star","An angel","A cloud","A pillar of fire"],c:0,ref:"Matthew 2:9",ex:"The star went ahead of them until it stopped over where Jesus was.",cat:"Gospel"},
  ],
  medium:[
    {q:"How many years did the Israelites wander in the wilderness?",a:["40 years","20 years","7 years","50 years"],c:0,ref:"Numbers 14:33",ex:"As a consequence of unbelief, Israel wandered for 40 years.",cat:"Old Testament"},
    {q:"Who was the first king of Israel?",a:["Saul","David","Solomon","Jeroboam"],c:0,ref:"1 Samuel 10:24",ex:"Samuel anointed Saul as the first king over Israel.",cat:"Old Testament"},
    {q:"What river was Jesus baptized in?",a:["The Jordan River","The Nile River","The Euphrates","The Sea of Galilee"],c:0,ref:"Matthew 3:13",ex:"Jesus came from Galilee to the Jordan to be baptized by John.",cat:"Gospel"},
    {q:"What was the name of the garden where Jesus was arrested?",a:["Gethsemane","Eden","Olivet","Kidron"],c:0,ref:"Matthew 26:36",ex:"Jesus went to the Garden of Gethsemane to pray before his arrest.",cat:"Gospel"},
    {q:"Which disciple denied Jesus three times?",a:["Peter","Thomas","James","John"],c:0,ref:"Matthew 26:75",ex:"Peter denied knowing Jesus three times before the rooster crowed.",cat:"Gospel"},
    {q:"What did the prodigal son ask for before leaving home?",a:["His inheritance","His father's blessing","A bag of gold","His brother's share"],c:0,ref:"Luke 15:12",ex:"The younger son demanded his share of the estate early.",cat:"Gospel"},
    {q:"Who interpreted the handwriting on the wall for King Belshazzar?",a:["Daniel","Ezra","Isaiah","Nehemiah"],c:0,ref:"Daniel 5:17",ex:"Daniel read and interpreted MENE MENE TEKEL PARSIN.",cat:"Old Testament"},
    {q:"What was Paul's name before his conversion?",a:["Saul","Simon","Silas","Sergius"],c:0,ref:"Acts 9:1",ex:"Before Damascus, the apostle Paul was known as Saul of Tarsus.",cat:"Acts"},
    {q:"Who was the oldest person in the Bible?",a:["Methuselah","Noah","Adam","Jared"],c:0,ref:"Genesis 5:27",ex:"Methuselah lived 969 years — the longest lifespan in Scripture.",cat:"Old Testament"},
    {q:"How many lepers did Jesus heal, of whom only one returned to give thanks?",a:["10","5","7","12"],c:0,ref:"Luke 17:12-17",ex:"Jesus healed ten lepers, but only one Samaritan returned to thank him.",cat:"Gospel"},
    {q:"What did Rahab hang from her window to be spared when Jericho fell?",a:["A scarlet cord","A white flag","An olive branch","A golden rope"],c:0,ref:"Joshua 2:18",ex:"Rahab tied a scarlet cord so her household would be spared.",cat:"Old Testament"},
    {q:"Who was the first Christian martyr?",a:["Stephen","James","Peter","Paul"],c:0,ref:"Acts 7:59",ex:"Stephen, full of the Holy Spirit, was stoned — the first recorded martyr.",cat:"Acts"},
    {q:"What did Jesus say are the two greatest commandments?",a:["Love God and love your neighbour","Honour parents and do not kill","Do not steal and lie","Worship God alone and keep Sabbath"],c:0,ref:"Matthew 22:37-39",ex:"Love God with all your heart, and love your neighbour as yourself.",cat:"Gospel"},
    {q:"Who wrote the Book of Revelation?",a:["John the Apostle","Paul","Peter","Luke"],c:0,ref:"Revelation 1:1",ex:"Revelation was given to John, exiled on the island of Patmos.",cat:"Prophecy"},
    {q:"In which city did Pentecost occur?",a:["Jerusalem","Antioch","Rome","Corinth"],c:0,ref:"Acts 2:1-5",ex:"The Holy Spirit descended on the disciples in Jerusalem at Pentecost.",cat:"Acts"},
    {q:"Who was the father of John the Baptist?",a:["Zechariah","Joseph","Joachim","Eli"],c:0,ref:"Luke 1:13",ex:"The angel told Zechariah his wife Elizabeth would bear a son named John.",cat:"Gospel"},
    {q:"How many brothers did Joseph (son of Jacob) have?",a:["11","10","12","9"],c:0,ref:"Genesis 35:22",ex:"Jacob had 12 sons total, making Joseph one of 11 brothers.",cat:"Old Testament"},
    {q:"What was Zacchaeus's occupation?",a:["Tax collector","Fisherman","Carpenter","Pharisee"],c:0,ref:"Luke 19:2",ex:"Zacchaeus was a chief tax collector who climbed a sycamore tree to see Jesus.",cat:"Gospel"},
    {q:"Which book of the Bible has the most chapters?",a:["Psalms","Isaiah","Genesis","Jeremiah"],c:0,ref:"Psalms",ex:"The Book of Psalms has 150 chapters — the longest in the Bible.",cat:"Wisdom"},
    {q:"What were the names of Job's three friends?",a:["Eliphaz, Bildad, and Zophar","Shadrach, Meshach, Abednego","Shem, Ham, and Japheth","James, John, and Peter"],c:0,ref:"Job 2:11",ex:"When Job suffered, his three friends came to comfort him.",cat:"Wisdom"},
    {q:"What did the father give to the returning prodigal son?",a:["A robe, ring, and sandals","A feast and money","His full inheritance restored","A new house"],c:0,ref:"Luke 15:22",ex:"The father commanded: best robe, a ring, and sandals for his feet.",cat:"Gospel"},
    {q:"How many days did Jonah spend inside the fish?",a:["3 days and 3 nights","7 days","1 day","40 days"],c:0,ref:"Jonah 1:17",ex:"Jonah was inside the fish for three days and nights.",cat:"Old Testament"},
    {q:"Who was Moses' sister?",a:["Miriam","Deborah","Rahab","Ruth"],c:0,ref:"Exodus 15:20",ex:"Miriam the prophetess, sister of Moses and Aaron, led praise after the Red Sea.",cat:"Old Testament"},
    {q:"What is the name of the prayer Jesus taught his disciples?",a:["The Lord's Prayer","The Shepherd's Prayer","The Disciples' Blessing","The Prayer of Faith"],c:0,ref:"Matthew 6:9",ex:"Jesus taught 'Our Father in heaven...' — known as the Lord's Prayer.",cat:"Gospel"},
    {q:"What gift did the Queen of Sheba bring to Solomon?",a:["Gold, spices, and precious stones","Silver and silk","Chariots and horses","Servants and scrolls"],c:0,ref:"1 Kings 10:2",ex:"The Queen arrived with camels carrying spices, gold, and precious stones.",cat:"Old Testament"},
    {q:"How many sons did Jacob have who became tribes of Israel?",a:["12","10","11","13"],c:0,ref:"Genesis 35:22",ex:"Jacob's twelve sons became the twelve tribes of Israel.",cat:"Old Testament"},
    {q:"In the parable of the talents, how many talents did the first servant receive?",a:["5","2","1","10"],c:0,ref:"Matthew 25:15",ex:"The master gave five talents to the first, two to the second, one to the third.",cat:"Gospel"},
    {q:"What did Elijah ask God to do under the juniper tree?",a:["Take his life","Send rain","Defeat Jezebel","Raise the dead"],c:0,ref:"1 Kings 19:4",ex:"Exhausted, Elijah asked God to take his life under the juniper tree.",cat:"Old Testament"},
    {q:"On the road to Damascus, what happened to Paul?",a:["He was blinded by a light and heard Jesus","He fell off his horse","He saw a vision of heaven","An angel appeared"],c:0,ref:"Acts 9:3-5",ex:"A light from heaven flashed and Jesus said 'Saul, why do you persecute me?'",cat:"Acts"},
    {q:"What is the name of the hill where Jesus was crucified?",a:["Golgotha","Mount Sinai","Mount of Olives","Mount Zion"],c:0,ref:"John 19:17",ex:"Jesus carried his cross to Golgotha, which means 'the place of the skull'.",cat:"Gospel"},
  ],
  hard:[
    {q:"How many years did Solomon reign over all Israel?",a:["40 years","20 years","33 years","50 years"],c:0,ref:"1 Kings 11:42",ex:"Solomon reigned in Jerusalem over all Israel for forty years.",cat:"Old Testament"},
    {q:"What was the name of the high priest whose servant's ear Peter cut off?",a:["Caiaphas","Annas","Malchus","Ananias"],c:0,ref:"John 18:10",ex:"Peter cut off the right ear of Malchus, servant of high priest Caiaphas.",cat:"Gospel"},
    {q:"In which chapter of Isaiah does the 'Suffering Servant' passage appear?",a:["Isaiah 53","Isaiah 40","Isaiah 61","Isaiah 9"],c:0,ref:"Isaiah 53:1",ex:"Isaiah 53 contains the Suffering Servant prophecy pointing to Christ.",cat:"Prophecy"},
    {q:"Which minor prophet's name means 'comfort' and prophesied against Nineveh?",a:["Nahum","Habakkuk","Obadiah","Micah"],c:0,ref:"Nahum 1:1",ex:"Nahum means 'comfort' and prophesied the destruction of Nineveh.",cat:"Prophecy"},
    {q:"How many years was Solomon's temple under construction?",a:["7 years","10 years","20 years","3 years"],c:0,ref:"1 Kings 6:38",ex:"Solomon built the temple in seven years; his own palace took thirteen.",cat:"Old Testament"},
    {q:"How many faces did each living creature have in Ezekiel's vision?",a:["4 faces","2 faces","6 faces","1 face"],c:0,ref:"Ezekiel 1:6",ex:"Each living creature had four faces: human, lion, ox, and eagle.",cat:"Prophecy"},
    {q:"What was the name of the judge whose 70 sons were killed by Abimelech?",a:["Gideon","Samson","Jephthah","Ehud"],c:0,ref:"Judges 8:30",ex:"Gideon had seventy sons; Abimelech killed 69 of them on one stone.",cat:"Old Testament"},
    {q:"How many 'fruits of the Spirit' are listed in Galatians 5?",a:["9","7","12","5"],c:0,ref:"Galatians 5:22-23",ex:"Nine fruits: love, joy, peace, patience, kindness, goodness, faithfulness, gentleness, self-control.",cat:"Epistles"},
    {q:"How many people were in Noah's family who entered the ark?",a:["8","4","6","10"],c:0,ref:"1 Peter 3:20",ex:"Eight people: Noah, his wife, three sons, and their wives.",cat:"Old Testament"},
    {q:"What was the name of the valley where David killed Goliath?",a:["Valley of Elah","Valley of Jezreel","Valley of Hinnom","Valley of Rephaim"],c:0,ref:"1 Samuel 17:2",ex:"The Israelites and Philistines assembled in the Valley of Elah.",cat:"Old Testament"},
    {q:"In which epistle does Paul describe the 'armor of God'?",a:["Ephesians","Colossians","Romans","1 Corinthians"],c:0,ref:"Ephesians 6:11",ex:"Paul urges believers to put on the full armor of God in Ephesians 6.",cat:"Epistles"},
    {q:"What did Ananias and Sapphira lie about to the Holy Spirit?",a:["The price of land they sold","Their offering to the poor","Their baptism","Their faith"],c:0,ref:"Acts 5:1-3",ex:"Ananias kept back part of land sale proceeds but claimed he gave it all.",cat:"Acts"},
    {q:"How many 'I AM' statements does Jesus make in the Gospel of John?",a:["7","5","12","9"],c:0,ref:"John — various",ex:"7 'I am' declarations: bread, light, gate, shepherd, resurrection, way/truth/life, vine.",cat:"Gospel"},
    {q:"To which church did Jesus say 'you are neither cold nor hot'?",a:["Laodicea","Sardis","Philadelphia","Pergamum"],c:0,ref:"Revelation 3:15",ex:"Jesus rebuked Laodicea for being lukewarm, threatening to spit them out.",cat:"Prophecy"},
    {q:"How many years did the Israelites spend in Egypt?",a:["430 years","400 years","200 years","70 years"],c:0,ref:"Exodus 12:40",ex:"The Israelites lived in Egypt for exactly 430 years before the Exodus.",cat:"Old Testament"},
    {q:"What was the name of King David's general who killed Absalom?",a:["Joab","Abner","Benaiah","Abishai"],c:0,ref:"2 Samuel 18:14",ex:"Joab thrust three javelins through Absalom's heart while he hung in the oak.",cat:"Old Testament"},
    {q:"Which Old Testament figure was taken to heaven in a whirlwind?",a:["Elijah","Elisha","Enoch","Moses"],c:0,ref:"2 Kings 2:11",ex:"Elijah went up by a whirlwind into heaven in a chariot of fire.",cat:"Old Testament"},
    {q:"What language was most of the New Testament originally written in?",a:["Greek (Koine)","Hebrew","Aramaic","Latin"],c:0,ref:"General Knowledge",ex:"The NT was written in Koine Greek, the common language of the first-century Mediterranean.",cat:"General"},
    {q:"In the Book of Job, how many sons and daughters were restored at the end?",a:["7 sons and 3 daughters","10 sons and 3 daughters","7 sons and 7 daughters","3 sons and 7 daughters"],c:0,ref:"Job 42:13",ex:"God restored Job with seven sons and three daughters — same numbers as before.",cat:"Wisdom"},
    {q:"What does the name 'Ichabod' mean, given at the death of Eli's daughter-in-law?",a:["The glory has departed","God is forgotten","The ark is gone","Shame upon Israel"],c:0,ref:"1 Samuel 4:21",ex:"She named him Ichabod saying 'The glory has departed from Israel'.",cat:"Old Testament"},
    {q:"How many plagues did God send upon Egypt?",a:["10","7","12","9"],c:0,ref:"Exodus 7-12",ex:"God sent ten plagues on Egypt culminating in the death of the firstborn.",cat:"Old Testament"},
    {q:"Which apostle was also likely known as Nathanael?",a:["Bartholomew","Matthew","Thaddaeus","Simon the Zealot"],c:0,ref:"John 1:45-46",ex:"Most scholars identify Bartholomew with Nathanael, who Jesus said had 'no deceit'.",cat:"Gospel"},
    {q:"What is the number of the Beast in Revelation?",a:["666","616","777","999"],c:0,ref:"Revelation 13:18",ex:"The number of the beast is 666 — the number of a man.",cat:"Prophecy"},
    {q:"Who was the last judge of Israel before the monarchy?",a:["Samuel","Samson","Eli","Gideon"],c:0,ref:"1 Samuel 7:15",ex:"Samuel judged Israel all the days of his life before Saul was anointed king.",cat:"Old Testament"},
    {q:"What is the name of the Ethiopian eunuch baptized by Philip?",a:["He is unnamed in Scripture","Timon","Cornelius","Candidus"],c:0,ref:"Acts 8:27",ex:"Scripture does not record the Ethiopian eunuch's personal name.",cat:"Acts"},
    {q:"How many chapters does the Book of Psalms contain?",a:["150","144","120","160"],c:0,ref:"Book of Psalms",ex:"The Book of Psalms contains 150 individual psalms.",cat:"Wisdom"},
    {q:"In which epistle does Paul write 'I can do all things through Christ who strengthens me'?",a:["Philippians","Colossians","Romans","Galatians"],c:0,ref:"Philippians 4:13",ex:"Paul wrote this famous verse while imprisoned, expressing contentment in all circumstances.",cat:"Epistles"},
    {q:"How many seals are opened in the Book of Revelation?",a:["7","5","12","10"],c:0,ref:"Revelation 6-8",ex:"The Lamb opens seven seals, the first four releasing the four horsemen.",cat:"Prophecy"},
    {q:"What wood was Noah commanded to use to build the ark?",a:["Cypress (gopher) wood","Cedar wood","Acacia wood","Oak wood"],c:0,ref:"Genesis 6:14",ex:"God specifically commanded Noah to make the ark from gopher wood (likely cypress).",cat:"Old Testament"},
    {q:"Which book comes immediately after the Book of Malachi?",a:["Matthew","Luke","Acts","Mark"],c:0,ref:"Bible structure",ex:"Malachi is the last OT book; Matthew opens the New Testament.",cat:"General"},
  ]
};

function getQuestions(diff, n) {
  const pool = [...QB[diff]].sort(() => Math.random() - 0.5).slice(0, n);
  return pool.map(q => {
    const correct = q.a[q.c];
    const shuffled = [...q.a].sort(() => Math.random() - 0.5);
    return { ...q, a: shuffled, c: shuffled.indexOf(correct) };
  });
}

// ─── Socket.io Logic ────────────────────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('connected:', socket.id);

  // ── CREATE ROOM ──────────────────────────────────────────────────────────
  socket.on('create_room', ({ name, avatar, diff, mode }) => {
    const code = makeCode();
    rooms[code] = {
      code,
      hostId: socket.id,
      diff, mode,
      phase: 'lobby',
      players: [{ id: socket.id, name, avatar, isHost: true }],
      scores: { [socket.id]: 0 },
      questions: [],
      qIndex: 0,
      buzzedId: null,
      answeredIds: {},   // socketId -> answerIdx this question
      turnIndex: 0,
    };
    socket.join(code);
    socket.roomCode = code;
    socket.emit('room_created', { code, room: rooms[code] });
    console.log(`Room ${code} created by ${name}`);
  });

  // ── JOIN ROOM ────────────────────────────────────────────────────────────
  socket.on('join_room', ({ code, name, avatar }) => {
    const room = getRoom(code);
    if (!room) { socket.emit('error', 'Room not found!'); return; }
    if (room.phase !== 'lobby') { socket.emit('error', 'Game already in progress!'); return; }

    room.players.push({ id: socket.id, name, avatar, isHost: false });
    room.scores[socket.id] = 0;
    socket.join(code);
    socket.roomCode = code;
    socket.emit('room_joined', { code, room });
    io.to(code).emit('lobby_update', room);
    console.log(`${name} joined room ${code}`);
  });

  // ── START GAME ───────────────────────────────────────────────────────────
  socket.on('start_game', () => {
    const code = socket.roomCode;
    const room = getRoom(code);
    if (!room || room.hostId !== socket.id) return;

    room.questions = getQuestions(room.diff, 10);
    room.phase = 'countdown';
    room.qIndex = 0;
    room.answeredIds = {};
    room.buzzedId = null;
    io.to(code).emit('game_starting', { questions: room.questions, diff: room.diff, mode: room.mode });

    // Countdown 3-2-1 then start
    let n = 3;
    const iv = setInterval(() => {
      io.to(code).emit('countdown_tick', n);
      n--;
      if (n < 0) {
        clearInterval(iv);
        room.phase = 'game';
        io.to(code).emit('question_start', {
          qIndex: room.qIndex,
          question: room.questions[room.qIndex],
          scores: room.scores,
          players: room.players,
        });
      }
    }, 1000);
  });

  // ── SUBMIT ANSWER ────────────────────────────────────────────────────────
  socket.on('submit_answer', ({ answerIdx, timeTaken }) => {
    const code = socket.roomCode;
    const room = getRoom(code);
    if (!room || room.phase !== 'game') return;
    if (room.answeredIds[socket.id] !== undefined) return; // already answered

    const q = room.questions[room.qIndex];
    const correct = answerIdx === q.c;
    room.answeredIds[socket.id] = answerIdx;

    // Score calculation
    let pts = 0;
    if (correct) {
      if (room.mode === 'buzzer') pts = 3;
      else if (room.mode === 'simultaneous') pts = 1 + Math.max(0, Math.floor((1 - timeTaken / 20) * 3));
      else if (room.mode === 'turnbased') pts = 2;
      else if (room.mode === 'kahoot') pts = 1 + Math.max(0, Math.floor((1 - timeTaken / 20) * 4));
      pts = Math.max(1, pts);
    } else if (answerIdx !== -1) {
      if (room.mode === 'buzzer' || room.mode === 'kahoot') pts = -2;
      else pts = -1;
    }
    room.scores[socket.id] = (room.scores[socket.id] || 0) + pts;

    // Tell everyone this player answered (but not which answer yet)
    io.to(code).emit('player_answered', {
      playerId: socket.id,
      correct,
      pts,
      scores: room.scores,
    });

    // Check if all players answered OR it's buzzer mode (reveal immediately on buzz)
    const allAnswered = room.players.every(p => room.answeredIds[p.id] !== undefined);
    const isBuzzer = room.mode === 'buzzer';

    if (allAnswered || isBuzzer) {
      revealAnswer(code);
    }
  });

  // ── BUZZER ───────────────────────────────────────────────────────────────
  socket.on('buzz_in', () => {
    const code = socket.roomCode;
    const room = getRoom(code);
    if (!room || room.buzzedId) return; // already buzzed
    room.buzzedId = socket.id;
    const player = room.players.find(p => p.id === socket.id);
    io.to(code).emit('buzzed', { playerId: socket.id, playerName: player ? player.name : 'Someone' });
  });

  // ── TIME UP (host sends this) ────────────────────────────────────────────
  socket.on('time_up', () => {
    const code = socket.roomCode;
    const room = getRoom(code);
    if (!room || room.hostId !== socket.id) return;
    // Mark everyone who hasn't answered as timed out
    room.players.forEach(p => {
      if (room.answeredIds[p.id] === undefined) room.answeredIds[p.id] = -1;
    });
    revealAnswer(code);
  });

  // ── NEXT QUESTION (host sends this) ─────────────────────────────────────
  socket.on('next_question', () => {
    const code = socket.roomCode;
    const room = getRoom(code);
    if (!room || room.hostId !== socket.id) return;

    room.qIndex++;
    room.answeredIds = {};
    room.buzzedId = null;

    if (room.qIndex >= room.questions.length) {
      room.phase = 'finished';
      io.to(code).emit('game_over', { scores: room.scores, players: room.players });
      delete rooms[code];
      return;
    }

    io.to(code).emit('question_start', {
      qIndex: room.qIndex,
      question: room.questions[room.qIndex],
      scores: room.scores,
      players: room.players,
    });
  });

  // ── CHAT MESSAGE ─────────────────────────────────────────────────────────
  socket.on('chat_message', ({ text }) => {
    const code = socket.roomCode;
    const room = getRoom(code);
    if (!room) return;
    const player = room.players.find(p => p.id === socket.id);
    if (!player) return;
    const clean = text.trim().slice(0, 200);
    if (!clean) return;
    io.to(code).emit('chat_message', {
      name: player.name,
      avatar: player.avatar,
      text: clean,
      ts: Date.now(),
    });
  });

  // ── DISCONNECT ───────────────────────────────────────────────────────────
  socket.on('disconnect', () => {
    const code = socket.roomCode;
    if (!code) return;
    const room = getRoom(code);
    if (!room) return;

    room.players = room.players.filter(p => p.id !== socket.id);
    if (room.players.length === 0) {
      delete rooms[code];
      return;
    }
    // If host left, assign new host
    if (room.hostId === socket.id && room.players.length > 0) {
      room.hostId = room.players[0].id;
      room.players[0].isHost = true;
    }
    io.to(code).emit('player_left', { players: room.players, scores: room.scores });
    io.to(code).emit('lobby_update', room);
  });
});

function revealAnswer(code) {
  const room = getRoom(code);
  if (!room) return;
  const q = room.questions[room.qIndex];
  io.to(code).emit('reveal_answer', {
    correctIndex: q.c,
    reference: q.ref,
    explanation: q.ex,
    scores: room.scores,
    answeredIds: room.answeredIds,
    players: room.players,
  });
}

// ─── Start server ───────────────────────────────────────────────────────────
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`✝️  Holy Trivia server running on port ${PORT}`);
});
