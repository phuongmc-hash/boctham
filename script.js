document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const competitionNameInput = document.getElementById('competition-name');
    const teamInput = document.getElementById('team-input');
    const addTeamsButton = document.getElementById('add-teams-button');
    const shuffleButton = document.getElementById('shuffle-button');
    const teamsList = document.getElementById('teams-list');
    const formatSelect = document.getElementById('format-select');
    const drawButton = document.getElementById('draw-button');
    const resetButton = document.getElementById('reset-button');
    const printButton = document.getElementById('print-button');
    const bracketContainer = document.getElementById('bracket-container');
    const knockoutOptions = document.getElementById('knockout-options');
    const autoDrawCheckbox = document.getElementById('auto-draw-checkbox');
    const teamCountElement = document.getElementById('team-count');
    const appFooter = document.getElementById('app-footer');
    const saveButton = document.getElementById('save-button');
    const loadButton = document.getElementById('load-button');
    const fileLoader = document.getElementById('file-loader');

    let teams = [];
    let savedSchedule = null;

    if (appFooter) {
        appFooter.innerHTML = '<p>Tạo bởi Phương Mr. (Gemini - Google AI)</p>';
    } else {
        alert('Lỗi: Cấu trúc HTML không hợp lệ. Vui lòng không chỉnh sửa file index.html.');
        return;
    }

    const drumSound = document.getElementById('drum-roll-sound');

    // --- 1. Xử lý nhập và quản lý đội ---
    addTeamsButton.addEventListener('click', handleAddTeams);
    shuffleButton.addEventListener('click', handleShuffleInput);

    function handleAddTeams() {
        const inputText = teamInput.value;
        const lines = inputText.split('\n').filter(line => line.trim() !== '');
        lines.forEach(line => {
            const teamName = line.trim();
            if (teamName && !teams.some(team => team.name === teamName)) {
                const newTeam = {
                    name: teamName,
                    color: generateColor(teams.length)
                };
                teams.push(newTeam);
            }
        });
        updateTeamsList();
        teamInput.value = '';
    }

    function handleShuffleInput() {
        const inputText = teamInput.value;
        let lines = inputText.split('\n').filter(line => line.trim() !== '');
        shuffleArray(lines);
        teamInput.value = lines.join('\n');
    }

    function generateColor(index) {
        const hue = (index * 40) % 360;
        return `hsl(${hue}, 80%, 40%)`;
    }

    function updateTeamsList() {
        teamsList.innerHTML = '';
        teams.forEach((team, index) => {
            const li = document.createElement('li');
            li.textContent = team.name;
            li.style.color = team.color;
            const deleteSpan = document.createElement('span');
            deleteSpan.innerHTML = '&times;';
            deleteSpan.className = 'delete-team';
            deleteSpan.onclick = () => {
                teams.splice(index, 1);
                teams.forEach((t, i) => {
                    t.color = generateColor(i);
                });
                updateTeamsList();
            };
            li.appendChild(deleteSpan);
            teamsList.appendChild(li);
        });
        teamCountElement.textContent = `(${teams.length})`;
        bracketContainer.innerHTML = '';
        printButton.style.display = 'none';
        saveButton.style.display = 'none';
    }

    formatSelect.addEventListener('change', toggleKnockoutOptions);

    function toggleKnockoutOptions() {
        if (formatSelect.value === 'knockout') {
            knockoutOptions.style.display = 'flex';
        } else {
            knockoutOptions.style.display = 'none';
        }
    }

    // --- 2. Xử lý các nút điều khiển ---
    drawButton.addEventListener('click', handleDraw);
    resetButton.addEventListener('click', handleReset);
    printButton.addEventListener('click', handlePrint);
    saveButton.addEventListener('click', handleSave);
    loadButton.addEventListener('click', () => fileLoader.click());
    fileLoader.addEventListener('change', handleFileLoad);

    function handlePrint() {
        const originalTitle = document.title;
        const competitionName = competitionNameInput.value.trim();
        if (competitionName) {
            document.title = competitionName;
        }
        window.print();
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    }

    function handleSave() {
        if (!savedSchedule) {
            alert("Chưa có lịch thi đấu để lưu!");
            return;
        }
        const competitionName = competitionNameInput.value.trim() || "Lich_thi_dau";
        const filename = `${competitionName.replace(/ /g, "_")}.json`;
        const dataToSave = {
            competitionName: competitionNameInput.value,
            teams: teams,
            format: formatSelect.value,
            schedule: savedSchedule
        };
        const jsonString = JSON.stringify(dataToSave, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    }

    function handleFileLoad(event) {
        const file = event.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = function (e) {
            try {
                const data = JSON.parse(e.target.result);
                renderStateFromFile(data);
            } catch (error) {
                alert("File không hợp lệ hoặc đã bị lỗi.");
                console.error("Lỗi parse JSON:", error);
            }
        };
        reader.readAsText(file);
        fileLoader.value = "";
    }

    function renderStateFromFile(data) {
        competitionNameInput.value = data.competitionName;
        teams = data.teams;
        formatSelect.value = data.format;
        savedSchedule = data.schedule;
        updateTeamsList();
        toggleKnockoutOptions();
        bracketContainer.innerHTML = "";
        
        const competitionTitle = document.createElement('h1');
        competitionTitle.className = 'competition-print-title';
        competitionTitle.textContent = data.competitionName;
        bracketContainer.appendChild(competitionTitle);

        if (data.format === 'knockout') {
            data.schedule.forEach(roundData => {
                const roundTitle = document.createElement('h2');
                roundTitle.className = 'bracket-title';
                roundTitle.textContent = roundData.roundName;
                bracketContainer.appendChild(roundTitle);
                const table = document.createElement('table');
                table.className = 'result-table';
                const thead = table.createTHead();
                const tbody = table.createTBody();
                const headerText = roundData.matchPrefix === 'Cặp' || roundData.matchPrefix === 'Chung kết' ? 'Cặp đấu' : 'Trận đấu';
                thead.innerHTML = `<tr><th style="width: 33.33%;">${headerText}</th><th style="width: 66.67%;">Đội thi đấu</th></tr>`;
                roundData.pairings.forEach((pair, index) => {
                    const row = tbody.insertRow();
                    const matchPrefix = roundData.matchPrefix === "Chung kết" ? "Chung kết" : `${roundData.matchPrefix} ${index + 1}`;
                    row.insertCell().innerHTML = `<b>${matchPrefix}</b>`;
                    const cellMatchup = row.insertCell();
                    if (pair.length === 1 || pair[1] === null || pair[1] === 'BYE') {
                        cellMatchup.innerHTML = `${createTeamHTML(pair[0])} (${roundData.byeText})`;
                    } else {
                        cellMatchup.innerHTML = `${createTeamHTML(pair[0])} <span class="vs">vs</span> ${createTeamHTML(pair[1])}`;
                    }
                });
                bracketContainer.appendChild(table);
            });
        } else { // <<< SỬA LỖI TẢI KẾT QUẢ VÒNG TRÒN
            const mainTitle = document.createElement('h2');
            mainTitle.className = 'bracket-title';
            mainTitle.textContent = "Lịch thi đấu - Vòng tròn";
            bracketContainer.appendChild(mainTitle);

            const table = document.createElement('table');
            table.className = 'result-table';
            const thead = table.createTHead();
            const tbody = table.createTBody();
            
            // Tạo tiêu đề bảng
            if (data.schedule && data.schedule.length > 0) {
                const firstRound = data.schedule[0];
                let headerHTML = `<th>Vòng</th>`;
                for (let i = 1; i <= firstRound.pairings.length; i++) {
                    headerHTML += `<th>Cặp đấu ${i}</th>`;
                }
                thead.innerHTML = `<tr>${headerHTML}</tr>`;
            }

            // Điền dữ liệu các vòng
            data.schedule.forEach(round => {
                const row = tbody.insertRow();
                row.insertCell().innerHTML = `<b>${round.roundName}</b>`;
                round.pairings.forEach(pair => {
                    const cell = row.insertCell();
                    const team1 = pair[0];
                    const team2 = pair[1];
                    let matchCellHTML = '';
                    if (team1.name === "BYE") {
                        matchCellHTML = `${createTeamHTML(team2)} (Nghỉ)`;
                    } else if (team2.name === "BYE") {
                        matchCellHTML = `${createTeamHTML(team1)} (Nghỉ)`;
                    } else {
                        matchCellHTML = `${createTeamHTML(team1)} <span class="vs">vs</span> ${createTeamHTML(team2)}`;
                    }
                    cell.innerHTML = matchCellHTML;
                });
            });
            bracketContainer.appendChild(table);
        }
        printButton.style.display = 'inline-block';
        saveButton.style.display = 'inline-block';
        bracketContainer.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }

    async function handleDraw() {
        if (teams.length < 2) {
            alert('Vui lòng nhập ít nhất 2 đội.');
            return;
        }
        savedSchedule = [];
        drawButton.disabled = true;
        resetButton.disabled = true;
        try {
            if (drumSound) {
                drumSound.currentTime = 0;
                drumSound.play().catch(error => {
                    console.warn("Lỗi file âm thanh hoặc đường dẫn sai, bỏ qua...", error);
                });
            }
            let shuffledTeams = [...teams];
            shuffleArray(shuffledTeams);
            const format = formatSelect.value;
            bracketContainer.innerHTML = '';
            const competitionName = competitionNameInput.value.trim();
            if (competitionName) {
                const titleElement = document.createElement('h1');
                titleElement.className = 'competition-print-title';
                titleElement.textContent = competitionName;
                bracketContainer.appendChild(titleElement);
            }
            if (format === 'knockout') {
                await generateKnockoutTable(shuffledTeams);
            } else {
                await generateRoundRobinSchedule(shuffledTeams);
            }
            saveButton.style.display = 'inline-block';
            printButton.style.display = 'inline-block';
        } catch (error) {
            console.error("Lỗi trong quá trình bốc thăm:", error);
            alert("Đã có lỗi xảy ra. Vui lòng kiểm tra Console (F12) để biết chi tiết.");
        } finally {
            drawButton.disabled = false;
            resetButton.disabled = false;
            if (drumSound) {
                drumSound.pause();
            }
        }
    }

    function handleReset() {
        teams = [];
        updateTeamsList();
        teamInput.focus();
        if (drumSound) {
            drumSound.pause();
            drumSound.currentTime = 0;
        }
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
    }

    // --- 3. Các hàm tạo kết quả ---
    function createTeamHTML(team) {
        if (typeof team === 'object' && team !== null) {
            return `<b class="team-name" style="color: ${team.color}">${team.name}</b>`;
        }
        return `<b class="team-name">${team}</b>`;
    }

    async function generateKnockoutTable(shuffledTeams) {
        let teamsForBracket = [...shuffledTeams];
        if (teamsForBracket.length % 2 !== 0) {
            teamsForBracket.push('BYE');
        }
        const title = document.createElement('h2');
        title.className = 'bracket-title';
        title.textContent = 'Lịch thi đấu - Vòng 1';
        bracketContainer.appendChild(title);

        const roundData = { roundName: 'Lịch thi đấu - Vòng 1', pairings: [], matchPrefix: 'Cặp', byeText: 'Miễn vòng 1' };
        for (let i = 0; i < teamsForBracket.length; i += 2) {
            roundData.pairings.push([teamsForBracket[i], teamsForBracket[i + 1]]);
        }
        savedSchedule.push(roundData);

        const table = document.createElement('table');
        table.className = 'result-table';
        const thead = table.createTHead();
        const tbody = table.createTBody();
        thead.innerHTML = `<tr><th style="width: 33.33%;">Cặp đấu</th><th style="width: 66.67%;">Đội thi đấu</th></tr>`;
        for (let i = 0; i < teamsForBracket.length / 2; i++) {
            const row = tbody.insertRow();
            row.insertCell().innerHTML = `<b>Cặp ${i + 1}</b>`;
            const cell = row.insertCell();
            cell.innerHTML = `${createTeamHTML('???')} <span class="vs">vs</span> ${createTeamHTML('???')}`;
        }
        bracketContainer.appendChild(table);
        table.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await animateKnockoutTable(tbody.rows, teamsForBracket, teams);
        if (autoDrawCheckbox.checked) {
            await generateFutureRounds(teamsForBracket);
        }
    }

    async function generateRoundRobinSchedule(shuffledTeams) {
        const mainTitle = document.createElement('h2');
        mainTitle.className = 'bracket-title';
        mainTitle.textContent = "Lịch thi đấu - Vòng tròn";
        bracketContainer.appendChild(mainTitle);

        let scheduleTeams = [...shuffledTeams];
        if (scheduleTeams.length % 2 !== 0) { scheduleTeams.push("BYE"); }
        const numTeams = scheduleTeams.length;
        const numRounds = numTeams - 1;
        const half = numTeams / 2;
        const table = document.createElement('table');
        table.className = 'result-table';
        const thead = table.createTHead();
        const tbody = table.createTBody();
        let headerHTML = `<th>Vòng</th>`;
        for (let i = 1; i <= half; i++) { headerHTML += `<th>Cặp đấu ${i}</th>`; }
        thead.innerHTML = `<tr>${headerHTML}</tr>`;
        for (let i = 0; i < numRounds; i++) {
            const row = tbody.insertRow();
            row.insertCell().innerHTML = `<b>Vòng ${i + 1}</b>`;
            for (let j = 0; j < half; j++) {
                row.insertCell().innerHTML = `${createTeamHTML('???')}`;
            }
        }
        bracketContainer.appendChild(table);

        const finalSchedule = [];
        for (let round = 0; round < numRounds; round++) {
            const roundData = [];
            for (let i = 0; i < half; i++) {
                roundData.push([scheduleTeams[i], scheduleTeams[numTeams - 1 - i]]);
            }
            finalSchedule.push({ roundName: `Vòng ${round + 1}`, pairings: roundData });
            const lastTeam = scheduleTeams.pop();
            scheduleTeams.splice(1, 0, lastTeam);
        }
        savedSchedule = finalSchedule;

        table.scrollIntoView({ behavior: 'smooth', block: 'center' });
        await animateRoundRobinSchedule(tbody.rows, finalSchedule, teams);
    }

    async function animateKnockoutTable(rows, finalResult, animationPool) {
        const animationTimePerCell = 1500;
        const spinSpeed = 80;
        for (let i = 0; i < rows.length; i++) {
            const cell = rows[i].cells[1];
            const intervalId = setInterval(() => {
                const randomItem1 = animationPool[Math.floor(Math.random() * animationPool.length)];
                const randomItem2 = animationPool[Math.floor(Math.random() * animationPool.length)];
                cell.innerHTML = `${createTeamHTML(randomItem1)} <span class="vs">vs</span> ${createTeamHTML(randomItem2)}`;
            }, spinSpeed);
            await new Promise(resolve => setTimeout(resolve, animationTimePerCell));
            clearInterval(intervalId);
            const team1 = finalResult[i * 2];
            const team2 = finalResult[i * 2 + 1];
            if (team2 === undefined) {
                cell.innerHTML = `${createTeamHTML(team1)} (Miễn thi đấu)`;
            } else if (team2 === 'BYE') {
                cell.innerHTML = `${createTeamHTML(team1)} (Miễn vòng 1)`;
            } else {
                cell.innerHTML = `${createTeamHTML(team1)} <span class="vs">vs</span> ${createTeamHTML(team2)}`;
            }
        }
    }

    async function animateRoundRobinSchedule(rows, finalSchedule, allTeams) {
        const animationTimePerCell = 1000;
        const spinSpeed = 80;
        for (let i = 0; i < rows.length; i++) {
            const cellsToAnimate = Array.from(rows[i].cells).slice(1);
            for (let j = 0; j < cellsToAnimate.length; j++) {
                const cell = cellsToAnimate[j];
                const intervalId = setInterval(() => {
                    const randomTeam1 = allTeams[Math.floor(Math.random() * allTeams.length)];
                    const randomTeam2 = allTeams[Math.floor(Math.random() * allTeams.length)];
                    cell.innerHTML = `${createTeamHTML(randomTeam1)} <span class="vs">vs</span> ${createTeamHTML(randomTeam2)}`;
                }, spinSpeed);
                await new Promise(resolve => setTimeout(resolve, animationTimePerCell));
                clearInterval(intervalId);
                const matchData = finalSchedule[i].pairings[j];
                const team1 = matchData[0];
                const team2 = matchData[1];
                if (team1 === "BYE") cell.innerHTML = `${createTeamHTML(team2)} (Nghỉ)`;
                else if (team2 === "BYE") cell.innerHTML = `${createTeamHTML(team1)} (Nghỉ)`;
                else cell.innerHTML = `${createTeamHTML(team1)} <span class="vs">vs</span> ${createTeamHTML(team2)}`;
            }
        }
    }

    async function generateFutureRounds(firstRoundPairings) {
        let lastByeParticipant = null;
        const byeIndex = firstRoundPairings.indexOf('BYE');
        if (byeIndex !== -1) {
            lastByeParticipant = (byeIndex % 2 === 0) ? firstRoundPairings[byeIndex + 1] : firstRoundPairings[byeIndex - 1];
        }
        let currentRoundParticipants = [];
        for (let i = 0; i < firstRoundPairings.length; i += 2) {
            const team1 = firstRoundPairings[i];
            const team2 = firstRoundPairings[i + 1];
            if (team1 === 'BYE') { currentRoundParticipants.push(team2); }
            else if (team2 === 'BYE') { currentRoundParticipants.push(team1); }
            else { currentRoundParticipants.push(`Thắng Cặp ${i / 2 + 1} (Vòng 1)`); }
        }
        let roundNumber = 2;
        while (currentRoundParticipants.length > 1) {
            let roundName = `Vòng ${roundNumber}`;
            if (currentRoundParticipants.length === 2) roundName = "Chung kết";
            else if (currentRoundParticipants.length <= 4 && currentRoundParticipants.length > 2) roundName = "Bán kết";
            else if (currentRoundParticipants.length <= 8) roundName = "Tứ kết";

            if (currentRoundParticipants.length === 2) {
                const finalTitle = document.createElement('h2');
                finalTitle.className = 'bracket-title';
                finalTitle.textContent = `Lịch thi đấu - ${roundName}`;
                bracketContainer.appendChild(finalTitle);
                const finalTable = document.createElement('table');
                finalTable.className = 'result-table';
                finalTable.innerHTML = `<thead><tr><th style="width: 33.33%;">Cặp đấu</th><th style="width: 66.67%;">Đội thi đấu</th></tr></thead>
                <tbody><tr><td><b>Chung kết</b></td><td>${createTeamHTML(currentRoundParticipants[0])} <span class="vs">vs</span> ${createTeamHTML(currentRoundParticipants[1])}</td></tr></tbody>`;
                bracketContainer.appendChild(finalTable);
                savedSchedule.push({ roundName: `Lịch thi đấu - ${roundName}`, pairings: [currentRoundParticipants], matchPrefix: 'Chung kết', byeText: '' });
                finalTable.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
            }

            let attempts = 0;
            const maxAttempts = 50;
            while (attempts < maxAttempts) {
                shuffleArray(currentRoundParticipants);
                if (currentRoundParticipants.length % 2 === 0) { break; }
                if (!lastByeParticipant) { break; }
                const potentialByeParticipant = currentRoundParticipants[currentRoundParticipants.length - 1];
                const lastByeIdentifier = (typeof lastByeParticipant === 'object' && lastByeParticipant !== null) ? lastByeParticipant.name : lastByeParticipant;
                const potentialByeIdentifier = (typeof potentialByeParticipant === 'object' && potentialByeParticipant !== null) ? potentialByeParticipant.name : potentialByeParticipant;
                if (lastByeIdentifier !== potentialByeIdentifier) { break; }
                attempts++;
            }

            const title = document.createElement('h2');
            title.className = 'bracket-title';
            title.textContent = `Lịch thi đấu - ${roundName}`;
            bracketContainer.appendChild(title);
            const table = document.createElement('table');
            table.className = 'result-table';
            const thead = table.createTHead();
            const tbody = table.createTBody();
            thead.innerHTML = `<tr><th style="width: 33.33%;">Cặp đấu</th><th style="width: 66.67%;">Đội thi đấu</th></tr>`;

            let nextRoundParticipants = [];
            let currentByeInThisRound = null;
            const roundData = { roundName: `Lịch thi đấu - ${roundName}`, pairings: [], matchPrefix: 'Cặp', byeText: 'Miễn thi đấu' };

            for (let i = 0; i < currentRoundParticipants.length; i += 2) {
                const row = tbody.insertRow();
                row.insertCell().innerHTML = `<b>Cặp ${i / 2 + 1}</b>`;
                const cellMatchup = row.insertCell();
                const participant1 = currentRoundParticipants[i];
                const participant2 = currentRoundParticipants[i + 1];
                if (participant2) {
                    cellMatchup.innerHTML = `${createTeamHTML('???')} <span class="vs">vs</span> ${createTeamHTML('???')}`;
                    nextRoundParticipants.push(`Thắng Cặp ${i / 2 + 1} (${roundName})`);
                    roundData.pairings.push([participant1, participant2]);
                } else {
                    cellMatchup.innerHTML = `${createTeamHTML('???')} (Miễn thi đấu)`;
                    nextRoundParticipants.push(participant1);
                    currentByeInThisRound = participant1;
                    roundData.pairings.push([participant1, null]);
                }
            }
            savedSchedule.push(roundData);
            bracketContainer.appendChild(table);
            table.scrollIntoView({ behavior: 'smooth', block: 'center' });

            let animationResult = [];
            for (let i = 0; i < currentRoundParticipants.length; i += 2) {
                animationResult.push(currentRoundParticipants[i]);
                if (currentRoundParticipants[i + 1]) {
                    animationResult.push(currentRoundParticipants[i + 1]);
                } else {
                    animationResult.push(undefined);
                }
            }
            await animateKnockoutTable(tbody.rows, animationResult, currentRoundParticipants);
            lastByeParticipant = currentByeInThisRound;
            currentRoundParticipants = nextRoundParticipants;
            roundNumber++;
        }
    }
});