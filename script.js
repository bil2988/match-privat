let teams = {};
let matches = [];

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

function addTeam() {
  const name = document.getElementById("teamName").value;
  const flag = document.getElementById("teamFlag").value;
  if (name && !teams[name]) {
    teams[name] = { name, flag, wins: 0, losses: 0, points: 0 };
    document.getElementById("teamName").value = "";
    document.getElementById("teamFlag").value = "";
    refreshSelects();
    updateRanking();
  }
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

function submitScore() {
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
    teams[t1].wins++;
    teams[t2].losses++;
    teams[t1].points += 3;
  } else if (s1 < s2) {
    teams[t2].wins++;
    teams[t1].losses++;
    teams[t2].points += 3;
  } else {
    teams[t1].points += 1;
    teams[t2].points += 1;
  }
  updateRanking();
  checkIfFinished();
}

function updateRanking() {
  const table = document.getElementById("rankingTable");
  const sorted = Object.values(teams).sort((a, b) => b.points - a.points);
  table.innerHTML = "";
  sorted.forEach((team, index) => {
    table.innerHTML += `<tr><td>${index + 1}</td><td><img src="${team.flag}" class="flag"> ${team.name}</td><td>${team.wins}</td><td>${team.losses}</td><td>${team.points}</td></tr>`;
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
