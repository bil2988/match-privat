let teams = {};
let matches = [];
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
  if (user === "admin" && pass === "ifca123") {
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
    alert("Tu ne peux plus ajouter d’équipe, le tournoi a commencé.");
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
  select1.innerHTML = select2.innerHTML = "";
  Object.keys(teams).forEach(team => {
    select1.innerHTML += `<option value="${team}">${team}</option>`;
    select2.innerHTML += `<option value="${team}">${team}</option>`;
  });
}

async function submitScore() {
  if (etatTournoi !== "en_cours") {
    alert("Le tournoi n’est pas en cours.");
    return;
  }

  const t1 = document.getElementById("team1").value;
  const t2 = document.getElementById("team2").value;
  const s1 = parseInt(document.getElementById("score1").value);
  const s2 = parseInt(document.getElementById("score2").value);
  if (t1 === t2 || isNaN(s1) || isNaN(s2)) return;

  matches.push({ t1, t2, s1, s2 });
  document.getElementById("currentTeams").innerHTML = `
    <img src="${teams[t1].flag}" class="flag"> ${t1} vs 
    <img src="${teams[t2].flag}" class="flag"> ${t2}`;

  if (s1 > s2) {
    teams[t1].wins++; teams[t2].losses++; teams[t1].points += 3;
  } else if (s1 < s2) {
    teams[t2].wins++; teams[t1].losses++; teams[t2].points += 3;
  } else {
    teams[t1].points += 1; teams[t2].points += 1;
  }

  updateRanking();
  checkIfFinished();
  await saveData();
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

function checkIfFinished() {
  const playedTeams = new Set();
  matches.forEach(match => {
    playedTeams.add(match.t1);
    playedTeams.add(match.t2);
  });
  if (playedTeams.size === Object.keys(teams).length) {
    const sorted = Object.values(teams).sort((a, b) => b.points - a.points);
    document.getElementById("winnerTeam").innerHTML = `<img src="${sorted[0].flag}" class="flag"> ${sorted[0].name}`;
    document.getElementById("trophyAnimation").classList.remove("hidden");
  }
}

function startTournament() {
  if (Object.keys(teams).length < 2) {
    alert("Ajoute au moins deux équipes avant de commencer !");
    return;
  }
  etatTournoi = "en_cours";
  document.getElementById("etatTournoiTxt").textContent = "Statut : En cours";
  document.getElementById("playerNames").disabled = true;
  document.getElementById("teamCountry").disabled = true;
}

function endTournament() {
  etatTournoi = "termine";
  document.getElementById("etatTournoiTxt").textContent = "Statut : Terminé";
  document.getElementById("score1").disabled = true;
  document.getElementById("score2").disabled = true;
  document.getElementById("team1").disabled = true;
  document.getElementById("team2").disabled = true;
  document.getElementById("currentTeams").innerHTML += "<br><strong>Le tournoi est terminé.</strong>";
    }
