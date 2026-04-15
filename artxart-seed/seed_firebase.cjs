const admin = require("firebase-admin");
const fs = require("fs");
const path = require("path");

const serviceAccount = require("./artxart-b2e22-firebase-adminsdk-fbsvc-445b5264c0.json");

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  storageBucket: "artxart-b2e22.firebasestorage.app",
});

const db = admin.firestore();
const bucket = admin.storage().bucket();
const auth = admin.auth();

const ARTWORKS_DIR = "./artworks";

const users = [
  { name: "Valentina Cruz",          location: "Buenos Aires, Argentina",   bio: "Mixed-media artist exploring the intersection of memory and urban decay through layered textures and reclaimed materials." },
  { name: "Matteo Rossi",            location: "Barcelona, Spain",           bio: "Painter and muralist whose work draws on Iberian folklore, translating ancient myths into vivid contemporary street art." },
  { name: "Isabela Ferreira",        location: "Lisbon, Portugal",           bio: "Photographer and installation artist documenting disappearing coastal communities along the Atlantic seaboard." },
  { name: "Lucía Martínez",          location: "Warsaw, Poland",             bio: "Sculptor working primarily in salvaged wood and iron, building monumental forms that question permanence and loss." },
  { name: "Andrei Popescu",          location: "Montevideo, Uruguay",        bio: "Multidisciplinary artist blending Eastern European folk motifs with digital glitch aesthetics in large-scale prints." },
  { name: "Carmen Delgado",          location: "Rome, Italy",                bio: "Watercolorist and illustrator capturing the sensory chaos of Latin American markets, festivals, and street life." },
  { name: "Emre Yıldız",             location: "Bucharest, Romania",         bio: "Conceptual artist whose practice centers on language, translation, and the politics of naming across borders." },
  { name: "Sofía Herrera",           location: "Mexico City, Mexico",        bio: "Ceramicist and educator fusing pre-Columbian vessel forms with contemporary glaze techniques and surface narratives." },
  { name: "Piotr Kowalski",          location: "Prague, Czech Republic",     bio: "Textile artist weaving biographical fragments into tapestries that serve as collective memory archives." },
  { name: "Elena Moreno",            location: "Paris, France",              bio: "Oil painter obsessed with artificial light — neon, fluorescent, screen glow — and the loneliness it illuminates." },
  { name: "Rafael Sánchez",          location: "Buenos Aires, Argentina",   bio: "Performance and video artist examining the body as political territory through durational, site-specific works." },
  { name: "Maja Novak",              location: "Barcelona, Spain",           bio: "Collagist and zine-maker whose layered compositions collide vintage medical illustration with pop-culture ephemera." },
  { name: "Diego Ramírez",           location: "Lisbon, Portugal",           bio: "Landscape painter working en plein air across South America, cataloguing ecosystems under environmental pressure." },
  { name: "Irina Ivanova",           location: "Warsaw, Poland",             bio: "Printmaker and activist whose woodblock series confronts colonial histories embedded in everyday objects." },
  { name: "Camila Reyes",            location: "Montevideo, Uruguay",        bio: "Digital and analog photographer tracing the geometry of brutalist architecture across post-socialist cities." },
  { name: "Luca Bianchi",            location: "Rome, Italy",                bio: "Abstract expressionist whose dense, gestural canvases emerge from improvised music sessions in the studio." },
  { name: "Florencia Gómez",         location: "Bucharest, Romania",         bio: "Illustrator and children's book author whose whimsical universes are rooted in Andean cosmology and myth." },
  { name: "Nikolaos Papadopoulos",   location: "Mexico City, Mexico",        bio: "Neon and light sculptor creating immersive environments that disorient viewers' sense of time and scale." },
  { name: "Mariana Lima",            location: "Prague, Czech Republic",     bio: "Street artist and muralist transforming neglected urban surfaces into vivid memorials for displaced communities." },
  { name: "Hugo Dubois",             location: "Paris, France",              bio: "Assemblage artist building uncanny domestic scenes from found objects sourced at flea markets across Europe." },
  { name: "Alejandro Torres",        location: "Buenos Aires, Argentina",   bio: "Painter working in a realist tradition, depicting overlooked service workers with unflinching dignity and detail." },
  { name: "Katalin Varga",           location: "Barcelona, Spain",           bio: "Sound and visual artist creating synesthetic experiences that map emotional states onto color field compositions." },
  { name: "Beatriz Oliveira",        location: "Lisbon, Portugal",           bio: "Mosaic artist reviving Byzantine techniques to render hyper-contemporary portraits and cultural icons." },
  { name: "Stefan Müller",           location: "Warsaw, Poland",             bio: "Graffiti writer turned gallery artist, whose work bridges the immediacy of the street with the depth of the studio." },
  { name: "Paola Esposito",          location: "Montevideo, Uruguay",        bio: "Figurative sculptor casting in bronze and resin, exploring dual cultural identity in immigrant narratives." },
  { name: "Tomás Navarro",           location: "Rome, Italy",                bio: "Bioartist experimenting with living pigments, mycelium, and fermentation as unconventional painting materials." },
  { name: "Zuzanna Wiśniewska",      location: "Bucharest, Romania",         bio: "Documentary photographer and visual essayist focused on labor, migration, and the invisible workforce." },
  { name: "Renata Álvarez",          location: "Mexico City, Mexico",        bio: "Painter drawing on surrealist lineage to construct dream-logic interiors haunted by feminine archetypes." },
  { name: "Bogdan Ionescu",          location: "Prague, Czech Republic",     bio: "Ceramics artist whose hand-built vessels carry text fragments, erasing and rewriting personal and political histories." },
  { name: "Adriana Pereira",         location: "Paris, France",              bio: "Engraver and book artist producing limited-edition artist books that function as intimate, tactile meditations." },
  { name: "Eduardo Molina",          location: "Buenos Aires, Argentina",   bio: "Urban sketcher and architectural illustrator documenting the fast-changing skylines of Latin American capitals." },
  { name: "Agnieszka Kowalczyk",     location: "Barcelona, Spain",           bio: "Abstract painter working in encaustic wax, embedding organic matter and personal relics beneath translucent layers." },
  { name: "Graciela Fuentes",        location: "Lisbon, Portugal",           bio: "Photographer specializing in long-exposure night photography that reveals the hidden rhythms of sleeping cities." },
  { name: "Marco Ferrari",           location: "Warsaw, Poland",             bio: "Illustrator and typographer whose hand-lettered works blend vernacular Latin American signage with fine art traditions." },
  { name: "Nadia Rousseau",          location: "Montevideo, Uruguay",        bio: "Installation artist constructing room-scale environments from natural materials foraged during residency travels." },
  { name: "Santiago Vega",           location: "Rome, Italy",                bio: "Video artist and filmmaker producing essay films that blur autobiography, fiction, and archival documentary footage." },
  { name: "Veronika Horáková",       location: "Bucharest, Romania",         bio: "Tapestry and fiber artist reclaiming traditional domestic craft as radical feminist and political statement." },
  { name: "Daniela Mendoza",         location: "Mexico City, Mexico",        bio: "Linocut printmaker whose bold, high-contrast works amplify marginalized voices and community stories." },
  { name: "Kristian Larsen",         location: "Prague, Czech Republic",     bio: "Painter and art therapist using gestural abstraction to externalize emotional landscapes with clinical precision." },
  { name: "Lorena Castillo",         location: "Paris, France",              bio: "Sculptor and land artist creating ephemeral site-responsive works that dissolve back into their environments." },
  { name: "Giovanni Conti",          location: "Buenos Aires, Argentina",   bio: "Graphic artist and illustrator whose editorial work appears across independent cultural magazines in four countries." },
  { name: "Marta Szymańska",         location: "Barcelona, Spain",           bio: "Wax and oil painter drawing on Dutch Golden Age techniques to interrogate contemporary vanitas themes." },
  { name: "Felipe Morales",          location: "Lisbon, Portugal",           bio: "Interdisciplinary artist working at the intersection of ecology, science, and visual storytelling in remote landscapes." },
  { name: "Anita Kovács",            location: "Warsaw, Poland",             bio: "Pastel and charcoal portraitist whose large-scale works challenge Western beauty standards across cultural contexts." },
  { name: "Rosario Ibáñez",          location: "Montevideo, Uruguay",        bio: "Comic artist and graphic novelist whose serialized works explore queer histories in post-war Southern Europe." },
  { name: "Dmitri Volkov",           location: "Rome, Italy",                bio: "Kinetic sculptor building wind-powered outdoor installations that animate public space with choreographed motion." },
  { name: "Paula Jiménez",           location: "Bucharest, Romania",         bio: "Mixed-media painter incorporating handwritten correspondence, maps, and botanical specimens into layered narratives." },
  { name: "Enrico Romano",           location: "Mexico City, Mexico",        bio: "Woodblock and screen printer whose vibrant editions celebrate endangered languages and oral traditions." },
  { name: "Silvia Guerrero",         location: "Prague, Czech Republic",     bio: "Collage and photo-montage artist constructing alternative historical archives from state and family photography." },
  { name: "Mihail Georgescu",        location: "Paris, France",              bio: "Muralist and community arts organizer whose participatory projects transform public space into living memory walls." },
];

function getArtworkFile(index) {
  const files = fs.readdirSync(ARTWORKS_DIR).filter(f => f.endsWith(".jpg")).sort();
  return files[index] || null;
}

async function uploadImage(filePath, destination) {
  await bucket.upload(filePath, {
    destination,
    metadata: { contentType: "image/jpeg" },
  });
  const file = bucket.file(destination);
  await file.makePublic();
  return `https://storage.googleapis.com/${bucket.name}/${destination}`;
}

async function seedUser(index) {
  const num = index + 1;
  const user = users[index];
  const email = `artist2change+${num}@gmail.com`;
  const password = `ARTx${2025 + (index % 5)}#${user.name.split(" ")[0].toLowerCase()}`;
  const artworkFile = getArtworkFile(index);
  const artworkPath = path.join(ARTWORKS_DIR, artworkFile);

  // 1. Create Auth user
  let uid;
  try {
    const authUser = await auth.createUser({ email, password, displayName: user.name });
    uid = authUser.uid;
  } catch (e) {
    if (e.code === "auth/email-already-exists") {
      const existing = await auth.getUserByEmail(email);
      uid = existing.uid;
      console.log(`  ⚠️  Auth exists, reusing uid`);
    } else throw e;
  }

  // 2. Upload artwork to Storage
  const storageDest = `artworks/${uid}/${artworkFile}`;
  const artworkUrl = await uploadImage(artworkPath, storageDest);

  // 3. Write Firestore profile
  await db.collection("users").doc(uid).set({
    uid,
    name: user.name,
    email,
    location: user.location,
    bio: user.bio,
    artworkUrl,
    artworkFile,
    createdAt: admin.firestore.FieldValue.serverTimestamp(),
    role: "artist",
    isDemo: true,
  });

  console.log(`✅ ${num.toString().padStart(2,"0")} | ${user.name.padEnd(26)} | ${artworkFile}`);
}

async function main() {
  console.log("🎨 ARTxART Firebase Seeder\n");
  let ok = 0, fail = 0;
  for (let i = 0; i < users.length; i++) {
    try {
      await seedUser(i);
      ok++;
    } catch (e) {
      console.error(`❌ ${i+1} | ${users[i].name} | ${e.message}`);
      fail++;
    }
  }
  console.log(`\n🏁 Done — ${ok} seeded, ${fail} failed.`);
  process.exit(0);
}

main();
