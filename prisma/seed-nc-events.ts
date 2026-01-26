import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

const d = (dateStr: string, time: string = "22:00") => {
  const [h, m] = time.split(':').map(Number)
  const date = new Date(dateStr + 'T00:00:00-05:00')
  date.setHours(h, m, 0, 0)
  return date
}

const endTime = (start: Date, hours: number = 5) => {
  const end = new Date(start)
  end.setHours(end.getHours() + hours)
  return end
}

// Charlotte Venues
const cltVenues = {
  blackbox: { name: "Blackbox Theater", address: "1151 W. Tyvola Rd", city: "Charlotte", age: 18 },
  rabbitHole: { name: "The Rabbit Hole Charlotte", address: "1801 Commonwealth Ave", city: "Charlotte", age: 21 },
  underground: { name: "The Underground Charlotte", address: "820 Hamilton St", city: "Charlotte", age: null },
  fillmore: { name: "Fillmore Charlotte", address: "820 Hamilton St", city: "Charlotte", age: null },
  trio: { name: "Trio (Charlotte)", address: "227 N Tryon St", city: "Charlotte", age: null },
  musicYard: { name: "The Music Yard", address: "2433 Wilkinson Blvd", city: "Charlotte", age: 21 },
  horseshoe: { name: "The Horseshoe", address: "130 E 7th St", city: "Charlotte", age: 21 },
  bridgeStudios: { name: "The Bridge Studios at Northlake", address: "8720 Lindholm Dr", city: "Charlotte", age: null },
  truliant: { name: "Truliant Amphitheater", address: "800 Briar Creek Rd", city: "Charlotte", age: null },
  neighborhood: { name: "Neighborhood Theatre", address: "511 E 36th St", city: "Charlotte", age: 18 },
  visulite: { name: "Visulite Theatre", address: "1615 Elizabeth Ave", city: "Charlotte", age: null },
  cue: { name: "Cue (at Blackbox)", address: "1151 W. Tyvola Rd", city: "Charlotte", age: 21 },
}

// Raleigh/Durham Venues
const ralVenues = {
  undergroundRal: { name: "The Underground Raleigh", address: "820 S Salisbury St", city: "Raleigh", age: 21 },
  aura: { name: "Aura Raleigh", address: "3605 Capital Blvd", city: "Raleigh", age: 21 },
  fruit: { name: "The Fruit", address: "305 S Dillard St", city: "Durham", age: 18 },
  pourHouse: { name: "Pour House Music Hall", address: "224 S Blount St", city: "Raleigh", age: null },
  kingsRal: { name: "Kings Raleigh", address: "14 W Martin St", city: "Raleigh", age: 18 },
  lincolnTheatre: { name: "Lincoln Theatre Raleigh", address: "126 E Cabarrus St", city: "Raleigh", age: null },
  catsCradle: { name: "Cat's Cradle", address: "300 E Main St", city: "Carrboro", age: null },
  ritzRal: { name: "The Ritz Raleigh", address: "2820 Industrial Dr", city: "Raleigh", age: null },
  portalHQ: { name: "The Portal HQ", address: "3412 Wycliff Rd", city: "Raleigh", age: null },
  shadowbox: { name: "Shadowbox", address: "2525 Meridian Pkwy", city: "Durham", age: null },
  redHat: { name: "Red Hat Amphitheater", address: "500 S McDowell St", city: "Raleigh", age: null },
  grogAlley: { name: "Grog Alley", address: "517 W Jones St", city: "Raleigh", age: null },
}

const events = [
  // CHARLOTTE - Jan 2026
  { title: "Snow Strippers + anna luna", slug: "snow-strippers-clt-jan29", desc: "Hyperpop and electronic duo Snow Strippers with anna luna.", start: d("2026-01-29", "20:00"), venue: cltVenues.underground },
  { title: "Official Snow Strippers Afterparty", slug: "snow-strippers-afterparty-jan29", desc: "Official afterparty with anna luna, EERA, and more.", start: d("2026-01-29", "23:00"), venue: cltVenues.rabbitHole },
  { title: "Marie Vaunt 360 Show", slug: "marie-vaunt-clt-jan30", desc: "Immersive 360 show experience with Marie Vaunt.", start: d("2026-01-30", "21:00"), venue: cltVenues.blackbox },
  { title: "Maddy O'Neal", slug: "maddy-oneal-clt-jan30", desc: "Bass and funk producer Maddy O'Neal.", start: d("2026-01-30", "22:00"), venue: cltVenues.rabbitHole },
  { title: "Proppa", slug: "proppa-clt-jan30", desc: "UK house and garage DJ Proppa.", start: d("2026-01-30", "22:00"), venue: cltVenues.trio },
  { title: "Krewella", slug: "krewella-clt-jan31", desc: "Sister duo Krewella bring their high-energy show.", start: d("2026-01-31", "22:00"), venue: cltVenues.trio },
  { title: "MUVMNT: OFFIE", slug: "muvmnt-offie-jan31", desc: "Free entry house music party with OFFIE and friends.", start: d("2026-01-31", "18:30"), venue: cltVenues.horseshoe },
  
  // CHARLOTTE - Feb 2026
  { title: "Fox Stevenson + Yue", slug: "fox-stevenson-clt-feb4", desc: "Drum and bass star Fox Stevenson.", start: d("2026-02-04", "21:00"), venue: { ...cltVenues.trio, name: "Amos' Southend", address: "1423 S Tryon St" } },
  { title: "TWINSICK", slug: "twinsick-clt-feb6", desc: "DJ duo TWINSICK.", start: d("2026-02-06", "21:00"), venue: cltVenues.blackbox },
  { title: "Matroda", slug: "matroda-clt-feb6", desc: "Croatian house producer Matroda.", start: d("2026-02-06", "22:00"), venue: cltVenues.trio },
  { title: "Blunts & Blondes All Access Tour", slug: "blunts-blondes-clt-feb6", desc: "Dubstep producer Blunts & Blondes with WHOiSEE.", start: d("2026-02-06", "22:00"), venue: cltVenues.cue },
  { title: "Opiuo + parkbreezy", slug: "opiuo-clt-feb7", desc: "Australian electronic producer Opiuo with parkbreezy.", start: d("2026-02-07", "21:00"), venue: cltVenues.blackbox },
  { title: "Bradeazy + BUMMY", slug: "bradeazy-clt-feb7", desc: "Bass music night with Bradeazy and BUMMY.", start: d("2026-02-07", "22:00"), venue: cltVenues.trio },
  { title: "Phrva + ero808", slug: "phrva-clt-feb7", desc: "Underground bass with Phrva, ero808, and Vetack.", start: d("2026-02-07", "22:00"), venue: cltVenues.rabbitHole },
  { title: "Masquerave: TIME WZRD", slug: "masquerave-feb7", desc: "Masked rave with TIME WZRD, DJ Tari and more.", start: d("2026-02-07", "21:00"), venue: cltVenues.bridgeStudios },
  { title: "Jai Wolf", slug: "jai-wolf-clt-feb13", desc: "Indie electronic artist Jai Wolf.", start: d("2026-02-13", "21:00"), venue: cltVenues.trio },
  { title: "Simon Doty", slug: "simon-doty-clt-feb13", desc: "Deep house from Simon Doty.", start: d("2026-02-13", "22:00"), venue: cltVenues.musicYard },
  { title: "Boogie T + CYCLOPS", slug: "boogie-t-clt-feb14", desc: "Valentine's Day bass with Boogie T and CYCLOPS.", start: d("2026-02-14", "21:00"), venue: cltVenues.blackbox },
  { title: "Cazes", slug: "cazes-clt-feb14", desc: "Tulum-inspired deep house with Cazes.", start: d("2026-02-14", "22:00"), venue: cltVenues.trio },
  { title: "For the Love of Groove", slug: "love-of-groove-feb14", desc: "Valentine's groove night with Lex Longa and Pharro.", start: d("2026-02-14", "21:00"), venue: { ...cltVenues.musicYard, name: "Gallery House Charlotte" } },
  { title: "Black Violin: Full Circle Tour", slug: "black-violin-feb18", desc: "Classical hip-hop duo Black Violin.", start: d("2026-02-18", "20:00"), venue: { ...cltVenues.fillmore, name: "Belk Theater" } },
  { title: "JSTJR", slug: "jstjr-clt-feb19", desc: "Bass and Latin music from JSTJR.", start: d("2026-02-19", "22:00"), venue: cltVenues.trio },
  { title: "MIRRORVERSE TOUR: INZO + Truth", slug: "inzo-clt-feb19", desc: "Bass music showcase with INZO and Truth.", start: d("2026-02-19", "21:00"), venue: { ...cltVenues.blackbox, name: "Premier Event Center" } },
  { title: "Jauz", slug: "jauz-clt-feb20", desc: "Shark Squad leader Jauz.", start: d("2026-02-20", "22:00"), venue: cltVenues.trio },
  { title: "DRINKURWATER", slug: "drinkurwater-clt-feb21", desc: "Bass producer DRINKURWATER.", start: d("2026-02-21", "22:00"), venue: cltVenues.rabbitHole },
  { title: "MK", slug: "mk-clt-feb21", desc: "House music legend MK.", start: d("2026-02-21", "22:00"), venue: cltVenues.blackbox },
  { title: "ALLEYCVT Night 1", slug: "alleycvt-clt-feb26", desc: "9 Lives Tour with ALLEYCVT, Steller, Cozy Kev.", start: d("2026-02-26", "21:00"), venue: cltVenues.blackbox },
  { title: "ALLEYCVT Night 2", slug: "alleycvt-clt-feb27", desc: "9 Lives Tour Night 2 with ALLEYCVT, DENNETT, Tazu.", start: d("2026-02-27", "21:00"), venue: cltVenues.blackbox },
  { title: "Valentino Khan", slug: "valentino-khan-clt-feb27", desc: "Grammy-nominated producer Valentino Khan.", start: d("2026-02-27", "22:00"), venue: cltVenues.trio },
  { title: "Jay de Lys", slug: "jay-de-lys-clt-feb27", desc: "Colombian house DJ Jay de Lys.", start: d("2026-02-27", "22:00"), venue: cltVenues.musicYard },
  { title: "Ardalan", slug: "ardalan-clt-feb28", desc: "Dirtybird artist Ardalan.", start: d("2026-02-28", "22:00"), venue: cltVenues.rabbitHole },
  { title: "SCENE KID RAVE!!! XD", slug: "scene-kid-rave-feb28", desc: "2000s emo and scene nostalgia rave.", start: d("2026-02-28", "21:00"), venue: cltVenues.bridgeStudios },
  
  // CHARLOTTE - Mar 2026
  { title: "Lotus", slug: "lotus-clt-mar4", desc: "Jam band meets electronic - Lotus.", start: d("2026-03-04", "21:00"), venue: cltVenues.neighborhood },
  { title: "Machine Girl + Show Me The Body", slug: "machine-girl-clt-mar6", desc: "Psychowarrior Tour with Machine Girl.", start: d("2026-03-06", "20:00"), venue: cltVenues.underground },
  { title: "Desert Dwellers", slug: "desert-dwellers-clt-mar6", desc: "Downtempo and world bass from Desert Dwellers.", start: d("2026-03-06", "21:00"), venue: cltVenues.blackbox },
  { title: "Dirtwire", slug: "dirtwire-clt-mar6", desc: "Electronic Americana trio Dirtwire.", start: d("2026-03-06", "21:00"), venue: cltVenues.visulite },
  { title: "DJ Susan", slug: "dj-susan-clt-mar6", desc: "House DJ Susan.", start: d("2026-03-06", "22:00"), venue: cltVenues.trio },
  { title: "The Widdler: Midnight Mass", slug: "widdler-clt-mar13", desc: "Deep dubstep from The Widdler.", start: d("2026-03-13", "22:00"), venue: cltVenues.rabbitHole },
  { title: "Dave Summer", slug: "dave-summer-clt-mar13", desc: "Deep house from Dave Summer.", start: d("2026-03-13", "22:00"), venue: cltVenues.trio },
  { title: "Virtual Riot: Burning Out Winter Tour", slug: "virtual-riot-clt-mar14", desc: "Dubstep producer Virtual Riot.", start: d("2026-03-14", "21:00"), venue: cltVenues.blackbox },
  { title: "Vincent Antone + motifv", slug: "vincent-antone-clt-mar14", desc: "House music with Vincent Antone.", start: d("2026-03-14", "22:00"), venue: cltVenues.rabbitHole },
  { title: "Odd Mob", slug: "odd-mob-clt-mar19", desc: "Australian house producer Odd Mob.", start: d("2026-03-19", "21:00"), venue: cltVenues.blackbox },
  { title: "beastboi.", slug: "beastboi-clt-mar19", desc: "Bass producer beastboi.", start: d("2026-03-19", "22:00"), venue: cltVenues.trio },
  { title: "BEAUZ", slug: "beauz-clt-mar20", desc: "Brothers Bernie and Johan Yang as BEAUZ.", start: d("2026-03-20", "21:00"), venue: cltVenues.blackbox },
  { title: "Ely Oaks", slug: "ely-oaks-clt-mar20", desc: "Lo-fi house from Ely Oaks.", start: d("2026-03-20", "22:00"), venue: cltVenues.trio },
  { title: "Criso: Make Some Noise Tour", slug: "criso-clt-mar21", desc: "Bass house from Criso.", start: d("2026-03-21", "22:00"), venue: cltVenues.rabbitHole },
  { title: "Roddy Lima + JOHNNY!", slug: "roddy-lima-clt-mar21", desc: "Brazilian bass with Roddy Lima.", start: d("2026-03-21", "21:00"), venue: cltVenues.blackbox },
  { title: "Mindchatter", slug: "mindchatter-clt-mar24", desc: "Indie electronic artist Mindchatter.", start: d("2026-03-24", "21:00"), venue: cltVenues.underground },
  { title: "Witchz", slug: "witchz-clt-mar28", desc: "Heavy bass producer Witchz.", start: d("2026-03-28", "20:00"), venue: cltVenues.underground },
  { title: "Chef Boyarbeatz", slug: "chef-boyarbeatz-clt-mar28", desc: "Bass chef in the building.", start: d("2026-03-28", "22:00"), venue: cltVenues.rabbitHole },
  { title: "GENESI", slug: "genesi-clt-mar28", desc: "House music night.", start: d("2026-03-28", "21:00"), venue: cltVenues.blackbox },
  
  // CHARLOTTE - Apr-May 2026
  { title: "San Holo", slug: "san-holo-clt-apr3", desc: "Bitbird label boss San Holo.", start: d("2026-04-03", "21:00"), venue: cltVenues.trio },
  { title: "PEEKABOO + Nitepunk", slug: "peekaboo-clt-apr4", desc: "Weird bass from PEEKABOO and Nitepunk.", start: d("2026-04-04", "21:00"), venue: cltVenues.blackbox },
  { title: "Bob Moses + Cannons", slug: "bob-moses-clt-apr8", desc: "Electronic duo Bob Moses with Cannons.", start: d("2026-04-08", "20:00"), venue: cltVenues.fillmore },
  { title: "BOLO", slug: "bolo-clt-apr10", desc: "House night with BOLO.", start: d("2026-04-10", "22:00"), venue: cltVenues.cue },
  { title: "DANNY AVILA", slug: "danny-avila-clt-apr17", desc: "Spanish DJ Danny Avila.", start: d("2026-04-17", "22:00"), venue: cltVenues.trio },
  { title: "The Midnight", slug: "the-midnight-clt-apr19", desc: "Synthwave duo The Midnight.", start: d("2026-04-19", "20:00"), venue: cltVenues.fillmore },
  { title: "Carolina Open Air Day 1", slug: "carolina-open-air-apr24", desc: "Outdoor festival with Crankdat, LEVEL UP, Netsky, WonkyWilla.", start: d("2026-04-24", "16:00"), venue: { ...cltVenues.blackbox, name: "Blackbox Outdoors" } },
  { title: "Carolina Open Air Day 2", slug: "carolina-open-air-apr25", desc: "Day 2 with Wooli, Zingara, Jessica Audiffred.", start: d("2026-04-25", "16:00"), venue: { ...cltVenues.blackbox, name: "Blackbox Outdoors" } },
  { title: "Ivy Lab DnB Set", slug: "ivy-lab-dnb-may1", desc: "UK bass trio Ivy Lab - DnB set.", start: d("2026-05-01", "22:00"), venue: cltVenues.rabbitHole },
  { title: "KSHMR", slug: "kshmr-clt-may1", desc: "EDM heavyweight KSHMR.", start: d("2026-05-01", "22:00"), venue: cltVenues.trio },
  { title: "Ivy Lab History Set", slug: "ivy-lab-history-may2", desc: "Ivy Lab plays their classics.", start: d("2026-05-02", "22:00"), venue: cltVenues.rabbitHole },
  { title: "Dance with the Dead + Magic Sword", slug: "dance-dead-may6", desc: "Synthwave double header.", start: d("2026-05-06", "20:00"), venue: cltVenues.underground },
  { title: "Jantsen + Canvas", slug: "jantsen-clt-may16", desc: "Funk and bass from Jantsen.", start: d("2026-05-16", "21:00"), venue: cltVenues.blackbox },
  { title: "YDG + HAMRO", slug: "ydg-clt-may23", desc: "Dubstep with YDG and HAMRO.", start: d("2026-05-23", "21:00"), venue: cltVenues.blackbox },
  { title: "Tape B b2b Levity", slug: "tape-b-levity-aug7", desc: "Bass music titans Tape B and Levity.", start: d("2026-08-07", "20:00"), venue: cltVenues.truliant },
  { title: "Breakaway Carolina Day 1", slug: "breakaway-sep25", desc: "Major festival - Day 1.", start: d("2026-09-25", "16:00"), venue: cltVenues.blackbox },
  { title: "Breakaway Carolina Day 2", slug: "breakaway-sep26", desc: "Major festival - Day 2.", start: d("2026-09-26", "16:00"), venue: cltVenues.blackbox },
  
  // RALEIGH/DURHAM - Jan 2026
  { title: "NotLö + Snarz", slug: "notlo-ral-jan30", desc: "Bass music with NotLö and Snarz.", start: d("2026-01-30", "22:00"), venue: ralVenues.undergroundRal },
  { title: "Borgeous", slug: "borgeous-ral-jan30", desc: "Big room house from Borgeous.", start: d("2026-01-30", "22:00"), venue: ralVenues.aura },
  { title: "Ninajirachi: I Love My Computer Tour", slug: "ninajirachi-jan31", desc: "Australian producer Ninajirachi.", start: d("2026-01-31", "21:00"), venue: ralVenues.fruit },
  { title: "PLUR Rave: DaBaldo", slug: "plur-rave-jan31", desc: "Classic rave vibes with DaBaldo.", start: d("2026-01-31", "21:00"), venue: ralVenues.portalHQ },
  
  // RALEIGH/DURHAM - Feb 2026
  { title: "Odd Mob", slug: "odd-mob-dur-feb5", desc: "Australian house sensation Odd Mob.", start: d("2026-02-05", "21:00"), venue: ralVenues.fruit },
  { title: "Jaenga + Josh Teed", slug: "jaenga-ral-feb6", desc: "Bass music with Jaenga and Josh Teed.", start: d("2026-02-06", "22:00"), venue: ralVenues.undergroundRal },
  { title: "Marie Vaunt + Girl Brutal", slug: "marie-vaunt-dur-feb7", desc: "Industrial and dark electronic.", start: d("2026-02-07", "21:00"), venue: ralVenues.fruit },
  { title: "Inoculation: Hexxa", slug: "inoculation-hexxa-feb7", desc: "Bass music showcase.", start: d("2026-02-07", "21:00"), venue: ralVenues.pourHouse },
  { title: "FUSIONZ 6AM AFTERZzz", slug: "fusionz-afterz-feb7", desc: "House into techno afterhours.", start: d("2026-02-07", "06:00"), venue: ralVenues.aura },
  { title: "LOCKSTOCK", slug: "lockstock-ral-feb7", desc: "Underground bass night.", start: d("2026-02-07", "22:00"), venue: ralVenues.grogAlley },
  { title: "BONNIE X CLYDE", slug: "bonnie-clyde-ral-feb13", desc: "Electronic duo BONNIE X CLYDE.", start: d("2026-02-13", "22:00"), venue: ralVenues.aura },
  { title: "Hawt Mess: Hyperpop Rave", slug: "hawt-mess-feb14", desc: "Valentine's hyperpop rave with SKYLAN.", start: d("2026-02-14", "22:00"), venue: { ...ralVenues.pourHouse, name: "Neptunes Parlour" } },
  { title: "FF Family Anniversary", slug: "ff-anniversary-feb14", desc: "Frequency Factory anniversary party.", start: d("2026-02-14", "21:00"), venue: ralVenues.portalHQ },
  { title: "MIRRORVERSE TOUR: INZO", slug: "inzo-ral-feb20", desc: "Bass music odyssey with INZO.", start: d("2026-02-20", "21:00"), venue: ralVenues.ritzRal },
  { title: "SIPPY", slug: "sippy-ral-feb20", desc: "Australian bass artist SIPPY.", start: d("2026-02-20", "22:00"), venue: ralVenues.undergroundRal },
  { title: "Hills", slug: "hills-ral-feb20", desc: "Deep house from Hills.", start: d("2026-02-20", "22:00"), venue: ralVenues.aura },
  { title: "SAD MUSE CLUB: Snarz", slug: "sad-muse-club-feb21", desc: "Emotional bass music night.", start: d("2026-02-21", "21:00"), venue: ralVenues.shadowbox },
  { title: "D.O.D 360 Show", slug: "dod-dur-feb26", desc: "360 immersive show with D.O.D.", start: d("2026-02-26", "21:00"), venue: ralVenues.fruit },
  { title: "STS9", slug: "sts9-carrboro-feb26", desc: "Sound Tribe Sector 9.", start: d("2026-02-26", "20:00"), venue: ralVenues.catsCradle },
  { title: "Bass Haven: Jason Leech", slug: "bass-haven-feb26", desc: "Dubstep night with Jason Leech.", start: d("2026-02-26", "22:00"), venue: ralVenues.aura },
  { title: "Eli & Fur", slug: "eli-fur-dur-feb28", desc: "UK duo Eli & Fur.", start: d("2026-02-28", "21:00"), venue: ralVenues.fruit },
  
  // RALEIGH/DURHAM - Mar 2026
  { title: "Lotus", slug: "lotus-ral-mar3", desc: "Electronic jam band Lotus.", start: d("2026-03-03", "21:00"), venue: ralVenues.lincolnTheatre },
  { title: "Discip", slug: "discip-dur-mar6", desc: "Hard techno from Discip.", start: d("2026-03-06", "22:00"), venue: ralVenues.fruit },
  { title: "HE$H + Riddik", slug: "hesh-ral-mar7", desc: "Heavy dubstep with HE$H.", start: d("2026-03-07", "21:00"), venue: ralVenues.pourHouse },
  { title: "Deli Fresh: Random Movement", slug: "deli-fresh-mar7", desc: "Drum and bass with Random Movement.", start: d("2026-03-07", "22:00"), venue: ralVenues.aura },
  { title: "Vincent Antone + motifv", slug: "vincent-antone-ral-mar13", desc: "House music showcase.", start: d("2026-03-13", "22:00"), venue: ralVenues.pourHouse },
  { title: "MUZZ", slug: "muzz-dur-mar14", desc: "DnB producer MUZZ.", start: d("2026-03-14", "21:00"), venue: ralVenues.fruit },
  { title: "ZEKE BEATS", slug: "zeke-beats-mar14", desc: "Bass music from ZEKE BEATS.", start: d("2026-03-14", "21:00"), venue: ralVenues.pourHouse },
  { title: "Bass Haven: Hairitage", slug: "bass-haven-mar19", desc: "Dubstep night.", start: d("2026-03-19", "22:00"), venue: ralVenues.aura },
  { title: "KAAZE", slug: "kaaze-dur-mar20", desc: "Dutch DJ KAAZE.", start: d("2026-03-20", "21:00"), venue: ralVenues.fruit },
  { title: "Rave Nacht Raleigh", slug: "rave-nacht-mar20", desc: "Berlin-style techno with Kaÿ Wagner.", start: d("2026-03-20", "22:00"), venue: ralVenues.pourHouse },
  { title: "SECTION4: Mark Wollerman", slug: "section4-mar21", desc: "Techno showcase.", start: d("2026-03-21", "22:00"), venue: ralVenues.aura },
  { title: "KLOUD", slug: "kloud-ral-mar27", desc: "Masked electronic artist KLOUD.", start: d("2026-03-27", "22:00"), venue: ralVenues.undergroundRal },
  
  // RALEIGH/DURHAM - Apr-May 2026
  { title: "Bear Grillz 360 Show", slug: "bear-grillz-apr10", desc: "Bass music from Bear Grillz.", start: d("2026-04-10", "21:00"), venue: ralVenues.undergroundRal },
  { title: "Bass Bunker", slug: "bass-bunker-apr11", desc: "Heavy bass showcase.", start: d("2026-04-11", "21:00"), venue: ralVenues.fruit },
  { title: "Starjunk 95", slug: "starjunk-95-apr18", desc: "Retro-futuristic electronic.", start: d("2026-04-18", "21:00"), venue: ralVenues.fruit },
  { title: "Disclosure + MALUGI", slug: "disclosure-ral-apr30", desc: "UK house duo Disclosure.", start: d("2026-04-30", "20:00"), venue: ralVenues.redHat },
  { title: "Rave Of Wonder", slug: "rave-of-wonder-may1", desc: "Massive rave with REDVCTED.", start: d("2026-05-01", "20:00"), venue: { ...ralVenues.ritzRal, name: "J.S. Dorton Arena" } },
  { title: "Jantsen", slug: "jantsen-ral-may15", desc: "Funk and bass from Jantsen.", start: d("2026-05-15", "22:00"), venue: ralVenues.undergroundRal },
  { title: "Cirque du Sol-Rave", slug: "cirque-sol-rave-may30", desc: "Circus-themed rave experience.", start: d("2026-05-30", "21:00"), venue: ralVenues.fruit },
]

async function main() {
  console.log('🎉 Seeding NC events for Afters.xxx...\n')

  let organizer = await prisma.organizerProfile.findFirst()
  if (!organizer) {
    console.log('❌ No organizer found. Create one first.')
    return
  }

  console.log(`📋 Using organizer: ${organizer.displayName}\n`)

  let created = 0
  let skipped = 0

  for (const event of events) {
    const existing = await prisma.event.findFirst({
      where: { organizerId: organizer.id, slug: event.slug }
    })

    if (existing) {
      console.log(`⏭️  Skip: ${event.title}`)
      skipped++
      continue
    }

    await prisma.event.create({
      data: {
        title: event.title,
        slug: event.slug,
        description: event.desc,
        startsAt: event.start,
        endsAt: endTime(event.start),
        venueName: event.venue.name,
        venueAddress: event.venue.address,
        city: event.venue.city,
        state: "NC",
        ageRestriction: event.venue.age,
        organizerId: organizer.id,
        status: 'PUBLISHED',
        isPublished: true,
      }
    })

    console.log(`✅ ${event.title} @ ${event.venue.name} (${event.venue.city})`)
    created++
  }

  console.log(`\n🎊 Done! Created ${created} NC events, skipped ${skipped}.`)
  console.log(`📊 Total published: ${await prisma.event.count({ where: { isPublished: true } })}`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
    await pool.end()
  })
