/* Personalizza il progetto Android generato da Capacitor: icone, schermata di avvio, firma e numero di versione.
   Viene eseguito dal workflow GitHub dopo "npx cap add android". */
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const app = path.join(root, "android", "app");
const res = path.join(app, "src", "main", "res");

function copyDir(src, dst) {
  fs.mkdirSync(dst, { recursive: true });
  for (const e of fs.readdirSync(src, { withFileTypes: true })) {
    const s = path.join(src, e.name), d = path.join(dst, e.name);
    if (e.isDirectory()) copyDir(s, d); else fs.copyFileSync(s, d);
  }
}
function must(cond, msg) { if (!cond) { console.error("ERRORE patch-android: " + msg); process.exit(1); } }

// 1. icone e schermata di avvio
must(fs.existsSync(res), "cartella res di Android non trovata (cap add android non è andato a buon fine?)");
copyDir(path.join(__dirname, "res"), res);
fs.writeFileSync(path.join(res, "values", "ic_launcher_background.xml"),
  '<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#14161B</color>\n</resources>\n');

// 2. firma (chiave fissa: così gli aggiornamenti si installano sopra la versione precedente senza perdere i dati)
fs.copyFileSync(path.join(__dirname, "taccuino.keystore"), path.join(app, "taccuino.keystore"));
const gpath = path.join(app, "build.gradle");
let g = fs.readFileSync(gpath, "utf8");

const signing = `    signingConfigs {
        release {
            storeFile file("taccuino.keystore")
            storePassword "taccuino"
            keyAlias "taccuino"
            keyPassword "taccuino"
        }
    }
    lint {
        checkReleaseBuilds false
        abortOnError false
    }
`;
must(g.includes("    buildTypes {"), "buildTypes non trovato in build.gradle");
g = g.replace("    buildTypes {", signing + "    buildTypes {");
must(/release \{\s*\n\s*minifyEnabled false/.test(g), "blocco release non trovato in build.gradle");
g = g.replace(/release \{(\s*\n\s*)minifyEnabled false/, (m, sp) => "release {" + sp + "signingConfig signingConfigs.release" + sp + "minifyEnabled false");

// 3. versione: aumenta a ogni esecuzione del workflow
const run = parseInt(process.env.GITHUB_RUN_NUMBER || "1", 10) || 1;
must(/versionCode \d+/.test(g) && /versionName "[^"]*"/.test(g), "versionCode/versionName non trovati");
g = g.replace(/versionCode \d+/, "versionCode " + run).replace(/versionName "[^"]*"/, 'versionName "1.' + run + '"');
fs.writeFileSync(gpath, g);
console.log("patch-android: ok (versione 1." + run + ")");
