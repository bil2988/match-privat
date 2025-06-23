let teams = {};
let matches = [];
let fileMatchs = [];
let etatTournoi = "en_attente";

window.onload = async () => {
  await loadData();
  refreshSelects();
  updateRanking();
};

async function loadData() {
  try {
    const res = await fetch('/.netlify/functions/getData');
    const data = await res.json();
    teams = data.teams || {};
    matches = data.matches || [];
  } catch (err) {
    console.warn("Données locales utilisées.");
  }
}

async function saveData() {
  try {
    await fetch('/.netlify/functions/saveData', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ teams, matches })
    });
  } catch (err) {
    console.warn("Sauvegarde impossible.");
  }
}

function login() {
  const user = document.getElementById("username").value;
  const pass = document.getElementById("password").value;
  if (user === "admin" && pass === "fifatournoi") {
    document.getElementById("login").classList.add("hidden");
    document.getElementById("adminPanel").classList.remove("hidden");
    refreshSelects();
  } else {
    document.getElementById("loginMessage").textContent = "Identifiants incorrects.";
  }
}

function getCountryCode(name) {
  const countries = {
    france: 'fr', brésil: 'br', brazil: 'br', maroc: 'ma', algérie: 'dz', tunisie: 'tn',
    espagne: 'es', italie: 'it', allemagne: 'de', sénégal: 'sn', portugal: 'pt',
    angleterre: 'gb', belgique: 'be', argentine: 'ar', japon: 'jp', chine: 'cn', turquie: 'tr'
  };
  return countries[name.toLowerCase()] || null;
}

async function addTeam() {
  if (etatTournoi !== "en_attente") {
    alert("Tu ne peux plus ajouter d’équipe.");
    return;
  }

  if (Object.keys(teams).length >= 10) {
    alert("Tu ne peux pas ajouter plus de 10 équipes.");
    return;
  }

  const prenoms = document.getElementById("playerNames").value.split(",").map(p => p.trim()).filter(p => p);
  const country = document.getElementById("teamCountry").value.trim();
  const code = getCountryCode(country);

  if (prenoms.length < 2 || prenoms.length > 4) {
    alert("Entre entre 2 et 4 prénoms séparés par des virgules.");
    return;
  }

  if (!code) {
    alert("Pays non reconnu.");
    return;
  }

  const initials = prenoms[0][0].toUpperCase() + "," + prenoms[1][0].toUpperCase();
  if (teams[initials]) {
    alert("Cette équipe existe déjà.");
    return;
  }

  const flag = `https://flagcdn.com/48x36/${code}.png`;

  teams[initials] = {
    name: initials,
    flag,
    players: prenoms,
    wins: 0,
    losses: 0,
    points: 0
  };

  document.getElementById("playerNames").value = "";
  document.getElementById("teamCountry").value = "";
  refreshSelects();
  updateRanking();
  await saveData();
}

function refreshSelects() {
  const select1 = document.getElementById("team1");
  const select2 = document.getElementById("team2");
  if (!select1 || !select2) return;
  select1.innerHTML = select2.innerHTML = "";
  Object.keys(teams).forEach(team => {
    select1.innerHTML += `<option value="${team}">${team}</option>`;
    select2.innerHTML += `<option value="${team}">${team}</option>`;
  });
}

function afficherMatchSuivant() {
  if (fileMatchs.length === 0) {
    endTournament();
    return;
  }

  const { t1, t2 } = fileMatchs[0];
  document.getElementById("currentTeams").innerHTML = `
    <strong>Match :</strong><br>
    <img src="${teams[t1].flag}" class="flag"> ${t1} vs 
    <img src="${teams[t2].flag}" class="flag"> ${t2}
  `;
}

async function submitScore() {
  if (etatTournoi !== "en_cours") {
    alert("Le tournoi n’est pas en cours.");
    return;
  }

  const score1 = parseInt(document.getElementById("score1").value);
  const score2 = parseInt(document.getElementById("score2").value);
  if (isNaN(score1) || isNaN(score2)) return;

  const { t1, t2 } = fileMatchs.shift();

  matches.push({ t1, t2, s1: score1, s2: score2 });

  if (score1 > score2) {
    teams[t1].wins++;
    teams[t2].losses++;
    teams[t1].points += 3;
  } else if (score1 < score2) {
    teams[t2].wins++;
    teams[t1].losses++;
    teams[t2].points += 3;
  } else {
    teams[t1].points += 1;
    teams[t2].points += 1;
  }

  document.getElementById("score1").value = "";
  document.getElementById("score2").value = "";

  updateRanking();
  await saveData();
  afficherMatchSuivant();
}

function updateRanking() {
  const table = document.getElementById("rankingTable");
  const sorted = Object.values(teams).sort((a, b) => b.points - a.points);
  table.innerHTML = "";
  sorted.forEach((team, index) => {
    table.innerHTML += `<tr>
      <td>${index + 1}</td>
      <td><img src="${team.flag}" class="flag"> ${team.name}<br><small>(${team.players.join(", ")})</small></td>
      <td>${team.wins}</td><td>${team.losses}</td><td>${team.points}</td>
    </tr>`;
  });
}

function startTournament() {
  if (Object.keys(teams).length < 2) {
    alert("Ajoute au moins deux équipes.");
    return;
  }

  etatTournoi = "en_cours";
  document.getElementById("etatTournoiTxt").textContent = "Statut : En cours";
  document.getElementById("playerNames").disabled = true;
  document.getElementById("teamCountry").disabled = true;

  // Générer tous les matchs possibles
  const noms = Object.keys(teams);
  fileMatchs = [];
  for (let i = 0; i < noms.length; i++) {
    for (let j = i + 1; j < noms.length; j++) {
      fileMatchs.push({ t1: noms[i], t2: noms[j] });
    }
  }

  afficherMatchSuivant();
}

function endTournament() {
  etatTournoi = "termine";
  document.getElementById("etatTournoiTxt").textContent = "Statut : Terminé";
  document.getElementById("score1").disabled = true;
  document.getElementById("score2").disabled = true;

  const sorted = Object.values(teams).sort((a, b) => b.points - a.points);
  document.getElementById("winnerTeam").innerHTML = `<img src="${sorted[0].flag}" class="flag"> ${sorted[0].name}`;
  document.getElementById("trophyAnimation").classList.remove("hidden");
}

function resetTournament() {
  if (!confirm("Réinitialiser complètement le tournoi ?")) return;
  teams = {};
  matches = [];
  fileMatchs = [];
  etatTournoi = "en_attente";
  document.getElementById("etatTournoiTxt").textContent = "Statut : En attente";
  document.getElementById("score1").disabled = false;
  document.getElementById("score2").disabled = false;
  document.getElementById("playerNames").disabled = false;
  document.getElementById("teamCountry").disabled = false;
  document.getElementById("currentTeams").innerHTML = "";
  document.getElementById("winnerTeam").innerHTML = "";
  document.getElementById("trophyAnimation").classList.add("hidden");
  refreshSelects();
  updateRanking();
  saveData();
}
