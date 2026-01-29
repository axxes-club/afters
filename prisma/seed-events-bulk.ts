import { PrismaClient } from '@prisma/client'
import { Pool } from 'pg'
import { PrismaPg } from '@prisma/adapter-pg'
import 'dotenv/config'

const connectionString = process.env.DATABASE_URL
const pool = new Pool({ connectionString })
const adapter = new PrismaPg(pool)
const prisma = new PrismaClient({ adapter })

// Helper to create date at specific time in EST
const d = (dateStr: string, time: string = "22:00") => {
  const [h, m] = time.split(':').map(Number)
  const date = new Date(dateStr + 'T00:00:00-05:00')
  date.setHours(h, m, 0, 0)
  return date
}

const endTime = (start: Date, hours: number = 6) => {
  const end = new Date(start)
  end.setHours(end.getHours() + hours)
  return end
}

// NYC Venues
const venues = {
  silo: { name: "SILO Brooklyn", address: "372 Flushing Ave", city: "Brooklyn", age: 21 },
  elsewhere: { name: "Elsewhere", address: "599 Johnson Ave", city: "Brooklyn", age: 21 },
  elsewhereHall: { name: "Elsewhere Hall", address: "599 Johnson Ave", city: "Brooklyn", age: 16 },
  publicRecords: { name: "Public Records", address: "233 Butler St", city: "Brooklyn", age: 21 },
  knockdown: { name: "Knockdown Center", address: "52-19 Flushing Ave", city: "Queens", age: 21 },
  superior: { name: "Superior Ingredients", address: "49 Bogart St", city: "Brooklyn", age: 21 },
  marquee: { name: "Marquee", address: "289 10th Ave", city: "New York", age: 21 },
  nebula: { name: "Nebula", address: "135 W 41st St", city: "New York", age: 21 },
  terminal5: { name: "Terminal 5", address: "610 W 56th St", city: "New York", age: 18 },
  brooklynSteel: { name: "Brooklyn Steel", address: "319 Frost St", city: "Brooklyn", age: 18 },
  brooklynMonarch: { name: "Brooklyn Monarch", address: "23 Meadow St", city: "Brooklyn", age: null },
  goodRoom: { name: "Good Room", address: "98 Meserole Ave", city: "Brooklyn", age: 21 },
  nowadays: { name: "Nowadays", address: "56-06 Cooper Ave", city: "Queens", age: null },
  houseOfYes: { name: "House of Yes", address: "2 Wyckoff Ave", city: "Brooklyn", age: 21 },
  websterHall: { name: "Webster Hall", address: "125 E 11th St", city: "New York", age: 19 },
  avantGardner: { name: "Avant Gardner", address: "140 Stewart Ave", city: "Brooklyn", age: 18 },
  greatHall: { name: "Great Hall at Avant Gardner", address: "140 Stewart Ave", city: "Brooklyn", age: 18 },
  brooklynMirage: { name: "Brooklyn Mirage", address: "140 Stewart Ave", city: "Brooklyn", age: 21 },
  signal: { name: "Signal Brooklyn", address: "74 Wythe Ave", city: "Brooklyn", age: 21 },
  paragon: { name: "Paragon", address: "5-25 46th Ave", city: "Queens", age: 21 },
  greenRoom: { name: "Green Room NYC", address: "409 Grand St", city: "Brooklyn", age: null },
  refuge: { name: "Refuge", address: "17 Eastern Pkwy", city: "Brooklyn", age: null },
  listenBK: { name: "Listen Brooklyn", address: "46 Berry St", city: "Brooklyn", age: 21 },
  h0l0: { name: "H0L0", address: "1090 Wyckoff Ave", city: "Queens", age: null },
  brooklynBowl: { name: "Brooklyn Bowl", address: "61 Wythe Ave", city: "Brooklyn", age: 21 },
  brooklynHangar: { name: "Brooklyn Hangar", address: "2 52nd St", city: "Brooklyn", age: 21 },
  brooklynParamount: { name: "Brooklyn Paramount", address: "1 University Plaza", city: "Brooklyn", age: 21 },
  sultanRoom: { name: "Sultan Room", address: "234 Starr St", city: "Brooklyn", age: 21 },
  musicHallWilliamsburg: { name: "Music Hall of Williamsburg", address: "66 N 6th St", city: "Brooklyn", age: 18 },
  meadowsBK: { name: "The Meadows Brooklyn", address: "475 Kent Ave", city: "Brooklyn", age: null },
  tvEye: { name: "TV Eye", address: "1647 DeKalb Ave", city: "Queens", age: 21 },
  jupiterDisco: { name: "Jupiter Disco", address: "1237 Flushing Ave", city: "Brooklyn", age: 21 },
  nublu: { name: "Nublu Classic", address: "62 Avenue C", city: "New York", age: null },
  loosies: { name: "Loosie's Nightclub", address: "91 S 6th St", city: "Brooklyn", age: 21 },
  rash: { name: "Rash", address: "241 Starr St", city: "Brooklyn", age: null },
  carPark: { name: "Car Park", address: "91 N 14th St", city: "Brooklyn", age: 21 },
}

// 100+ events
const events = [
  // Late January 2026
  { title: "Danny L Harle", slug: "danny-l-harle-jan27", desc: "PC Music co-founder Danny L Harle brings his hyperpop sound to Brooklyn.", start: d("2026-01-27", "22:00"), venue: venues.silo },
  { title: "Steen + Transmute", slug: "steen-transmute-jan28", desc: "Deep house vibes with Steen and Transmute.", start: d("2026-01-28", "22:00"), venue: venues.silo },
  { title: "Fox Stevenson", slug: "fox-stevenson-jan29", desc: "High-energy drum and bass from Fox Stevenson.", start: d("2026-01-29", "20:00"), venue: venues.elsewhereHall },
  { title: "Machinedrum", slug: "machinedrum-jan29", desc: "Travis Stewart aka Machinedrum - genre-bending electronic producer.", start: d("2026-01-29", "22:00"), venue: venues.publicRecords },
  { title: "LAERZ", slug: "laerz-jan29", desc: "UK bass music rising star LAERZ.", start: d("2026-01-29", "21:00"), venue: venues.musicHallWilliamsburg },
  { title: "Signal x Infra: Dustin Zahn", slug: "dustin-zahn-jan29", desc: "Techno legend Dustin Zahn at Signal Brooklyn.", start: d("2026-01-29", "23:00"), venue: venues.signal },
  { title: "Platonic Romance Tour: DRAMA", slug: "drama-jan29", desc: "Chicago duo DRAMA brings their synth-pop to Brooklyn.", start: d("2026-01-29", "20:00"), venue: venues.brooklynParamount },
  { title: "Body Hack", slug: "body-hack-jan29", desc: "Experimental electronics at Nowadays.", start: d("2026-01-29", "23:00"), venue: venues.nowadays },
  { title: "Turbz", slug: "turbz-jan29", desc: "UK garage and bass from Turbz.", start: d("2026-01-29", "22:00"), venue: venues.loosies },
  { title: "Techno Thursdays: Lourdes", slug: "techno-thursdays-jan29", desc: "Dark techno with Lourdes, Concrete Husband, and more.", start: d("2026-01-29", "23:00"), venue: venues.listenBK },
  
  // Friday Jan 30
  { title: "Open To Close: Mind Against", slug: "mind-against-jan30", desc: "Italian techno duo Mind Against delivers a full open-to-close set.", start: d("2026-01-30", "22:00"), venue: venues.knockdown },
  { title: "Riot Ten + Ruvlo", slug: "riot-ten-jan30", desc: "Dubstep and bass music takeover.", start: d("2026-01-30", "22:00"), venue: venues.brooklynMonarch },
  { title: "Hybrid Minds", slug: "hybrid-minds-jan30", desc: "Liquid drum and bass duo Hybrid Minds.", start: d("2026-01-30", "22:00"), venue: venues.silo },
  { title: "Surf Mesa", slug: "surf-mesa-jan30", desc: "House music rising star Surf Mesa.", start: d("2026-01-30", "22:00"), venue: venues.elsewhere },
  { title: "Lavern", slug: "lavern-jan30", desc: "House and techno with Lavern.", start: d("2026-01-30", "22:00"), venue: venues.marquee },
  { title: "Amenthia Showcase: Nastia", slug: "amenthia-nastia-jan30", desc: "Ukrainian techno queen Nastia headlines the Amenthia showcase.", start: d("2026-01-30", "22:00"), venue: venues.publicRecords },
  { title: "Chippy Nonstop", slug: "chippy-nonstop-jan30", desc: "High-energy club sounds with Chippy Nonstop and friends.", start: d("2026-01-30", "23:00"), venue: venues.paragon },
  { title: "Sebastian Ledher", slug: "sebastian-ledher-jan30", desc: "Deep melodic house from Sebastian Ledher.", start: d("2026-01-30", "22:00"), venue: venues.listenBK },
  { title: "HEATED RIVALRY - The Party", slug: "heated-rivalry-jan30", desc: "Genre-blending party night.", start: d("2026-01-30", "23:00"), venue: venues.goodRoom },
  
  // Saturday Jan 31
  { title: "Valentino Khan", slug: "valentino-khan-jan31", desc: "Grammy-nominated producer Valentino Khan.", start: d("2026-01-31", "22:00"), venue: venues.marquee },
  { title: "Weval", slug: "weval-jan31", desc: "Dutch electronic duo Weval - hypnotic atmospheric productions.", start: d("2026-01-31", "21:00"), venue: venues.elsewhereHall },
  { title: "Detroit Love: Carl Craig", slug: "carl-craig-jan31", desc: "Detroit techno pioneer Carl Craig with DJ Holographic.", start: d("2026-01-31", "22:00"), venue: venues.superior },
  { title: "Oliver Smith + Coastlines", slug: "oliver-smith-jan31", desc: "Anjunabeats artist Oliver Smith.", start: d("2026-01-31", "22:00"), venue: venues.silo },
  { title: "Wakyin + Ferra Black", slug: "wakyin-jan31", desc: "Underground techno at Knockdown Center.", start: d("2026-01-31", "22:00"), venue: venues.knockdown },
  { title: "Joey Beltram + Mike Servito", slug: "joey-beltram-jan31", desc: "Techno legends Joey Beltram and Mike Servito.", start: d("2026-01-31", "23:00"), venue: venues.paragon },
  { title: "Julian Jordan", slug: "julian-jordan-jan31", desc: "Dutch DJ Julian Jordan.", start: d("2026-01-31", "22:00"), venue: venues.nebula },
  { title: "Swimming Paul", slug: "swimming-paul-jan31", desc: "Lo-fi house vibes with Swimming Paul.", start: d("2026-01-31", "21:00"), venue: venues.brooklynSteel },
  { title: "Bomba Lounge Saturday", slug: "bomba-jan31", desc: "Latin house and reggaeton.", start: d("2026-01-31", "22:00"), venue: venues.goodRoom },
  
  // Sunday Feb 1
  { title: "Detroit Love Day 2: Moodymann", slug: "moodymann-feb1", desc: "Detroit house legend Moodymann.", start: d("2026-02-01", "14:00"), venue: venues.superior },
  { title: "Sunday Selectors: David Morales", slug: "david-morales-feb1", desc: "House music legend David Morales.", start: d("2026-02-01", "16:00"), venue: venues.refuge },
  { title: "JOURNEY Party: DJ Spinna", slug: "dj-spinna-feb1", desc: "Legendary DJ Spinna.", start: d("2026-02-01", "16:00"), venue: venues.goodRoom },
  { title: "Underground Resistance", slug: "underground-resistance-feb1", desc: "Detroit techno collective Underground Resistance.", start: d("2026-02-01", "16:00"), venue: venues.nowadays },
  { title: "Sunday Skate Club: Mike Servito", slug: "skate-club-feb1", desc: "Roller skating party with Mike Servito.", start: d("2026-02-01", "14:00"), venue: venues.houseOfYes },
  
  // Week of Feb 2-8
  { title: "Nickodemus", slug: "nickodemus-feb4", desc: "World music meets house with Nickodemus.", start: d("2026-02-04", "21:00"), venue: venues.nublu },
  { title: "Steen", slug: "steen-feb4", desc: "Weekly residency with Steen.", start: d("2026-02-04", "22:00"), venue: venues.silo },
  { title: "Ekali", slug: "ekali-feb5", desc: "Canadian producer Ekali.", start: d("2026-02-05", "21:00"), venue: venues.brooklynBowl },
  { title: "DVS1", slug: "dvs1-feb5", desc: "Minneapolis techno legend DVS1.", start: d("2026-02-05", "23:00"), venue: venues.greenRoom },
  { title: "TYree Cooper + MikeQ", slug: "tyree-cooper-feb5", desc: "House and ballroom legends.", start: d("2026-02-05", "22:00"), venue: venues.publicRecords },
  { title: "Justin Strauss b2b Matias Aguayo", slug: "justin-strauss-feb5", desc: "NYC veteran Justin Strauss meets Matias Aguayo.", start: d("2026-02-05", "22:00"), venue: venues.signal },
  { title: "VAVO", slug: "vavo-feb6", desc: "Big room house duo VAVO.", start: d("2026-02-06", "22:00"), venue: venues.marquee },
  { title: "Wilkinson", slug: "wilkinson-feb6", desc: "Drum and bass star Wilkinson.", start: d("2026-02-06", "22:00"), venue: venues.elsewhere },
  { title: "Julie Marghilano", slug: "julie-marghilano-feb6", desc: "Techno from Julie Marghilano.", start: d("2026-02-06", "22:00"), venue: venues.signal },
  { title: "Bruno Furlan", slug: "bruno-furlan-feb6", desc: "Brazilian tech house from Bruno Furlan.", start: d("2026-02-06", "22:00"), venue: venues.silo },
  { title: "Random Rab", slug: "random-rab-feb6", desc: "Downtempo and bass music with Random Rab.", start: d("2026-02-06", "21:00"), venue: venues.sultanRoom },
  { title: "Level III X Baile World", slug: "level-iii-feb6", desc: "Global bass and baile funk.", start: d("2026-02-06", "23:00"), venue: venues.h0l0 },
  
  // Saturday Feb 7
  { title: "Teletech: Hannah Laing + Trym", slug: "teletech-feb7", desc: "UK techno takeover with Hannah Laing and Trym.", start: d("2026-02-07", "22:00"), venue: venues.avantGardner },
  { title: "Ray Volpe + Virtual Riot", slug: "ray-volpe-feb7", desc: "Dubstep heavyweights at Terminal 5.", start: d("2026-02-07", "20:00"), venue: venues.terminal5 },
  { title: "ALLEYCVT", slug: "alleycvt-feb7", desc: "Rising bass music star ALLEYCVT.", start: d("2026-02-07", "21:00"), venue: venues.brooklynSteel },
  { title: "Habstrakt", slug: "habstrakt-feb7", desc: "French bass house producer Habstrakt.", start: d("2026-02-07", "22:00"), venue: venues.elsewhere },
  { title: "Mita Gami", slug: "mita-gami-feb7", desc: "Electronic artist Mita Gami.", start: d("2026-02-07", "21:00"), venue: venues.brooklynParamount },
  { title: "The Ornate Project: Grum", slug: "grum-feb7", desc: "Progressive house with Grum.", start: d("2026-02-07", "22:00"), venue: venues.meadowsBK },
  { title: "Soul Clap + Afriqua", slug: "soul-clap-feb7", desc: "House music with Soul Clap and Afriqua.", start: d("2026-02-07", "22:00"), venue: venues.refuge },
  { title: "Discip + Braydon Terzo", slug: "discip-feb7", desc: "Hard techno night.", start: d("2026-02-07", "23:00"), venue: venues.carPark },
  { title: "Liu", slug: "liu-feb7", desc: "Brazilian DJ Liu.", start: d("2026-02-07", "22:00"), venue: venues.nebula },
  { title: "Stepmom Got Hardgrooved", slug: "stepmom-feb7", desc: "Hard groove techno.", start: d("2026-02-07", "23:00"), venue: venues.rash },
  
  // Sunday Feb 8
  { title: "Kölsch + Brina Knauss", slug: "kolsch-feb8", desc: "Melodic techno master Kölsch.", start: d("2026-02-08", "16:00"), venue: venues.superior },
  { title: "Hercules & Love Affair", slug: "hercules-feb8", desc: "Disco and house legend Andy Butler.", start: d("2026-02-08", "16:00"), venue: venues.publicRecords },
  { title: "Tiki Disco: Eli Escobar", slug: "tiki-disco-feb8", desc: "Disco party with Eli Escobar.", start: d("2026-02-08", "14:00"), venue: venues.knockdown },
  
  // Week of Feb 9-15
  { title: "Adam Beyer", slug: "adam-beyer-feb13", desc: "Drumcode boss Adam Beyer.", start: d("2026-02-13", "22:00"), venue: venues.avantGardner },
  { title: "Spring Festival: Louis The Child", slug: "spring-fest-feb13", desc: "Lunar New Year with Louis The Child, Porter Robinson, Alan Walker.", start: d("2026-02-13", "18:00"), venue: venues.brooklynHangar },
  { title: "Recondite", slug: "recondite-feb14", desc: "Atmospheric techno from Recondite.", start: d("2026-02-14", "22:00"), venue: venues.refuge },
  { title: "Raw Burlesque: Valentine's Edition", slug: "raw-burlesque-feb14", desc: "Burlesque and beats for Valentine's Day.", start: d("2026-02-14", "22:00"), venue: venues.houseOfYes },
  { title: "718 Sessions: Danny Krivit", slug: "718-sessions-feb15", desc: "NYC house legend Danny Krivit.", start: d("2026-02-15", "16:00"), venue: venues.goodRoom },
  
  // Week of Feb 16-22
  { title: "Amelie Lens", slug: "amelie-lens-feb20", desc: "Belgian techno powerhouse Amelie Lens.", start: d("2026-02-20", "22:00"), venue: venues.avantGardner },
  { title: "Boy Cordero + HoneyCafe", slug: "boy-cordero-feb20", desc: "Deep house night.", start: d("2026-02-20", "22:00"), venue: venues.elsewhere },
  { title: "Battle Hymn x Battle HURRR", slug: "battle-hymn-feb20", desc: "Bass and breaks.", start: d("2026-02-20", "23:00"), venue: venues.refuge },
  { title: "Charlotte de Witte", slug: "cdw-feb21", desc: "KNTXT boss Charlotte de Witte.", start: d("2026-02-21", "22:00"), venue: venues.brooklynMirage },
  { title: "Bicep DJ Set", slug: "bicep-feb21", desc: "Belfast duo Bicep.", start: d("2026-02-21", "22:00"), venue: venues.knockdown },
  { title: "Red Axes", slug: "red-axes-feb26", desc: "Israeli duo Red Axes.", start: d("2026-02-26", "22:00"), venue: venues.publicRecords },
  { title: "Jetlag", slug: "jetlag-feb27", desc: "Afro house collective Jetlag.", start: d("2026-02-27", "22:00"), venue: venues.silo },
  { title: "Toni Varga", slug: "toni-varga-feb28", desc: "Elrow resident Toni Varga.", start: d("2026-02-28", "22:00"), venue: venues.listenBK },
  { title: "Tom & Collins", slug: "tom-collins-feb28", desc: "Mexican house duo Tom & Collins.", start: d("2026-02-28", "16:00"), venue: venues.superior },
  
  // March 2026
  { title: "TWILO Reunion: Danny Tenaglia", slug: "twilo-reunion-mar6", desc: "Legendary NYC DJ Danny Tenaglia revisits TWILO.", start: d("2026-03-06", "23:00"), venue: venues.websterHall },
  { title: "Olly James + LNY TNZ", slug: "olly-james-mar7", desc: "Hard dance mayhem.", start: d("2026-03-07", "22:00"), venue: venues.nebula },
  { title: "Ben Böhmer", slug: "ben-bohmer-mar7", desc: "Anjunadeep star Ben Böhmer.", start: d("2026-03-07", "22:00"), venue: venues.brooklynMirage },
  { title: "RL Grime", slug: "rl-grime-mar13", desc: "Trap king RL Grime.", start: d("2026-03-13", "22:00"), venue: venues.avantGardner },
  { title: "DR. GABBA", slug: "dr-gabba-mar13", desc: "Hardcore and gabber night.", start: d("2026-03-13", "22:00"), venue: venues.elsewhere },
  { title: "St. Patrick's Day Bar Fest", slug: "st-patricks-mar14", desc: "LES bar crawl and party.", start: d("2026-03-14", "16:00"), venue: venues.goodRoom },
  { title: "Steen", slug: "steen-mar18", desc: "Weekly with Steen.", start: d("2026-03-18", "22:00"), venue: venues.silo },
  { title: "Steen", slug: "steen-mar25", desc: "Weekly with Steen.", start: d("2026-03-25", "22:00"), venue: venues.silo },
  { title: "Purple Disco Machine", slug: "purple-disco-mar27", desc: "German disco producer Purple Disco Machine.", start: d("2026-03-27", "22:00"), venue: venues.terminal5 },
  { title: "Conducta + Jialing", slug: "conducta-mar27", desc: "UK garage and bass.", start: d("2026-03-27", "22:00"), venue: venues.elsewhere },
  
  // April 2026
  { title: "Four Tet", slug: "four-tet-apr3", desc: "Kieran Hebden aka Four Tet.", start: d("2026-04-03", "22:00"), venue: venues.knockdown },
  { title: "Skrillex", slug: "skrillex-apr4", desc: "Dubstep pioneer Skrillex.", start: d("2026-04-04", "22:00"), venue: venues.brooklynMirage },
  { title: "Disclosure", slug: "disclosure-apr10", desc: "UK house duo Disclosure.", start: d("2026-04-10", "22:00"), venue: venues.avantGardner },
  { title: "Chus & Ceballos", slug: "chus-ceballos-apr10", desc: "Spanish house legends.", start: d("2026-04-10", "22:00"), venue: venues.knockdown },
  { title: "Delta Heavy + Justin Hawkes", slug: "delta-heavy-apr11", desc: "DnB heavyweights.", start: d("2026-04-11", "22:00"), venue: venues.silo },
  { title: "Peggy Gou", slug: "peggy-gou-apr17", desc: "Korean superstar DJ Peggy Gou.", start: d("2026-04-17", "22:00"), venue: venues.brooklynMirage },
  { title: "Mall Grab", slug: "mall-grab-apr18", desc: "Australian lo-fi house star Mall Grab.", start: d("2026-04-18", "22:00"), venue: venues.elsewhere },
  { title: "Fisher", slug: "fisher-apr24", desc: "Australian tech house DJ Fisher.", start: d("2026-04-24", "22:00"), venue: venues.avantGardner },
  { title: "Floating Points", slug: "floating-points-apr25", desc: "Sam Shepherd aka Floating Points.", start: d("2026-04-25", "22:00"), venue: venues.knockdown },
  
  // May 2026
  { title: "WonkyWilla + Smith + Buku", slug: "wonkywilla-may9", desc: "Bass music showcase.", start: d("2026-05-09", "22:00"), venue: venues.websterHall },
  { title: "Fred again..", slug: "fred-again-may15", desc: "UK producer Fred again..", start: d("2026-05-15", "20:00"), venue: venues.brooklynMirage },
  { title: "Eric Prydz", slug: "eric-prydz-may16", desc: "Swedish progressive house legend.", start: d("2026-05-16", "22:00"), venue: venues.avantGardner },
  { title: "Jamie xx", slug: "jamie-xx-may22", desc: "The xx member goes solo.", start: d("2026-05-22", "22:00"), venue: venues.knockdown },
  { title: "Caribou", slug: "caribou-may23", desc: "Dan Snaith aka Caribou.", start: d("2026-05-23", "21:00"), venue: venues.brooklynSteel },
  { title: "Boris Brejcha", slug: "boris-brejcha-may29", desc: "German high-tech minimal master.", start: d("2026-05-29", "22:00"), venue: venues.avantGardner },
  { title: "Tale Of Us", slug: "tale-of-us-may30", desc: "Afterlife bosses Tale Of Us.", start: d("2026-05-30", "22:00"), venue: venues.brooklynMirage },
  
  // June 2026
  { title: "Honey Dijon", slug: "honey-dijon-jun5", desc: "Chicago house queen Honey Dijon.", start: d("2026-06-05", "22:00"), venue: venues.knockdown },
  { title: "Black Coffee", slug: "black-coffee-jun6", desc: "South African house legend.", start: d("2026-06-06", "22:00"), venue: venues.brooklynMirage },
  { title: "Solomun", slug: "solomun-jun12", desc: "Diynamic boss Solomun.", start: d("2026-06-12", "22:00"), venue: venues.avantGardner },
  { title: "Hot Since 82", slug: "hot-since-82-jun13", desc: "British house and techno.", start: d("2026-06-13", "22:00"), venue: venues.superior },
  { title: "Nina Kraviz", slug: "nina-kraviz-jun19", desc: "Russian techno queen.", start: d("2026-06-19", "22:00"), venue: venues.knockdown },
  { title: "Richie Hawtin", slug: "richie-hawtin-jun20", desc: "Plastikman returns to NYC.", start: d("2026-06-20", "22:00"), venue: venues.avantGardner },
  { title: "The Martinez Brothers", slug: "martinez-bros-jun26", desc: "NYC's own Martinez Brothers.", start: d("2026-06-26", "22:00"), venue: venues.brooklynMirage },
  { title: "Marco Carola", slug: "marco-carola-jun27", desc: "Italian techno legend.", start: d("2026-06-27", "22:00"), venue: venues.knockdown },
]

async function main() {
  console.log('🎉 Bulk seeding events for Afters.xxx...\n')

  let organizer = await prisma.organizerProfile.findFirst()
  
  if (!organizer) {
    console.log('⚠️ No organizer profile found. Creating default seed user and organizer...')
    
    // Create default user
    const user = await prisma.user.upsert({
      where: { email: "seed@afters.xxx" },
      update: {},
      create: {
        id: "user_seed_123",
        email: "seed@afters.xxx",
        firstName: "Seed",
        lastName: "User",
      }
    })

    // Create default organizer
    organizer = await prisma.organizerProfile.create({
      data: {
        userId: user.id,
        displayName: "Afters Curated",
        slug: "afters-curated",
        bio: "The best events in NYC, curated by Afters.",
        artistType: "Promoter",
        logoUrl: "https://api.dice.fm/venues/62/34/06/17/30/16/91/98/50/22/02/06/61/13/44/22/06/06/00/01/00/00/00/01/logo.jpg", // Placeholder
      }
    })
    
    console.log('✅ Created default organizer: Afters Curated')
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

    const startDate = event.start
    const endDate = endTime(startDate, 6)

    await prisma.event.create({
      data: {
        title: event.title,
        slug: event.slug,
        description: event.desc,
        startsAt: startDate,
        endsAt: endDate,
        venueName: event.venue.name,
        venueAddress: event.venue.address,
        city: event.venue.city,
        state: "NY",
        ageRestriction: event.venue.age,
        organizerId: organizer.id,
        status: 'PUBLISHED',
        isPublished: true,
      }
    })

    console.log(`✅ ${event.title} @ ${event.venue.name}`)
    created++
  }

  console.log(`\n🎊 Done! Created ${created} events, skipped ${skipped}.`)
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
