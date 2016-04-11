'use strict';

let login = require("facebook-chat-api");
let YouTube = require('youtube-node');
let wolfram = require('wolfram-alpha').createClient("YQE65X-889KH7VWTP", {format:"image"});
let fs = require('fs');
let request = require('request');

let youTube = new YouTube();
youTube.setKey('AIzaSyB1OOSpTREs85WUMvIgJvLTZKye4BVsoFU');

function defaultError2(err, ignored)
{
    if (err)
        console.error(err);
}

let abareTosanamiRegExp = /abare.*tosanami/gi;
let nvidiaRegExp = /nvidia/gi;
let sadRegExp = /\bsad|Q_Q|;_;/gi;
let gzRegExp = /\bgz\b|well done|congrat|grat[sz]/gi;
let definitelyRegExp = /defi(?:n(?:ate|[ae]n?t)|ant)ly/gi;
let whateverRegExp = /whatever|w\/e/i;

let peteQuoteRegExp = /\/petequote\s*(.+)?/i;
let soadQuoteRegExp = /\/soadquote\s*(.+)?/i;
let homerQuoteRegExp = /\/homerquote\s*(.+)?/i;
let sayRegExp = /\/say\s+(.+)?/i;
let stadiumRegExp = /\/stadium|\/reroll/i;
let simpsonsTitleRegExp = /\/randomtitle/i;
let titleRegExp = /\/title\s+(.+)/i;
let todoRegExp = /^\/todo\s+(.+)/i;
let ignoreRegExp = /^\/ignore\s+(.+)/i;
let unignoreRegExp = /^\/unignore\s+(.+)/i;
let okRegExp = /^\/ok/i;

let magicConchRegExp = /magic\s+conch.*\?/i; 
let fuckRegExp = /fuck you (.+)/i;
let goodShitRegExp = /good shit .* shit right/i;
let ytRegExp = /\/yt\s+(.+)/i;
let waRegExp = /\/wa\s+(.+)/i;

let dearRegExp_prefix_prefix = "^/(?:dear|memo|meme-o)";
let dearRegExp = new RegExp(dearRegExp_prefix_prefix, 'i');
let davidRegExp = "dav|gen";
let kassianRegExp = "kas|(?:\\w*\\W*)?hawk|k45";
let patrickRegExp = "pat|\\w*gief";
let peteRegExp = "pete|dud|flake";
let tomRegExp = "tom|chun(?:\\W*li)?";
let wesleyRegExp = "wes|ogg|rose";
let dearRegExp_prefix = dearRegExp_prefix_prefix + "\\s+(?:";
let dearRegExp_suffix = ")\\S*(\\s+.+)";
let dearRegExp_David   = new RegExp(dearRegExp_prefix + davidRegExp   + dearRegExp_suffix, 'i');
let dearRegExp_Patrick = new RegExp(dearRegExp_prefix + patrickRegExp + dearRegExp_suffix, 'i');
let dearRegExp_Kassian = new RegExp(dearRegExp_prefix + kassianRegExp + dearRegExp_suffix, 'i');
let dearRegExp_Pete    = new RegExp(dearRegExp_prefix + peteRegExp    + dearRegExp_suffix, 'i');
let dearRegExp_Tom     = new RegExp(dearRegExp_prefix + tomRegExp     + dearRegExp_suffix, 'i');
let dearRegExp_Wesley  = new RegExp(dearRegExp_prefix + wesleyRegExp  + dearRegExp_suffix, 'i');
let dearData = new Map
([
    ["532092405",  {regExp: new RegExp(davidRegExp,   'i'), dearRegExp: dearRegExp_David,   name: "David"}],
    ["722210172",  {regExp: new RegExp(patrickRegExp, 'i'), dearRegExp: dearRegExp_Patrick, name: "Patrick"}],
    ["1677897853", {regExp: new RegExp(kassianRegExp, 'i'), dearRegExp: dearRegExp_Kassian, name: "Kassian"}],
    ["1384616951", {regExp: new RegExp(peteRegExp,    'i'), dearRegExp: dearRegExp_Pete,    name: "Pete"}],
    ["1337032824", {regExp: new RegExp(tomRegExp,     'i'), dearRegExp: dearRegExp_Tom,     name: "Tom"}],
    ["1187113581", {regExp: new RegExp(wesleyRegExp,  'i'), dearRegExp: dearRegExp_Wesley,  name: "Wesley"}],
]);

let pause = false;
let magicConchCooldown = 0;
let ignoreList = new Set();

let messages = [];
fs.readFile('dear.json', {encoding:'utf8', flag:'a+'}, function callback(err, dataIn)
{
    if (err)
        return console.error(err);
    
    try
    {
        messages = JSON.parse(dataIn);
    }
    catch (ignored)
    {};
});

let ideas = [];
fs.readFile('todo.json', {encoding:'utf8', flag:'a+'}, function callback(err, dataIn)
{
    if (err)
        return console.error(err);
    
    try
    {
        ideas = JSON.parse(dataIn);
    }
    catch (ignored)
    {};
});

fs.readFile('account.json', {encoding:'utf8', flag:'a+'}, function callback(err, dataIn)
{
    if (err)
        return console.error(err);
    
    let account = JSON.parse(dataIn);

    login({email: account.email, password: account.password}, function loginCallback(err, api)
    {
        if (err)
            return console.error(err);

        api.setOptions({selfListen: true});
        api.setOptions({listenEvents: true});
        
        api.listen(function callback(err, event)
        {
            if (err)
                return console.error(err);

            if (event.type != "message")
            {
                if (pause)
                    return;
                
                console.log(event);
                if (event.type == 'event' && event.logMessageType == 'log:unsubscribe')
                    for (var i = 0; i < event.logMessageData.removed_participants.length; ++i)
                        api.addUserToGroup(/fbid:(.+)/i.exec(event.logMessageData.removed_participants[i])[1], event.threadID);
            }
            else
            {
                if (pause)
                {
                    if (event.senderID == 722210172 && event.body === "/start")
                        pause = false;
                    return;
                }
                
                if (event.senderID == 722210172 && event.body === "/stop")
                {
                    pause = true;
                    return;
                }
                
                if (event.senderID == 722210172 && unignoreRegExp.test(event.body))
                    unignore(api, event);
                
                if (ignoreList.has(event.senderID))
                    return;
                
                if (event.senderID == 722210172 && ignoreRegExp.test(event.body))
                    ignore(api, event);
                
                if (event.body === '/messages')
                    api.sendMessage(JSON.stringify(messages, null, 4), event.threadID, defaultError2);
                
                if (event.body === '/todolist')
                    api.sendMessage(JSON.stringify(ideas, null, 4), event.threadID, defaultError2);
                
                if (event.body === '/ping')
                    api.sendMessage('pong', event.threadID, defaultError2);
                
                if (event.senderID == 722210172 && event.body === '/denied')
                    denied(api, event, false);
                
                if (event.senderID == 722210172 && event.body === '/done')
                    denied(api, event, true);
                
                if (event.senderID != 100011414462173 && sayRegExp.test(event.body))
                    api.sendMessage(sayRegExp.exec(event.body)[1], 870772129628937, defaultError2);
                
                var messages_relevant = messages.filter((m) => m.to == event.senderID);
                if (messages_relevant)
                {
                    for (let message_relevant of messages_relevant)
                        api.sendMessage(message_relevant.message, event.threadID, defaultError2);
                    
                    messages = messages.filter((m) => m.to != event.senderID);
                    fs.writeFile('dear.json', JSON.stringify(messages, null, 4), function callback(err)
                    {
                        if (err)
                            return console.error(err);
                    });
                }
                
                if (dearRegExp.test(event.body))
                {
                    if (dear(event))
                        api.sendMessage("Meme-o prepared", event.threadID, defaultError2);
                    else
                        api.sendMessage("Did not recognise user", event.threadID, defaultError2);
                    return;
                }
                
                if (abareTosanamiRegExp.test(event.body))
                    api.sendMessage({url: "https://www.youtube.com/watch?v=n6KNIJs8sZQ"}, event.threadID, defaultError2);
                
                if (nvidiaRegExp.test(event.body))
                    api.sendMessage({url: "https://www.youtube.com/watch?v=iYWzMvlj2RQ&t=30"}, event.threadID, defaultError2);
                
                if (sadRegExp.test(event.body))
                    api.sendMessage({url: "https://www.youtube.com/watch?v=nf-ANnjvrlA"}, event.threadID, defaultError2);
                
                if (gzRegExp.test(event.body))
                    api.sendMessage({url: "https://www.youtube.com/watch?v=IsLML-k4epI"}, event.threadID, defaultError2);
                
                if (definitelyRegExp.test(event.body))
                    api.sendMessage({url: "http://d-e-f-i-n-i-t-e-l-y.com/"}, event.threadID, defaultError2);
                
                if (peteQuoteRegExp.test(event.body))
                    api.sendMessage('<Pete> ' + peteQuote(event.body), event.threadID, defaultError2);
                
                if (soadQuoteRegExp.test(event.body))
                    api.sendMessage(soadQuote(event.body), event.threadID, defaultError2);
                
                if (stadiumRegExp.test(event.body))
                    api.sendMessage(stadium(), event.threadID, defaultError2);
                
                if (event.senderID != 100011414462173 && fuckRegExp.test(event.body))
                    fuckYou(api, event);
                
                if (goodShitRegExp.test(event.body))
                    goodShit(api, event);
                
                if (ytRegExp.test(event.body))
                    yt(api, event);
                
                if (homerQuoteRegExp.test(event.body))
                    homerQuote(api, event);
                
                if (titleRegExp.test(event.body))
                    api.setTitle(titleRegExp.exec(event.body)[1], event.threadID, defaultError2);
                
                if (todoRegExp.test(event.body))
                    todo(api, event);
                
                if (magicConchRegExp.test(event.body))
                    magicConch(api, event);
                
                if (simpsonsTitleRegExp.test(event.body))
                    simpsonsTitle(api, event);
                
                if (whateverRegExp.test(event.body))
                    api.sendMessage({url: "https://www.youtube.com/watch?v=Xz7_3n7xyDg"}, event.threadID, defaultError2);
                
                if (okRegExp.test(event.body))
                    api.sendMessage({attachment: fs.createReadStream('ok.jpg')}, event.threadID, defaultError2);
                
                if (waRegExp.test(event.body))
                    wa(api, event);
            }
        });
    });
});

function wa(api, event)
{
    wolfram.query(waRegExp.exec(event.body)[1], function callback(err, result)
    {
        if (err)
            return console.error(err);
        
        let images = 0;
        for (let pod of result)
            if (pod.subpods)
                for (let subpod of pod.subpods)
                    request.get({url: subpod.image, encoding: 'binary'}, (function(i)
                    {
                        return function(err, response, body)
                        {
                            fs.writeFile("wa/" + i.toString() + ".gif", body, 'binary', function callback(err)
                            {
                                if (err)
                                    return console.error(err);
                                
                                api.sendMessage({attachment: fs.createReadStream("wa/" + i.toString() + ".gif")}, event.threadID, defaultError2);
                            });
                        };
                    })(images++));
    });
}

function ignore(api, event)
{
    for (let dearDatum of dearData)
    {
        let id = dearDatum[0];
        let datum = dearDatum[1];
        
        if (datum.regExp.test(event.body))
        {
            ignoreList.add(id);
            return;
        }
    }
}

function unignore(api, event)
{
    for (let dearDatum of dearData)
    {
        let id = dearDatum[0];
        let datum = dearDatum[1];
        
        if (datum.regExp.test(event.body))
        {
            ignoreList.delete(id);
            return;
        }
    }
}

function homerQuote(api, event)
{
    var quotes =
    [
        "'To start, press any key.' Where's the 'any' key?! I see Kuh-tor-ull, Esc, and Pig-Up, but I don't see the 'Any' key! Woah, all this computer hacking is making me thirsty, I think I'll order a tab. (Presses tab key) Ooh, too late for that now, the computer's starting!",
        "(drunk) Guess how many boobs I saw today? Fifteen!",
        "(Homer bursts through the bedroom door and screams at a nervous Bart) Bart! You wanna see my new chainsaw and hockey mask?!",
        "(in New York) I'll get out of this city alive if it kills me!",
        "(on the phone) Hello, Thailand? How's everything on your end? (listens) Uh huh. That's some language you got there. (chuckling) And you talk like that 24/7, huh?",
        "(snoring and talking in his sleep during Frank Grimes' funeral service) Change the channel, Marge.",
        "A gun is not a weapon, Marge. It's a tool, like a butcher's knife, or a harpoon, or an alligator.",
        "Ah! Tom Arnold! What's the hell's going on?!",
        "Ah, ha ha! Look at that jerk! He dropped his notes! AH, HA HA!",
        "Ah, sweet pity. Where would my love life be without it?",
        "Ah, the Luftwaffe. The Washington Generals of the History Channel.",
        "All normal people love meat. If I went to a barbeque and there was no meat, I would say 'Yo Goober! Where's the meat?'",
        "All right, let's not panic. I'll make the money by selling one of my livers. I can get by with one.",
        "Alright Brain...It's all up to you.",
        "Always give in to peer pressure.",
        "Always remember that you're representing your country... I guess what I'm saying is, don't mess up France the way you messed up your room.",
        "America's health care system is second only to Japan... Canada, Sweden, Great Britain... well, all of Europe. But you can thank your lucky stars we don't live in Paraguay.",
        "Are you hugging the TV?",
        "As long as he has eight fingers and eight toes, he's fine by me. (While holding a newborn Bart)",
        "Aw, Dad... you've done a lot of great things, but you're a very old man now, and old people are useless, aren't they? Aren't they? [he tickles Abe, who laughs]",
        "Aw, twenty dollars! I wanted a peanut!",
        "Aw, twenty dollars... I wanted a peanut.",
        "Back, you robots! Nobody ruins my family vacation but me, and... maybe the boy!",
        "Bart, with $10,000 we'd be millionaires! We could buy all kinds of useful things like... love?",
        "Bart, you're saying butt-kisser like it's a bad thing!",
        "Because they're stupid, that's why. That's why everybody does everything.",
        "Beer, beer, beer, bed, bed, bed.",
        "Beer. Now there's a temporary solution.",
        "Boy, everyone is stupid except me.",
        "Boy, when Marge first told me she was going to the Police Academy, I thought it would be fun and exciting, you know, like the movie... Spaceballs. But instead, it's been painful and disturbing, like the movie Police Academy.",
        "But I can't be a missionary. I don't even believe in Jebus.",
        "But Marge, what if we picked the wrong religion? Each week we just make God madder and madder.",
        "Come here, Apu. If it'll make you feel any better, I've learned that life is one crushing defeat after another... until you just wish Flanders was dead.",
        "Come on Lisa! Monkeys!",
        "Dear Lord, the gods have been good to me and for the first time in my life, everything is absolutely perfect just the way it is. So here's the deal: You freeze everything the way it is and I won't ask for anything more. If that is ok, please give me absolutely no sign. (pause) Deal. In gratitude, I present you this offering of cookies and milk. If you want me to eat them for you, give me no sign. (pause) Thy will be done. (pigs out on the cookies)",
        "Do I know what rhetorical means?",
        "Do you want to change your name to Homer Junior? The kids can call you Hoju.",
        "Don't blame me, I voted for Kodos.",
        "Don't eat me. I have a wife and kids. Eat them.",
        "Don't hassle the dead, boy. They have eerie powers.",
        "Don't let Krusty's death get you down, boy. People die all the time, just like that. Why, you could wake up dead tomorrow. (long pause) Well... g'night!",
        "Don't worry. Being eaten by a crocodile is just like going to sleep... in a giant blender.",
        "Don't you know the saying? 'Water water everywhere, so let's all have a drink.'",
        "Donuts. Is there anything they can't do?",
        "Earth to Marge, earth to Marge. I was there. The clown is G-I-L-L-T-Y.",
        "Enough. I grow weary of your sexually suggestive dancing. Bring me my ranch dressing hose!",
        "Everyone knows rock n' roll attained perfection in 1974; It's a scientific fact.",
        "Extended warranty? How could I lose?",
        "Facts are meaningless. You can use facts to prove anything that's even remotely true!",
        "Fame was like a drug, but what was even more like a drug were the drugs.",
        "First you don't want me to get the pony, now you want me to take it back. Make up your mind!",
        "First you get the sugar, then you get the power, then you get the women.",
        "Go ahead and play the blues if it'll make you happy.",
        "God bless those pagans.",
        "God can't be everywhere, right?",
        "Good things don't end in 'eum', they end in 'mania'... or 'teria'.",
        "Goodbye, Lisa. Remember me as I am... filled with murderous rage!",
        "Have you ever heard of jetlag? (enunciating) JET... LAG?!",
        "Help me, Jebus!",
        "Here's to alcohol, the cause of, and solution to, all life's problems.",
        "Hey, he's not happy at all! He lied to us through song! I HATE when people do that!",
        "Hmm... fabulous house, well behaved kids, sisters in law dead, luxury sedan... Wohooo! I hit the jackpot!",
        "Hmmm... I don't approve of his Bart-killing policy... but I do approve of his Selma-killing policy [subsequently votes for Sideshow Bob].",
        "Homer no function beer well without.",
        "I feel like a candy wrapper caught in an updraft!",
        "I hope I didn't brain my damage.",
        "I like my beer cold, my TV loud and my homosexuals fuh-LAMING!",
        "I saw this in a movie about a bus that had to speed around a city, keeping its speed over fifty, and if its speed dropped, it would explode. I think it was called... The Bus That Couldn't Slow Down.",
        "I saw weird stuff in that place last night. Weird, strange, sick, twisted, eerie, godless, evil stuff... and I want in.",
        "I think Smithers picked me because of my motivational skills. Everyone says they have to work a lot harder when I'm around.",
        "I think the saddest day of my life was when I realized I could beat my Dad at most things. Bart experienced that at the age of four.",
        "I thought I had an appetite for destruction... but all I wanted was a club sandwich.",
        "I want to share something with you. The three little sentences that will get you through life. Number one: Cover for me. Number two: Oh, good idea, boss! Number three: It was like that when I got here.",
        "I wasn't asleep! I was drunk!",
        "I won't apologize, Lisa. I'm sorry, but that's just the way that I am.",
        "I won't sleep in the same bed with a woman who thinks I'm lazy! I'm going right downstairs to unfold the couch, unroll the sleeping be... g'night.",
        "I would kill everyone in this room for a drop of sweet beer.",
        "I'm a white male, age 18 to 49. Everyone listens to me, no matter how dumb my suggestions are.",
        "I'm going to the back seat of my car with the woman I love... and I won't be back for ten minutes!",
        "I'm having the best day of my life, and I owe it all to not going to Church!",
        "I'm normally not a praying man, but if you're up there, please save me Superman.",
        "I'm somewhere where I don't know where I am!",
        "I've always wondered if there was a God, and now I know there is. It's me.",
        "I've figured out an alternative to giving up my beer. Basically, we become a family of traveling acrobats.",
        "If God didn't want us to eat in church, he would've made gluttony a sin.",
        "If it doesn't have Siamese twins in a jar, it is not a fair.",
        "If something goes wrong at the plant, blame the guy who can't speak English. Ah, Tibor, how many times have you saved my butt? (chuckles)",
        "If something's hard to do, then it's not worth doing.",
        "If they think I'm going to stop at that stop sign, they're sadly mistaken!",
        "If you don't like your job, you don't strike! You just go in every day, and do it really half assed. That's the American way.",
        "If you really want something in this life you have to work for it. Now quiet, they're about to announce the lottery numbers.",
        "In this house, we OBEY the laws of thermodynamics!",
        "It's gonna take a lot of fireworks to clean this place up.",
        "It's not easy to juggle a pregnant wife and a troubled child, but somehow I managed to fit in eight hours of TV a day.",
        "Kids, you tried your best and you failed miserably. The lesson is, never try.",
        "Kill my boss? Do I dare live out the American dream?",
        "Lisa, a guy who's got lots of ivory is less likely to hurt Stampy than a guy whose ivory supplies are low.",
        "Marge, are we Jewish?",
        "Marge, can we go home? All this fresh air is making my hair move and I don't know how long I can complain.",
        "Marge, I agree with you - in theory. In theory, Communism works. In theory.",
        "Marge, I'm going to miss you so much. And it's not just the sex. It's also the food preparation.",
        "Marge, it takes two to lie. One to lie and one to listen.",
        "Marge, it's 3am. Shouldn't you be baking?",
        "Marge, someone broke the toilet.",
        "Marge, what's wrong? Are you hungry? Sleepy? Gassy? Gassy? Is it gas? It's gas, isn't it?",
        "Marge, when I join an underground cult I expect a little support from my family.",
        "Mr. Plow, that's my name, that name again is Mr. Plow!",
        "My father never believed in me! I'm not gonna make the same mistake. From now on I'm gonna be kinder to my son and meaner to my dad.",
        "Never! Never, Marge! I can't live the button-down life like you. I want it all: the terrifying lows, the dizzying highs, the creamy middles. Sure, I might offend a few of the bluenoses with my cocky stride and musky odors - oh, I'll never be the darling of the so-called city fathers, who cluck their tongues, stroke their beards, and talk about what's to be done with this Homer Simpson?!",
        "Not those peanuts... the ones at the bottom.",
        "Now for the easiest job for any coach... the cuts.",
        "Now, son, you don't want to drink beer. That's for daddies, and kids with fake IDs.",
        "Of all the women in the world, I had to marry Jane Fonda!",
        "Oh! Look at that car burn! Does it get any better than this?",
        "Oh, everything looks bad if you remember it.",
        "Oh, everything's too damned expensive these days. Like this Bible: 15 bucks! And talk about a preachy book! According to this, everybody's a sinner! Except for this guy.",
        "Oh, Lisa, you and your stories. 'Bart is a vampire. Beer kills brain cells.' Now let's go to back to that... building...thingy.. where our beds and TV... is.",
        "Oh, look at me! I'm making people happy! I'm the Magical Man, from Happy Land, in a gumdrop house on Lollipop Laaaaaaaaaaaane! [leaves the room, then pokes his head back in] Oh, by the way, I was being sarcastic. [leaves again]",
        "Oh, people can come up with statistics to prove anything, Kent. Forty percent of people know that.",
        "Oh, so they have internet on computers now!",
        "Old people don't need companionship. They need to be isolated and studied so it can be determined what nutrients they have that might be extracted for our personal use.",
        "Operator! Give me the number for 911!",
        "Operator, get me Thailand. T, I... and so on.",
        "Owww look at me Marge, I'm making people Happy! I'm the magical man, from Happy Land, who lives in a gumdrop house on Lolly Pop Lane!!!!...... By the way I was being sarcastic...",
        "Pffft. Who needs English? I'm never going to England.",
        "Shut up, brain, or I'll stab you with a Q-Tip!",
        "Simpson! Homer Simpson! He's the greatest guy in history. From the, Town of Springfield! He's about to hit a chestnut tree!",
        "Some people say I look like Dan Aykroyd.",
        "Son, a woman is a lot like a... [looks around] a refrigerator! They're about six feet tall, 300 pounds. They make ice and, um... [spots his can of Duff] Oh, wait a minute. Actually, a woman is more like a beer. They smell good, they look good and you'd step over your own mother just to get one! [downs the beer] But you can't stop at one. You wanna drink another woman!",
        "Son, when you participate in sporting events, it's not whether you win or lose: it's how drunk you get.",
        "Stupid gravity!",
        "Television! Teacher, mother, secret lover.",
        "The Internet? Is that thing still around?",
        "Then I figured out we could just stick them in front of the TV. That's how I was raised, and I turned out TV.",
        "There's so much I don't know about astrophysics! I wish I read that book by that wheelchair guy.",
        "They didn't have any aspirin, so I got you some cigarettes.",
        "Trying is the first step towards failure.",
        "We're goin' bowling. If we don't come back, avenge our deaths!",
        "Weaseling out of things is important to learn! It's what separates us from the animals. Except the weasel...",
        "Weaseling out of things is important to learn. It's what separates us from the animals ... except the weasel.",
        "Well, if it isn't the leader of the wiener patrol, boning up on his nerd lessons.",
        "Well, it's 1am. Better go home and spend some quality time with the kids.",
        "What are you gonna do? Release the dogs?! Or the bees?! Or dogs with bees in their mouth so that when they bark they shoot bees at you?!",
        "What do we need a psychiatrist for? We know our kid is nuts.",
        "What is a wedding? Webster's Dictionary defines a wedding as 'The process of removing weeds from one's garden.'",
        "When I look at the smiles on all the children's faces, I just know they're about to jab me with something.",
        "When will I learn? The answer to life's problems aren't at the bottom of a bottle, they're on TV!",
        "Wow, this plankton is only 33 cents!",
        "You can't keep blaming yourself. Just blame yourself once, and move on",
        "You maniacs! You blew it up! Damn you! Damn you all to hell!",
        "You must love this country more than I love a cold beer on a hot Christmas morning.",
        "You're not the only one who can abuse a non-profit organization.",
        "Your lives are in the hands of men no smarter than you or I, many of them incompetent boobs. I know this because I worked alongside them, gone bowling with them, watched them pass me over for promotions time and again. And I say... This stinks!",
        "Your mother seems really upset. I better go have a talk with her - during the commercial.",
        "[about Lisa] Did you hear that, Marge? She called me a baboon! The stupidest, ugliest, smelliest ape of them all!",
        "[drinking Duff beer] Ah... you can really taste the goat.",
        "[telling Bart about how he avoided jury duty] The trick is to say you're prejudiced against all races."
    ];

    var suggestion = homerQuoteRegExp.exec(event.body)[1];
    var quote = "D'oh";
    if (!suggestion)
        quote = quotes[Math.floor(Math.random() * quotes.length)];
    else
    {
        suggestion = suggestion.toLowerCase();
        for (var i = 0; i < quotes.length; ++i)
            if (quotes[i].toLowerCase().includes(suggestion))
                quote = quotes[i];
    }

    api.sendMessage(quote, event.threadID, function callback(err, obj)
    {
        if (err)
            return console.error(err);
    });
}

function simpsonsTitle(api, event)
{
    var quotes = 
    [
        "Everything lasts forever",
        "Listen to your mother, kids. Aim low. Aim so low no one will even care if you succeed. Dinner's in the oven. If you want some butter it's under my face",
        "If anyone wants me, I'll be in my room",
        "I can't wait to eat that monkey",
        "Have the Rolling Stones killed",
        "Uh, no, they're saying, 'Boo-urns! Boo-urns!'",
        "Attention, students, this is Principal Skinner, your principal, with a message from the principal's office. Report immediately for an assembly in the Butthead Memorial Auditorium. Damn it, I wish we hadn't let the students name that one.",
        "Oh my name's Agnes, and you know it's Agnes! It means lamb! Lamb of God",
        "Sex Cauldron?! I thought they closed that place down",
        "There goes the last lingering thread of my heterosexuality",
        "Unflavored for me",
        "Iron helps us play",
        "Daddy says dice are wicked",
        "Ned, have you considered any of the other major religions? They're all pretty much the same",
        "Bake 'em away, toys!",
        "Mrs. Krabappel and Principal Skinner were in the closet making babies and I saw one of the babies and then the baby looked at me",
        "Give me that, you noodle-armed choir-boy",
        "I'm better than dirt. Well, most kinds of dirt, not that fancy store-bought dirt... I can't compete with that stuff",
        "It's dignity! Gah! Don't you even know dignity when you see it?",
        "I'm sorry, I'm not as smart as you, Kirk. We didn't all go to Gudger College",
        "Everything's coming up Milhouse",
        "He's had it in for me ever since I kinda ran over his dog. Well, replace the word 'kinda' with the word 'repeatedly,' and the word 'dog' with 'son.'",
        "Don't kid yourself, Jimmy. If a cow ever got the chance, he'd eat you and everyone you care about",
        "Ow, my eye! I'm not supposed to get pudding in it!",
        "Aw, nuts. I mean...aw, nuts",
        "Just miles from your doorstep, hundreds of men are given weapons and trained to kill. The government calls it the Army, but a more alarmist name would be...the Killbot Factory",
        "Democracy simply doesn't work",
        "She's faking",
        "Oh, I have had it, I have had it with this school, Skinner! The low test scores, class after class of ugly, ugly children",
        "Please, I have a funny story, if you'll listen? I even wrote theme music, listen! Ahem. Hey. Hey. Professor Frink, Professor Frink, he'll make you laugh, he'll make you think, he likes to run, and then the thing, with the...person? Oh boy, that monkey is going to pay",
        "I 'unno. Gotta nuke somethin'",
        "You have 24 hours to give us our money. And to show you we're serious… you have 12 hours",
        "Hey Salvatore! Get the ugly kid a platter of the red crap-a!",
        "Sidewalk's for regular walkin', not for fancy walkin'",
        "Can't we have one meeting that doesn't end with us digging up a corpse",
        "Please sign these papers indicating that you did not save Itchy & Scratchy",
        "Don't make me run! I'm full of chocolate",
        "That is so gay",
        "I need the biggest seed bell you have. ...No, that's too big",
        "When you were in that coma, did you feel your brain getting damaged?",
        "Duffman... can't breathe! OH no",
        "Hey, I can call my ma from up here. HEY MA, GET OFF THE DANG ROOF!",
        "Hey kids, always recycle, TO THE EXTREME",
        "But this comes out of my salary! If I had a girlfriend, she'd kill me",
        "My eyes! The goggles do nothing"
    ];
    
    api.setTitle(quotes[Math.floor(Math.random() * quotes.length)], event.threadID, function callback(err, obj)
    {
        if (err)
            return console.error(err);
    });
}

function peteQuote(body)
{
    var quotes =
    [
        "Oh my god, you're absolutely right!",
        "You're right, I'm talking nothing but complete shit",
        "Tt makes perfect sense!",
        "Abare 'no' tosanami",
        "I piss a lot because I drink a shitload of coffee on modafinil",
        "I'm not gonna flake",
        "Oh yeah I flaked",
        "*God no*",
        "I *could*",
        "It only has one dual-core conventional CPU, so they could map that to the x86 core in the PS4, and find some way of translatin operations from the 8 SIMD processors to the GPU",
        "Hilarious man, what did I do before I met you?",
        "Fuck, I am a vaping douchebag",
        "I can simulate it, yeah; but the thing that's fucking up is the AXI interface (or the AMBA extensible interface interface). The simulation model for the AXI slave interface on the chip isn't included in the general Vivado license. So I had to write a dummy, diagnostic AXI slave. So I simulate with that, and it works fine, but I'm writing FPGA logic and code, so I have a bunch of different functions running on the ARM core that write various things to the address that the VGA driver reads from. I actually had to disable the cache on the ARM core, because data written to ram wasn't manifesting itself in the FPGA logic. The particular slave interface on the physical FPGA is a high-performance, deeply buffered interface to off-chip memory, scheduling coarse-grained memory access alongside the ARM cores & cache heirarchy"
    ];
    
    var suggestion = peteQuoteRegExp.exec(body)[1];
    if (!suggestion)
        return quotes[Math.floor(Math.random() * quotes.length)];
    
    suggestion = suggestion.toLowerCase();
    for (var i = 0; i < quotes.length; ++i)
        if (quotes[i].toLowerCase().includes(suggestion))
            return quotes[i];
    
    return "Go fuck yourself";
}

function stadium()
{
    var pokemon = 
    [
        "Bulbasaur",
        "Ivysaur",
        "Venusaur",
        "Charmander",
        "Charmeleon",
        "Charizard",
        "Squirtle",
        "Wartortle",
        "Blastoise",
        "Caterpie",
        "Metapod",
        "Butterfree",
        "Weedle",
        "Kakuna",
        "Beedrill",
        "Pidgey",
        "Pidgeotto",
        "Pidgeot",
        "Rattata",
        "Raticate",
        "Spearow",
        "Fearow",
        "Ekans",
        "Arbok",
        "Pikachu",
        "Raichu",
        "Sandshrew",
        "Sandslash",
        "Nidoran♀",
        "Nidorina",
        "Nidoqueen",
        "Nidoran♂",
        "Nidorino",
        "Nidoking",
        "Clefairy",
        "Clefable",
        "Vulpix",
        "Ninetales",
        "Jigglypuff",
        "Wigglytuff",
        "Zubat",
        "Golbat",
        "Oddish",
        "Gloom",
        "Vileplume",
        "Paras",
        "Parasect",
        "Venonat",
        "Venomoth",
        "Diglett",
        "Dugtrio",
        "Meowth",
        "Persian",
        "Psyduck",
        "Golduck",
        "Mankey",
        "Primeape",
        "Growlithe",
        "Arcanine",
        "Poliwag",
        "Poliwhirl",
        "Poliwrath",
        "Abra",
        "Kadabra",
        "Alakazam",
        "Machop",
        "Machoke",
        "Machamp",
        "Bellsprout",
        "Weepinbell",
        "Victreebel",
        "Tentacool",
        "Tentacruel",
        "Geodude",
        "Graveler",
        "Golem",
        "Ponyta",
        "Rapidash",
        "Slowpoke",
        "Slowbro",
        "Magnemite",
        "Magneton",
        "Farfetch'd",
        "Doduo",
        "Dodrio",
        "Seel",
        "Dewgong",
        "Grimer",
        "Muk",
        "Shellder",
        "Cloyster",
        "Gastly",
        "Haunter",
        "Gengar",
        "Onix",
        "Drowzee",
        "Hypno",
        "Krabby",
        "Kingler",
        "Voltorb",
        "Electrode",
        "Exeggcute",
        "Exeggutor",
        "Cubone",
        "Marowak",
        "Hitmonlee",
        "Hitmonchan",
        "Lickitung",
        "Koffing",
        "Weezing",
        "Rhyhorn",
        "Rhydon",
        "Chansey",
        "Tangela",
        "Kangaskhan",
        "Horsea",
        "Seadra",
        "Goldeen",
        "Seaking",
        "Staryu",
        "Starmie",
        "Mr. Mime",
        "Scyther",
        "Jynx",
        "Electabuzz",
        "Magmar",
        "Pinsir",
        "Tauros",
        "Magikarp",
        "Gyarados",
        "Lapras",
        "Ditto",
        "Eevee",
        "Vaporeon",
        "Jolteon",
        "Flareon",
        "Porygon",
        "Omanyte",
        "Omastar",
        "Kabuto",
        "Kabutops",
        "Aerodactyl",
        "Snorlax",
        "Articuno",
        "Zapdos",
        "Moltres",
        "Dratini",
        "Dragonair",
        "Dragonite",
        "Mewtwo",
        "Mew"
    ];
    
    var ids = [];
    while (ids.length < 6)
    {
        var rID = Math.floor(Math.random() * 150) + 1;
        if (ids.indexOf(rID) == -1)
            ids.push(rID);
    }
    ids.sort((x, y) => x - y);
    var message = ids[0] + " " + pokemon[ids[0] - 1];
    for (var i = 1; i < ids.length; ++i)
        message += "\n" + ids[i] + " " + pokemon[ids[i] - 1];
    return message;
}

function dear(event)
{
    for (let dearDatum of dearData)
    {
        let id = dearDatum[0];
        let datum = dearDatum[1];
        
        let message = datum.dearRegExp.exec(event.body);
        if (!message)
            continue;
        
        message = '<' + dearData.get(event.senderID).name + '>' + message[1];
        messages.push({"to":id, "message":message});
        
        fs.writeFile('dear.json', JSON.stringify(messages, null, 4), function callback(err)
        {
            if (err)
                return console.error(err);
        });
        return true;
    }
    
    return false;
}

function todo(api, event)
{
    var idea = todoRegExp.exec(event.body)[1];
    ideas.push(idea);
    
    fs.writeFile('todo.json', JSON.stringify(ideas, null, 4), function callback(err)
    {
        if (err)
            return console.error(err);
    });
    
    api.sendMessage("I'll think about it...", event.threadID);
}

function denied(api, event, done)
{
    var idea = ideas.pop();
    
    fs.writeFile('todo.json', JSON.stringify(ideas, null, 4), function callback(err)
    {
        if (err)
            return console.error(err);
    });
    
    if (done)
        api.sendMessage("Done: " + idea, event.threadID);
    else
        api.sendMessage("Nah.", event.threadID);
}

function fuckYou(api, event)
{
    youTube.addParam('channelId', 'UCXdY60PbXqRuxOQ6jT5usTg');
    youTube.search('fuck you ' + fuckRegExp.exec(event.body)[1], 1, function(err, result)
    {
        if (err)
            return console.error(err);
        
        if (result.items[0])
            api.sendMessage({url: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId}, event.threadID);
        else
            api.sendMessage("fuck you " + dearData[event.senderID].name, event.threadID);
    });
    youTube.params = {};
    youTube.setKey('AIzaSyB1OOSpTREs85WUMvIgJvLTZKye4BVsoFU');
}

function goodShit(api, event)
{
    api.removeUserFromGroup(event.senderID, event.threadID, function(err)
    {
        if (err)
            return console.error(err);
        
        api.addUserToGroup(event.senderID, event.threadID);
    });
}

function yt(api, event)
{
    youTube.search(ytRegExp.exec(event.body)[1], 1, function(err, result)
    {
        if (err)
            return console.error(err);
        
        if (result.items[0] && result.items[0].id && result.items[0].id.videoId)
            api.sendMessage({url: "https://www.youtube.com/watch?v=" + result.items[0].id.videoId}, event.threadID);
        else
            api.sendMessage("denied", event.threadID);
    });
}

function magicConch(api, event)
{
    let cooldownLength = 5;
    let inTheClub =
    [
        "Sure",
        "Absolutely",
        "Yes",
        "Certainly",
        "Without question",
        "Definitely",
        "Of course",
        "It wouldn't surprise me",
        "I'd be delighted",
        "Go right ahead",
        "By all means",
        "Be my guest"
    ];

    if (event.senderID == 722210172 || event.senderID == 1384616951)
        api.sendMessage(inTheClub[Math.floor(Math.random() * inTheClub.length)], event.threadID);
    else
    {
        if (magicConchCooldown === cooldownLength)
        {
            api.sendMessage("*Nooooo*", event.threadID);
            if (magicConchCooldown > 0)
                magicConchCooldown--;
        }
        else if (magicConchCooldown === 0 && Math.floor(Math.random() * 20) === 0)
        {
            api.sendMessage("Try asking again", event.threadID);
            magicConchCooldown = cooldownLength;
        }
        else
        {
            api.sendMessage("No", event.threadID);
            if (magicConchCooldown > 0)
                magicConchCooldown--;
        }
    }
}

function soadQuote(body)
{
    let quotes = 
    [
        "4000 hungry children leave us per hour",
        "a deer dance, invitation to peace",
        "a fallen ruby",
        "a former cop, undercover",
        "a gentile or a priest?",
        "a hitman, a nun, lovers",
        "a man can't avoid what he's meant to do",
        "a political call",
        "a pyramid mind fuck",
        "a rush of words",
        "a smile brings forth energy or life",
        "a whole race genocide",
        "able to fly able to die able to fuck your mother's earth (fuck your mother's earth)",
        "about beta carotine and theta waves",
        "about high pulse weapons and microwaves",
        "accidents happen",
        "accidents happen in the dark",
        "advertising causes need",
        "advertising's got you on the run",
        "aerials, in the sky",
        "aerials, so up high",
        "ahhhh ahhhh ahhhh ahhhh!",
        "all because we all live in the valley of the walls",
        "all in a system of down... down",
        "all in a system, down",
        "all of what remains",
        "all of what remains... ego brain",
        "all our taxes paying for your wars against the new non-rich",
        "all pathetic flag waving ignorent geeks and we'll",
        "all pathetic flag waving ignorent hicks and we'll",
        "all players with no names",
        "all research and successful drug policy show that treatment should be increased",
        "all right",
        "all rise, I fall",
        "all the evil traits",
        "all the life running through her hair",
        "all the stomach pains",
        "all the thoughts I see in you about how I",
        "all the world I've seen before me passing by",
        "all the years of propaganda",
        "all you bitches put your hands in the air and wave them like you just don't care",
        "all you maggots smoking fags on santa monica boulevard",
        "all you maggots smoking fags out there on hollywood boulevard",
        "all you maggots smoking fags out there on sunset boulevard",
        "all young men must go",
        "always want to go",
        "always want to play",
        "among the writers of the word",
        "an exit lights the sky",
        "an unjustifiable, egotistical, power struggle",
        "and a generation that didn't agree",
        "and all your crooked pictures",
        "and bring the dark disaster",
        "and clueless neckties working",
        "and declared that love prevails over all",
        "and declared, that love prevails over all",
        "and for her everyone cried",
        "and hypnotic computers",
        "and I just fucking kick her, and then, baby, she's o.k.(sugar)",
        "and if you die, I wanna die with you",
        "and if you go, I wanna go with you",
        "and ishkur, ishkur",
        "and it's mine",
        "and law enforcement decreased while abolishing mandatory minimum sentences",
        "and make the forest turn to sand",
        "and make the forest turn to wine",
        "and make you",
        "and one again after the fall",
        "and pretend that none of us see the fall",
        "and the butter's getting hard",
        "and the filling of the crates",
        "and the little boy started",
        "and the walking of the cranes",
        "and they're coming close to the shore sir, shore sir",
        "and told you",
        "and we are the ones that want to choose",
        "and we don't live in a fascist nation",
        "and we fall alone",
        "and we light up the sky",
        "and we're out of time it'll show your mind",
        "and where the fuck are you?",
        "and you lost it all",
        "and you slither up to me",
        "and you whisper up to me",
        "and you, a parasite",
        "and your feet are dry",
        "and your guide is shy",
        "and your love to the fire",
        "and your mermaids cry",
        "and your rivers fly",
        "another prison system",
        "appeasing",
        "approaching guiding light",
        "are you",
        "arise as did the gods ninti",
        "around you",
        "around you, around you, around you",
        "art thou not human man",
        "as I turn to sand",
        "ask your people",
        "ask your people what is right",
        "ass",
        "at our, at our heads",
        "at the expense of the american dream",
        "attack all the homes and villages",
        "attack all the schools and hospitals",
        "attack! (attack!)",
        "attack, attack your fetal servitude",
        "attack, attack, attack with pesticide",
        "available for all the kids",
        "awake",
        "away, gold dust",
        "back to the river aras!",
        "banana banana banana banana terracotta banana terracotta terracotta pie!",
        "banana banana banana banana terracotta banana terrecotta terracotta pie!",
        "banana banana banana terracotta banana terracotta terracotta pie!",
        "banana banana banana terracotta banana terrecotta terracotta pie!",
        "barbarisms by barbaras",
        "baseball",
        "baseball!",
        "batallions of riot police",
        "baton courtesy",
        "beat em' beat em' beat em' beat em'",
        "beat the meat (beat the meat)",
        "because your love lasts a lifetime",
        "before you know",
        "before you know I will be waiting all awake",
        "beliefs, they're the bullets of the wicked",
        "believing, then keeling",
        "believing, then kneeling",
        "belonging",
        "belonging to",
        "bet you didn't know",
        "bet you it's nabisco",
        "beyond the staples center you can see america",
        "bicycles, shoestrings",
        "bit! bit! bit!",
        "blame, hate, for fate's seed",
        "blast off, it's party time",
        "bleeding in a sink, poisoning a drink",
        "bleeding in a sink, trampling a shrink",
        "bleeding till the day that",
        "blew off his own mother-fuckin head",
        "books all say different things while people flap their yellow wings",
        "books illustrate what we already know",
        "boom, boom, boom, boom",
        "boom/boom/boom/boom/boom/boom/boom",
        "boom/boom/boom/boom/boom/boom/boom/boom",
        "bounce pogo",
        "brainwashing",
        "brandy for the nerves",
        "breaking into fort knox",
        "breathing each other's lives",
        "bring about revolution",
        "bring about the collusion",
        "bring about the fusion",
        "bring about the solution",
        "bring it about",
        "bubbles erotica",
        "burning through the world's resources, then we turn and hide",
        "burning up",
        "but a little bit bit bit, shame!",
        "but a little bit, bit, bit",
        "but I can see you through the snowblind",
        "but I can't see you 'cross the streamline",
        "but I can't see you through the snowblind",
        "but I cannot grow",
        "but I was in there for you",
        "but I was waiting for you",
        "but I wasn't there for you",
        "but if you want the answers",
        "but just one pogo stick",
        "but to be a little whore",
        "but to wear a little dress",
        "but we find it all",
        "but you never want to lose",
        "but you never want to stay",
        "button collects price of his time",
        "buy, buy, buy, buy, buy",
        "by myself, by myself",
        "call it insane, yeah they call it insane, (sugar)",
        "call of the righteous man",
        "can you break out",
        "can you feel their haunting presence?",
        "can you hear the holy mountains?",
        "can you say brainwashing?",
        "can't you lookat my shaved ass",
        "can't you see that I love my cock?",
        "can't you see that we love my cock?",
        "can't you see that you love my cock?",
        "candles cry towards the sky",
        "caressing our smiles inside",
        "cause everyone needs a mother, fucker!",
        "cause I'm already there.(sugar)",
        "cause we are the ones that want to play",
        "cause you",
        "ceremonies have killed religions for they provide",
        "chasing a clown",
        "chinese tricks in rooms",
        "choking chicks and sodomy!",
        "choking with a link, killing with a stink",
        "cigaro cigaro cigar",
        "circumvent your thick ego",
        "circumventing circuses",
        "cliche people cannot dare",
        "cliche people cannot dare, dare, dare, dare",
        "cliche people organs rare",
        "clock men for they will fail",
        "cobblestones under your wheels",
        "come join the cause, come join the cause!",
        "confidence, death, insecurity",
        "conquest to the lover",
        "consciously it seems",
        "conversion, software version 7.0",
        "cool, in denial",
        "corn everywhere canned",
        "coupled with condemnations",
        "crack pipes, needles, pcp and fast cars",
        "creating death showers",
        "crossed and terrored",
        "cruelty to the winner, bishop tells the king his lies",
        "crying freedom!",
        "cursed earth, cursed earth, cursed earth, cursed earth",
        "dancing in the desert blowing up the sun",
        "dancing in the desert blowing up the sunshine",
        "dare",
        "dark is the light",
        "dead men lying on the bottom of the grave",
        "defaced street lights",
        "desensitized by tv",
        "designed for profiteering",
        "die",
        "die for her philosophy",
        "die her philosphy",
        "die her philosphy die",
        "die walk down",
        "die, like a mother fucker",
        "die... die... die... die... why",
        "directing your light",
        "directing your night",
        "disorder, disorder, disorder",
        "do we all learn defeat from the whores with bad feet",
        "do we die",
        "do we die?",
        "do we! do we know, when we fly?",
        "do we, do we know",
        "do you believe, when you're high",
        "do you ever believe you were stuck out in the sky",
        "do you ever try to fly",
        "do you ever try to fly?",
        "do you hear us we are rotting?",
        "do you really want to think and stop",
        "do you want me to try",
        "don't be late for school again boy",
        "don't be late for school again girl",
        "don't eat the fish",
        "don't ever get stuck in the sky, when you're high",
        "don't ever try to fly, don't ever try to fly",
        "don't ever try to fly, unless you leave your body on the other side",
        "don't leave your seats now",
        "don't you ever get stuck in the sky",
        "don't you realize, evil, lives in the mother-fucking skin",
        "don't you, realize, evil, lives in the mother-fucking skin",
        "don't you, realize, that evil, lives in the mother-fucking skin",
        "down pogo, up pogo",
        "down... down... walk down",
        "dreaming of screaming",
        "dreaming of the day that",
        "dreaming! dreaming the night! dreaming all right!",
        "dreams are made winding through her hair",
        "dreams are made winding through my head",
        "drug money is used to rig elections and train brutal corporate sponsored dictators around the world",
        "drugs are now your global policy, now you police the globe",
        "drugs became conveniently",
        "eat all the grass",
        "eat all the grass that you want",
        "eat em' eat em' eat em' eat em'",
        "eating seeds as a pastime activity",
        "education fornication, in you are go",
        "education subjugation, now you're out go",
        "education, fornication, in you are go",
        "ego brain",
        "elimination why",
        "eloquence belongs",
        "even if he doesn't really want to",
        "ever think you know why",
        "every minute, every second",
        "every time I look in your eyes, every day I'm watching you die",
        "every time you drop the bomb",
        "everybody's going to the party have a real good time",
        "everybody, everybody, everybody cries",
        "everybody, everybody, everybody dies",
        "everybody, everybody, everybody fucks",
        "everybody, everybody, everybody livin' now",
        "everybody, everybody, everybody sucks",
        "everyone cried, everyone cried",
        "everyone gets to play",
        "father, father, father, father",
        "father, into your hands",
        "father, into your hands I commend my spirit",
        "fear not the gods that come from the sky",
        "fear waits, for us",
        "feeling ten feet tall",
        "felt like the biggest asshole",
        "fighting crime, with a partner",
        "fighting off the diseased programming",
        "fighting other men",
        "filtering information",
        "finality waits outside",
        "fish that don't drown",
        "flashlight reveries caught in the headlights of a truck",
        "flaunt your will at every wheel",
        "flying over a great bay",
        "following the rights movement",
        "for brand new spankin' deals",
        "for darts screech by my desires",
        "for land, for land",
        "for reasons undefined, reasons undefined",
        "for the disproportioned malcontents",
        "for the mighty conquered meal",
        "for the new guns",
        "for the public eye",
        "for today we will take the body parts and put them on the wall",
        "for treated indigenously, digenously",
        "for treated indigenously, digenously (we lost consumer confidence in casual karma, casual karma)",
        "for treated indigenously, digenously (we're the prophetic generation of bottled water, bottled water)",
        "for you and I, for you and I, for you and I",
        "for you and I, for you and I, for you and I, for you and I",
        "for you and me to live in",
        "for you must enter a room to destroy it",
        "forewarned customary spirits",
        "forgiveness is",
        "free thinkers are dangerous",
        "freedom",
        "friction, lines, bumps",
        "friends for years images in red",
        "from a post up high",
        "from a well trained eye",
        "from beyond",
        "from starvation",
        "from the time you were a",
        "from where you see the ships afar",
        "fuck the system!",
        "fuck you pig",
        "fuck you, it all goes away",
        "gaining independence",
        "generation",
        "get ready for the fire",
        "ghosts are now waiting for you",
        "girl",
        "give a piece of your ass",
        "giving your force",
        "gliding through many hands",
        "go away, away",
        "go away, go away",
        "god is wearing black",
        "god of consumerism",
        "gonna let you mother fuckers die",
        "gonorrhea gorgonzola",
        "goodbye",
        "goodbye (I wasn't there for you)",
        "goodbyes are long",
        "grab a brush and put a little make-up",
        "grab a brush and put a little makeup",
        "guest vibrations",
        "hallelujah wink, getting on the brink",
        "hallelujah wink, murdering a shrink",
        "handed to obsoletion",
        "hangars sitting dripped in oil",
        "have consumed our euphoria",
        "have no questions but I sure have excuse",
        "have you ever wanted to die, you ever wanted to die?",
        "haven't we paid penance",
        "he wants nothing less",
        "he's come so far to find no truth",
        "he's come so far to find the truth",
        "he's gone so far to find no hope",
        "he's never coming back",
        "he's never going home",
        "her dreams that her country left with no one there",
        "her name was jesus",
        "her, discourse, is that we all don't survey",
        "here you go create another fable",
        "hey man don't you touch my belt",
        "hey man look at me rockin' out",
        "hey man! look at me rockin' out",
        "hey mr. jack",
        "hey where you at",
        "hey you, are me, not so pretty",
        "hey you, see me, pictures crazy",
        "hey, hey, hey, hey",
        "hide in the sky, hide in the sky!",
        "hide the scars to fade away the shake-up",
        "hide the scars to fade away the shake-up (hide the scars to fade away the... )",
        "his child, partisan brother of war",
        "his, his remorse, was that he couldn't survey",
        "history teaches us so",
        "ho",
        "hoist around the spade",
        "holding this in mind",
        "honor! murderer! sodomizer!",
        "housing all your fears",
        "how do I feel",
        "how do you own disorder",
        "how do you own disorder, disorder",
        "human right is private blue chip, pry",
        "human right is private blue chip, pry (causing poor populations to die, to die, to die)",
        "human right is private blue chip, pry (confetti, camouflage, camouflage, the flage, the flage)",
        "humans everywhere, canned",
        "I am just a man",
        "I brought my pogo stick",
        "I buy my crack, my smack, my bitch right here in hollywood",
        "I can wrestle with the stormy night",
        "I can't see your souls through through your eyes",
        "I cannot deny",
        "I cannot disguise",
        "I close my windows crank the heat up high",
        "I cry when angels deserve to die",
        "I don't eat, anymore",
        "I don't feel",
        "I don't feel it any more",
        "I don't hear, anymore",
        "I don't know, how I feel when I'm around you",
        "I don't live, anymore",
        "I don't see, anymore",
        "I don't sleep, anymore",
        "I don't speak, anymore",
        "I don't think you trust",
        "I forgot to",
        "I forgot to let you know that",
        "I got a gun the other day from sako",
        "I got pictures on my mind",
        "I guess I'll always be at home",
        "I had an out of body experience",
        "I hate these thoughts I can't de-",
        "I hate these thoughts I can't deny",
        "I have a home",
        "I have a problem that I cannot explain",
        "I have no reason why it should have been so plain",
        "I have some pictures, the wild might be the deuce",
        "I have to find you",
        "I have to meet you",
        "I hope your stepson doesn't eat the fish",
        "I know weather's gonna be fine",
        "I know, how I feel when I'm around you",
        "I lack the reason why I should be so confused",
        "I need someone to make some cash selling",
        "I need someone to save her ass",
        "I need someone to save my ass",
        "I need to find you",
        "I need to fuck the sys",
        "I need to fuck the sys!",
        "I need to fuck the system!",
        "I need to seek my innervision",
        "I need your guidance",
        "I need, I feel, a love",
        "I never want to be alone",
        "I play russian roulette everyday, a man's sport",
        "I saw her laugh",
        "I shone life into the man's hearts",
        "I sit, in my desolate room, no lights, no music",
        "I think me, I want a house and a wife",
        "I think me, I want life",
        "I want to be",
        "I want to fuck my way to the garden",
        "I want to shimmy-shimmy-shimmy",
        "I was standing on the wall",
        "I wasn't there",
        "I wasn't there for goodbye",
        "I wasn't there for you",
        "I went out on a date",
        "I will never feed off the evergreen luster of your heart",
        "I wouldn't frown",
        "I wrote you",
        "I'll wait here",
        "I'm a midnight fist fight",
        "I'm away forever, but I'm feeling better",
        "I'm just demeaning the pack!",
        "I'm just sitting in my car and waiting for my",
        "I'm just sitting in my car and waiting for my girl",
        "I'm just sitting in my room",
        "I'm just the man in the back!",
        "I'm looking for a mother that will get me high",
        "I'm looking for some help",
        "I'm on the radio!",
        "I'm on the radiooooooo",
        "I'm on the video!",
        "I'm on the videooooooo",
        "I'm, but a little bit bit bit, show!",
        "I've been walking through your streets",
        "I've forgotten to",
        "I've got nothing, to gain, to lose",
        "I've killed everyone",
        "I, I know, how I feel when I'm around you",
        "i-e-a-i-a-i-o",
        "i-e-a-i-a-i-o, why?",
        "icicles stretching",
        "if I fell like walking you best come along",
        "if you are the light post",
        "if you point your questions",
        "in my self-righteous suicide",
        "in spite of the pain",
        "in the car",
        "in the car, in the car, in the car",
        "in the end it all goes away",
        "in the power struggle",
        "in this little piece of typical tragedy",
        "in your eyes forsaken me",
        "in your heart forsaken me, oh",
        "in your life of tragedy",
        "in your pimpin majesty",
        "in your thoughts forsaken me",
        "indoctrination of a nation",
        "innervision",
        "innervision, innervision",
        "international security",
        "into moses' dry mouth",
        "into the eyes of the night",
        "is faith, faith, faith, faith",
        "is suck out my mother fucking brains, my brains (sugar)",
        "is that the cause of your demise",
        "is that the cause of your surprise",
        "is that the mouthwash in your eyes",
        "is that the trick of your disguise",
        "is the name of the game",
        "is there a perfect way of holding you baby?! (liar)",
        "it was so exotic",
        "it'll show your mind that you have a mind",
        "it's a day that I can't stand",
        "it's a day that I'll never miss",
        "it's a day that I'm glad I survived",
        "it's a non-stop disco",
        "it's a violent pornography!",
        "it's all over, it's all over it's all over",
        "it's already where I am",
        "it's cute, small, fits right in my pocket",
        "it's got you coming back for more",
        "it's got you screaming back for more",
        "it's got you screaming back for more!",
        "it's in the making baby",
        "it's in the taking, making, baking, taking, faking",
        "it's never too late to reinvent the bicycle",
        "it's on the tv",
        "it's on your tv",
        "jack gilardi is ten feet tall",
        "jump pogo?",
        "jump, bounce, down, up",
        "just a stupid motherfucker if I die I die",
        "just anger",
        "just another fool to roast",
        "just another stool to post",
        "just demeaning the pack!",
        "just find another host",
        "just got shot, now recovered",
        "just got shot, now recovered, why?",
        "just look at us now",
        "just the back!",
        "just the man in the back!",
        "just to show her a trick",
        "just your mother's",
        "justified candy!",
        "kidnapped by the likes of pure conjecture",
        "killers never hurt feelings",
        "killing with a stink, bleeding in a sink",
        "kind of mix really well and a dead movie star",
        "kneeling roses disappearing",
        "know",
        "la la la la la la la la la",
        "la lie lie lie lie lie lie",
        "lalalalalalalalalalalalalalalalala",
        "lalalalalallalaalalalalalaalalalala",
        "lamenting in process",
        "leaving the people to fend for them selves",
        "leaving the senses to fend for them selves",
        "left a message but it ain't a bit of use",
        "left with no arms",
        "lend me thy blades",
        "let your mother pray, (sugar)",
        "letting the reigns go to the unfolding",
        "levers erect note of his rhyme",
        "liar!",
        "liar! killer! demon!",
        "lie naked on the floor and let the messiah go all through our souls",
        "lie naked on the floor and let the messiah go through our souls",
        "life",
        "life in a bubble jungle",
        "life is a waterfall",
        "life is but a dream, drifting on a stream, a stream",
        "life threatening lifestyles",
        "life you get old, it's the race",
        "life, so, unnecessary",
        "lights are on their track",
        "little girl bled",
        "little girl glared",
        "little men, big guns, pointed at our heads",
        "lives rearranged and lives in my range can you breath",
        "lives rearranged and lives in my range can you see",
        "lois lane, jimmy carter",
        "lois lane, jimmy carter, (siren)",
        "long not for the one who've lost their way",
        "longing to roam",
        "look at all of them beg to stay",
        "look at each other",
        "looking at life through the eyes of a tire hub",
        "looking for a mother that will get me high",
        "looking good, mirrorism",
        "losing all violence",
        "lost in a trance",
        "loud and noisy",
        "love after it rains",
        "makes you high makes you hide",
        "makes you really want to go stop",
        "makes you really want to go, stop",
        "makes you really want to think and stop",
        "making a decision of death",
        "making two possibilities a reality",
        "man made shame",
        "man made shame, shame",
        "manufacturing consent",
        "marching forward hypocritic",
        "matador corporations",
        "may I please remain in this space",
        "may I remind you",
        "maybe you're a joker, maybe you deserve to die",
        "maybe you're a mourner, maybe you deserve to die",
        "maybe you're a sinner into your alternate life",
        "me and frankie avalon",
        "me and heroin, maybe we can make some cash",
        "meeting john dale jr",
        "melt in the sun, melt in the sun!",
        "men fall unrealized",
        "men fall unrealized, unrealized, unrealized",
        "mezmerize the simple minded",
        "mimes overtaken by the signs of the right",
        "mine delusions acquainted",
        "minor drug offenders fill your prisons you don't even flinch",
        "mirror your face",
        "modern globalization",
        "more wood for their fires, loud neighbours",
        "mow down the sexy people",
        "mushrooms, olive, chives",
        "must be approved by his god",
        "mutually, mentally molested children of a mother",
        "mutually, mentally molested children of sin",
        "my blue moon rivets in exits",
        "my cock can walk right through the door",
        "my cock is much bigger than yours",
        "my girl, you know, she lashes out at me sometimes",
        "my horse and my remorse",
        "my horse is a shackled old man",
        "my love waits for me in daytime",
        "my memories are of fun and friendship",
        "my pupils dance",
        "my shit stinks much better than yours",
        "my shit stinks right down to the floor",
        "my source is the source of all creation",
        "my source, and my remorse",
        "my sweet clementine",
        "my sweet revenge",
        "my tapeworm tells me what to do",
        "my tapeworm tells me where to go",
        "na, na-na-na",
        "nanananananaana ahhhhhhh",
        "nearly 2 million americans are incarcerated in the prison system, prison system of the us",
        "need the one you love and love the ones you bleed",
        "need the one you love and love the ones you need",
        "need therapy, therapy",
        "need therapy, therapy advertising causes",
        "needs a reason to kill man",
        "never try to die, you ever try to die",
        "new, what do you own the world?",
        "no circumcisions on the chair",
        "no flag large enoguh",
        "no need to multiply",
        "no need to nullify",
        "no one saved us, no one saved us",
        "no one saved us, no one's gonna save us now",
        "no one, no one's gonna save us now!",
        "no one, no one's gonna save us now, not even god!",
        "no televisions in the air",
        "nobody gives a fuck",
        "not human man art thou",
        "not short another chuckle",
        "now I rise, and then fall",
        "now leaving town",
        "now the dishes can be cleared",
        "now the little boy sees",
        "now we have found",
        "now will you live at your own pace?",
        "now you fly in peace, I hope, my friend",
        "now, somewhere between the sacred silence, sacred silence and sleep",
        "of centuries, centuries, centuries, centuries",
        "of judgement and deliverance",
        "of plastic existence",
        "of some old dying man",
        "of the american dream, of the american, of the american",
        "of war, we don't speak anymore",
        "of weakness within the strength of youth",
        "oh oh ah",
        "oh when will I be free",
        "oh, baby, you and me",
        "oh, I like to spread you out",
        "old school hollywood",
        "old school hollywood baseball",
        "old school... hollywood",
        "on my sweet revenge",
        "on the other side, on the other side, the other side",
        "on the side of the freeway in the car",
        "one flag, flaggy but one",
        "one that smiled when he flew over the bay",
        "one was written on the sword",
        "ounce is gone, and god is once",
        "our days are never coming back",
        "our days are never ever coming back",
        "our shallow years in fright",
        "out of control boy without a dad",
        "overbearing advertising",
        "painting the paintings of the alive",
        "parachute your chocolate soul",
        "peaceful loving youth against the brutality",
        "people all grow up to die",
        "people are always chasing me down",
        "people feeding frenzy",
        "people on the soldier side",
        "pepperoni and green peppers",
        "permanence unfolding in the absolute",
        "peter's pecker picked another",
        "phony people come to pray",
        "photographic relapse",
        "pickle bearing pussy pepper, why?",
        "pizza-pizza pie",
        "plagiarized existence exist",
        "playing the show and running down the plane",
        "pleading to disperse",
        "plutonium wedding rings",
        "poisoning a drink, bleeding in a sink",
        "poisoning a drink, getting on the brink",
        "popcorn everywhere, canned",
        "post hypnotic suggestions",
        "potent element of human existence",
        "powers of bright darkness",
        "prediting the future of things we all know",
        "preflight delight",
        "prescence sponsored fear",
        "propaganda leaves us blinded",
        "protectors on your back",
        "psycho groupie coke",
        "psycho, groupie, cocaine, crazy",
        "pull the tape worm out of me",
        "pull the tapeworm out of your ass, hey",
        "puppeting your frustrations",
        "push the weak around",
        "pushing little children",
        "put you hands up, get out of the car",
        "racing your flags along polluted coast",
        "rare",
        "ravages of architecture",
        "realise you're blind",
        "reasons undefined, reasons undefined",
        "recognition, restoration, reparation",
        "revolution, the only solution",
        "revolving fake lawn houses",
        "right before they go gray",
        "right before they went gray",
        "right here in the power struggle",
        "right in the power struggle",
        "right now, right now",
        "right now, right now, right now, right now, right now, right now, right now, pararara",
        "round, round",
        "runaway, expose'",
        "running away, a trivial day",
        "running the ships ashore",
        "rushing to watch your spirit fully drop",
        "say you're the best they've ever seen",
        "science fails to recognise the single most",
        "science has failed our mother earth",
        "science has failed our world",
        "seeing you believing",
        "selling ass for heroin",
        "service with a smile",
        "seven a.m. morning, came to take us away",
        "shake your spear at shakespeare",
        "shame on a man un cuffs",
        "shame, love after it rains",
        "she had so many friends",
        "she lost her head",
        "she lost her mind",
        "she wants nothing more",
        "she's like heroin",
        "she's scared that I will take her away from there",
        "sheets of the denial",
        "sheets of the night",
        "shot the gun that startled my life",
        "should be banned",
        "shoulda been could been",
        "shouldn't exist",
        "show your people",
        "show your people how we died",
        "signs of your face",
        "silent my voice, I've got no choice",
        "single files of clean feedings",
        "sipping through a little glass",
        "sitting around all day",
        "sitting in my room",
        "slowing your pace",
        "smart people outsmart each other",
        "snake in the ground",
        "so I felt like the biggest asshole",
        "so you want the world to stop",
        "so you want to see the show",
        "some people, some people, some people",
        "someone kick me out of my mind",
        "someone kicked her into the back of the line",
        "someone's blank stare deemed it warfare",
        "someones mouth said paint them all red",
        "somewhere between the sacred silence and sleep",
        "speak with me my only mind",
        "spirit-moves-through-all-things",
        "standing in the sun I'm about to melt",
        "standing in the sun I'm wasting my time",
        "stars in their place",
        "stealing our intentions",
        "still you feed us lies from the table cloth",
        "stop in and watch your body fully drop",
        "stop your eyes from flowing out",
        "strong refrigerators",
        "stupid people do stupid things",
        "subjugation of damna",
        "subjugation of damnation",
        "such a lonely day",
        "suffering, suffering now!",
        "superstition taking all of us for a ride",
        "sweet berries ready for two ghosts are no different than you",
        "sweet danny and lisa",
        "sweet danny and lisaaaaaaaaa",
        "swimming through the void",
        "take me down there",
        "take this promise for a ride",
        "take this promise to the end of you",
        "take your hand and walk away",
        "taken away",
        "taken away all of our pride",
        "television in disgrace",
        "television made you buy it",
        "tell everyone in the world, that I'm you",
        "tell the people",
        "tell the people that arrive",
        "terracotta pie (hey!)",
        "terracotta pie!",
        "terracotta terracotta terracotta pie!",
        "that if we fall, we all fall",
        "that led the noble, to the east",
        "that your life is tried",
        "the armed response of an entire nation",
        "the bombing of all homes and villages?",
        "the bombs are falling over our head with no sight",
        "the bombs are falling overhead with no sight",
        "the bottom line is money",
        "the bullet connects to the price of her crime",
        "the cannons of our time",
        "the clouds become unreal",
        "the cold insincerity of steel machines",
        "the crying walls of sliding architecture",
        "the devil is so lovely",
        "the door is closed",
        "the evening of the moon",
        "the ever so popular beating that broke your skin",
        "the ever so popular beating that took you under",
        "the fall guy accord",
        "the falling of christ",
        "the few that remained were never found, (never want to see you around)",
        "the fog will surely chew you up",
        "the following of a christ",
        "the highway song complete",
        "the kinda shit that's on your tv!",
        "the kinda shit you get on your tv!",
        "the kombucha mushroom people",
        "the lights are out",
        "the lines in the letter said, 'we have gone to hackensack'",
        "the little boy smiled, it'll all be well",
        "the lovers connect to the price of his dime",
        "the man you fight",
        "the masked comforts to delusionals, they're all in fright",
        "the most loneliest day of my life",
        "the national debt is at times an ally",
        "the orange light that follows",
        "the other day",
        "the people collect undeniable data",
        "the percentage of americans in the prison system, prison system, has doubled since 1985",
        "the phoenix he helped create",
        "the pictures of time and space are rearranged",
        "the piercing radiant moon",
        "the plan was mastered and called genocide (never want to see you around)",
        "the power struggle",
        "the purest forms of life",
        "the reason he must attain",
        "the remainder is",
        "the road keeps moving clouds",
        "the road that leads to all, leads to one",
        "the road that leads to one",
        "the senses collect undeniable data",
        "the sheep that ran off from the herd may be dead but now's a bird",
        "the ships are multiplying day after day sir",
        "the signs are all turning right",
        "the skes, right before",
        "the skies, right before",
        "the sky becomes complete",
        "the spiders all in tune",
        "the storming of poor june",
        "the strangest places",
        "the toxicity of our city, of our city",
        "the true believer's head was bathed in sunlight",
        "the ultimate sacrifice",
        "the unsettled mind is at times an ally",
        "the v-chip gives them sight",
        "the waves all keep on crashing by",
        "then she said, 'go away'",
        "then she said, then she said",
        "then themselves, then themselves",
        "then turns to rust",
        "then we turn around and put up our walls",
        "then you own the working class",
        "then, the people found out the lie",
        "then, the senses wanted the sky",
        "therapy, therapy",
        "there is no flag that is large enough",
        "there is no one here but me",
        "there is only one true path to life",
        "there's nothing wrong with me",
        "there's something wrong with me",
        "there's something wrong with you",
        "they disguise it, hypnotize it",
        "they find you",
        "they have all returned resting on the mountain side",
        "they have returned resting on the mountain side",
        "they like to push the weak around",
        "they lined up double quick",
        "they look at you in disgusting ways",
        "they only send the poor",
        "they take me away from",
        "they take you",
        "they were crying when their sons left",
        "they're trying to build a prison",
        "they're trying to build a prison for you and me",
        "this ballgame's in the refrigerator",
        "this is my front page",
        "this is my new age",
        "those vicious streets are filled with strays",
        "through my head",
        "through the break of dawn yeah",
        "through the eyes of delight",
        "till my palms are wet and my tongue is dry",
        "till the moment is revealed",
        "till you eat the last of me",
        "time feels like a midnight ride",
        "to fight the heathens",
        "to hide the shame of a man in cuffs",
        "to see the land the women chant as they fly up to the sun",
        "to the conqueror",
        "to the forest of denial",
        "to the new guns, to the new guns",
        "to the old gods and moved on",
        "to the sweet, milky seat",
        "to visible police",
        "to whom was sold, this bounty soul",
        "today you saw, you saw me, you explained",
        "tony danza cuts in line",
        "took all the children and then we died, (never want to see you around)",
        "touching whoever's behind",
        "trained and appropriate for the malcontents",
        "trampling a shrink, bleeding in a sink",
        "transforming us into muted dreams",
        "traveling hearts divide the throne",
        "treat the feet (treat the feet)",
        "trust in my self-righteous suicide",
        "truth is the only sword bleeding minds",
        "try her philosophy",
        "trying to push my face to the ground",
        "trying to soar by being a whore of life and almost everything",
        "turn off your tv",
        "two skies fading ones abiding",
        "two skies living it all fading",
        "two skies seeing them both dying",
        "two skies two sons watching their own war",
        "two skies watching it all fading",
        "two suns fighting ones abiding",
        "two suns living it all dying",
        "two suns seeing them both dying",
        "two suns watching them both fighting",
        "two-time you",
        "unannounced twister games",
        "unnecessary death",
        "unrealized, unrealized",
        "upholstery loving men all dwelling in the wells",
        "upon your naked walls, alive",
        "us adhering",
        "utilising drugs to pay for secret wars around the world",
        "vicinity of obscenity in your eyes!",
        "victorious, victories kneel",
        "vision",
        "waiting for the tomb",
        "wake up (wake up)",
        "walk with me my little child",
        "walk with me my little friend",
        "walk with me until the end",
        "walk with me until the time",
        "want me to try",
        "wanting to get you high",
        "wanting to touch the sky",
        "war staring you in the face, dressed in black",
        "war!",
        "warning",
        "was fashion the reason why they were there?",
        "was it the riches, of the land",
        "was the philosophy of displaced mines",
        "washed up hollywood",
        "wasn't it their bed",
        "watch my world dissolve",
        "watch them all fall down",
        "watching",
        "we all need to fuck the system!",
        "we attack",
        "we bring about the confusion",
        "we can't afford to be neutral on a moving train",
        "we don't give a damn about your world",
        "we don't give a fuck about your world",
        "we don't need to multiply",
        "we don't need to nullify",
        "we drink from the river",
        "we fought your wars with all our hearts",
        "we have learned that you have no",
        "we hear the word",
        "we lose ourselves",
        "we must call upon our bright darkness",
        "we need to evacuate the light post",
        "we offer prayers for your long lost soul",
        "we shall attack!",
        "we will fight the heathens",
        "we're crossed and terrored",
        "we're free",
        "we're going down in a spiral to the ground",
        "we're left with no arms",
        "we're one in the river",
        "we're the animators that de-animate",
        "we're the cruel regulators smoking",
        "we're the power struck",
        "we're the propagators of all genocide",
        "we're the regulators that de-regulate",
        "we've taken all your shit, now it's time for restitution",
        "wearing a crown",
        "weeping in perplexity's arms",
        "welcome to the soldier side",
        "well advertising's got you on the run",
        "well I'm not there all the time you know",
        "well, I know time reveals in hindsight",
        "what a splendid pie",
        "what do I say",
        "what have we said",
        "what is in us that turns a deaf ear to the cries of human suffering?!",
        "what of presence",
        "when he's meant to do it",
        "when I became the sun",
        "when I feel like talking I'll never be wrong",
        "when I felt like the biggest asshole",
        "when I killed your rock n roll",
        "when the holy land was taken",
        "when the present can't be sealed",
        "when they called and said that they thought he was dead",
        "when we fly",
        "when we speak we can peak from the windows of their mouths",
        "when we're crying for our next fix",
        "when we, when we go",
        "when you free your eyes eternal prize",
        "when you lose small mind",
        "when you, do come out",
        "when your castle breaks",
        "when your moon is fake",
        "when your stars are baked",
        "when your tunnel fades",
        "where all they really want to do",
        "where all you money's earning",
        "where all your building's crying",
        "where do you expect them to go when the bombs fall?",
        "where do you expect us to go when the bombs fall?",
        "where I really want to be",
        "where the fuck are you?",
        "where there is no one here but me",
        "where theres no one here but me",
        "where were the eyes of a horse on a jet pilot",
        "where you're going to the bottom",
        "while billions spent on bombs",
        "while everyone around you pled",
        "while I drove him with a forty-five",
        "while I turn to sand",
        "while you are talking all detached, detached, detached, detached, detached",
        "while you are talking all detached, so tell us",
        "while you are walking all detached, so tell us",
        "who can believe you",
        "who victored over, the seljuks",
        "who wants to come with me and come join the cause!",
        "who wants to come with me and hide in the sky!",
        "who wants to come with me and hide in the sky?",
        "who wants to come with me and melt in the sun?",
        "whore!",
        "why",
        "why can't you see that you are my child",
        "why did you go there?",
        "why do they always send the poor!",
        "why do they always send the poor?",
        "why don't presidents fight the war?",
        "why don't you ask the kids at tiananmen square?",
        "why don't you know that you are my mind",
        "why have you forsaken me?",
        "why why",
        "why'd you leave the keys upon the table?",
        "why, do, they always send the poor",
        "why, like a mother fucker",
        "why, why, why, why",
        "why, why, why, why must we kill, kill, kill, kill, our own, own, own, own kind",
        "will be yours for the taking",
        "will be yours it's in the making",
        "will be yours, for the taking",
        "will soon proclaim itself a god",
        "will you live at your own pace",
        "winked an eye and point a finger",
        "winked an eye and point a finger, why?",
        "wired were the eyes of a horse on a jet pilot",
        "with a bullet called life, yeah mama called life,(sugar)",
        "with a feeling so pure",
        "with a girl, a bit late",
        "with a helmet, fierce",
        "with a needle in my hand",
        "with a sad statue of liberty",
        "with all your global profits and all your jeweled pearls",
        "with all your global profits, and all your jeweld pearls",
        "with all your prayers, incantations",
        "with danny and lisa",
        "with ghosts of hooker girlie dudes",
        "with it's tired poor avenging disgrace",
        "with pointed heels",
        "with rubber bullet kisses",
        "with the blinded flag",
        "with their fully automatics",
        "woah!",
        "wondering when jesus comes, are they gonna be saved",
        "wondering when savior comes, is he gonna be saved",
        "wooden farts, they're on the go",
        "woulda been would been you",
        "wrong with you and I",
        "yeah, alright",
        "yeah, right in my pocket, (sugar)",
        "yet you feed us lies from the table cloth",
        "you",
        "you and me should go outside and",
        "you and me will all go down in history",
        "you are gone (I wasn't there for you)",
        "you attack all the rapes and pillages",
        "you better get ready for the fire",
        "you better give a piece of ass",
        "you bring about the stick",
        "you can't see me suddenly",
        "you can't tell me that I'm real",
        "you changed the channel then you changed our minds",
        "you clamped on with your iron fists",
        "you closed our blinds",
        "you depend on our protection",
        "you die for her philosophy",
        "you don't care about how I feel",
        "you free your life",
        "you kill the god your child has born",
        "you know that every time I try to go",
        "you love to love the fear",
        "you made the weapons for us all",
        "you must now face authority",
        "you need to fuck the sys",
        "you never think you know why",
        "you ran the light at dawn",
        "you really don't have to be a ho",
        "you saw it all",
        "you saw the forest, now come inside",
        "you saw the product",
        "you saw the product of it all",
        "you see my pain is real",
        "you sent us back in body parts",
        "you should have never gone to hollywood",
        "you should have never trusted hollywood",
        "you switched the signs then you closed our blinds",
        "you take the legend for a fall",
        "you took me by the hand",
        "you took our wills with the truth you stole",
        "you took the legend for it's fall",
        "you wanted to",
        "you were the biggest fish out here",
        "you will take the body parts and put them on the wall",
        "you're crazy",
        "you're nothing like me",
        "you, you went beyond",
        "young men standing on the top of their own graves",
        "your life is in a bubble jungle",
        "your lives are open wide",
        "your neighboor, what a guy",
        "your prospect of living gone",
        "your sacred silence"
    ];

    let suggestion = soadQuoteRegExp.exec(body)[1];
    if (!suggestion)
        return quotes[Math.floor(Math.random() * quotes.length)];
    
    suggestion = suggestion.toLowerCase();
    let suggestedQuotes = quotes.filter((q) => q.toLowerCase().includes(suggestion));
    if (suggestedQuotes.length > 0)
        return suggestedQuotes[Math.floor(Math.random() * suggestedQuotes.length)];
    
    return "the quote fucked the system";
}
