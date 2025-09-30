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
    const appFooter = document.getElementById('app-footer');

    // Kiểm tra sự tồn tại của footer, nếu không có sẽ báo lỗi và dừng ứng dụng
    if (appFooter) {
        appFooter.innerHTML = '<p>Tạo bởi Phương Mr. (Gemini - Google AI)</p>';
    } else {
        alert('Lỗi: Cấu trúc HTML không hợp lệ. Vui lòng không chỉnh sửa file index.html.');
        return; // Dừng toàn bộ script, ứng dụng sẽ không hoạt động
    }

    const drumSound = document.getElementById('drum-roll-sound');
    let teams = [];

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

        shuffleArray(lines); // Gọi hàm xáo trộn có sẵn

        teamInput.value = lines.join('\n'); // Nối lại thành chuỗi và gán lại vào khung nhập
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
        bracketContainer.innerHTML = '';
        printButton.style.display = 'none';
    }
	
	// <<< THÊM LISTENER MỚI ĐỂ ẨN/HIỆN TÙY CHỌN
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

    function handlePrint() {
        const originalTitle = document.title;
        const competitionName = competitionNameInput.value.trim();

        if (competitionName) {
            document.title = competitionName; // Tạm thời đổi tiêu đề trang
        }

        window.print(); // Mở hộp thoại in

        // Sau một khoảng trễ ngắn, trả lại tiêu đề cũ
        setTimeout(() => {
            document.title = originalTitle;
        }, 500);
    }

    async function handleDraw() {
        if (teams.length < 2) {
            alert('Vui lòng nhập ít nhất 2 đội.');
            return;
        }

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

            // <<< THÊM MỚI: Lấy và hiển thị tên giải đấu
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

        const table = document.createElement('table');
        table.className = 'result-table knockout-table';
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

        // <<< THAY ĐỔI LOGIC: KIỂM TRA CHECKBOX TRƯỚC KHI TẠO CÁC VÒNG SAU
        if (autoDrawCheckbox.checked) {
            await generateFutureRounds(teamsForBracket);
        }
    }

    async function generateRoundRobinSchedule(shuffledTeams) {
        bracketContainer.innerHTML = `<h2 class="bracket-title">Lịch thi đấu - Vòng tròn</h2>`;
        let scheduleTeams = [...shuffledTeams];
        if (scheduleTeams.length % 2 !== 0) {
            scheduleTeams.push("BYE");
        }
        const numTeams = scheduleTeams.length;
        const numRounds = numTeams - 1;
        const half = numTeams / 2;
        const table = document.createElement('table');
        table.className = 'result-table';
        const thead = table.createTHead();
        const tbody = table.createTBody();
        let headerHTML = `<th>Vòng</th>`;
        for (let i = 1; i <= half; i++) {
            headerHTML += `<th>Cặp đấu ${i}</th>`;
        }
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
            finalSchedule.push(roundData);
            const lastTeam = scheduleTeams.pop();
            scheduleTeams.splice(1, 0, lastTeam);
        }
        table.scrollIntoView({ behavior: 'smooth', block: 'center' });
        // Chờ animation hoàn tất
        await animateRoundRobinSchedule(tbody.rows, finalSchedule, teams);
        // Sau đó mới bật lại nút
        drawButton.disabled = false;
        resetButton.disabled = false;
        if (drumSound) drumSound.pause();
    }

    async function animateKnockoutTable(rows, finalResult, allTeams) {
        const animationTimePerCell = 2000;
        const spinSpeed = 80;
        for (let i = 0; i < rows.length; i++) {
            const cell = rows[i].cells[1];
            const intervalId = setInterval(() => {
                const randomTeam1 = allTeams[Math.floor(Math.random() * allTeams.length)];
                const randomTeam2 = allTeams[Math.floor(Math.random() * allTeams.length)];
                cell.innerHTML = `${createTeamHTML(randomTeam1)} <span class="vs">vs</span> ${createTeamHTML(randomTeam2)}`;
            }, spinSpeed);
            await new Promise(resolve => setTimeout(resolve, animationTimePerCell));
            clearInterval(intervalId);
            const team1 = finalResult[i * 2];
            const team2 = finalResult[i * 2 + 1];

            if (team2 === undefined) { // Xử lý đội miễn đấu ở các vòng sau
                cell.innerHTML = `${createTeamHTML(team1)} (Miễn thi đấu)`;
            }
            else if (team2 === 'BYE') { // Xử lý đội miễn đấu ở Vòng 1
                cell.innerHTML = `${createTeamHTML(team1)} (Miễn vòng 1)`;
            } else { // Xử lý trận đấu bình thường
                cell.innerHTML = `${createTeamHTML(team1)} <span class="vs">vs</span> ${createTeamHTML(team2)}`;
            }
        }
    }

    async function animateRoundRobinSchedule(rows, finalSchedule, allTeams) {
        const animationTimePerCell = 2000;
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
                const matchData = finalSchedule[i][j];
                const team1 = matchData[0];
                const team2 = matchData[1];
                if (team1 === "BYE") cell.innerHTML = `${createTeamHTML(team2)} (Nghỉ)`;
                else if (team2 === "BYE") cell.innerHTML = `${createTeamHTML(team1)} (Nghỉ)`;
                else cell.innerHTML = `${createTeamHTML(team1)} <span class="vs">vs</span> ${createTeamHTML(team2)}`;
            }
        }
    }
    // HÀM TẠO CÁC VÒNG ĐẤU SAU
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
            if (team1 === 'BYE') {
                currentRoundParticipants.push(team2);
            } else if (team2 === 'BYE') {
                currentRoundParticipants.push(team1);
            } else {
                currentRoundParticipants.push(`Thắng Cặp ${i / 2 + 1} (Vòng 1)`);
            }
        }

        let roundNumber = 2;
        while (currentRoundParticipants.length > 1) {

            if (currentRoundParticipants.length === 2) {
                const finalTitle = document.createElement('h2');
                finalTitle.className = 'bracket-title';
                finalTitle.textContent = `Lịch thi đấu - Chung kết`;
                bracketContainer.appendChild(finalTitle);
                const finalTable = document.createElement('table');
                finalTable.className = 'result-table';
                finalTable.innerHTML = `<thead><tr><th style="width: 33.33%;">Cặp đấu</th><th style="width: 66.67%;">Đội thi đấu</th></tr></thead>
                <tbody><tr><td><b>Chung kết</b></td><td>${createTeamHTML(currentRoundParticipants[0])} <span class="vs">vs</span> ${createTeamHTML(currentRoundParticipants[1])}</td></tr></tbody>`;
                bracketContainer.appendChild(finalTable);
                finalTable.scrollIntoView({ behavior: 'smooth', block: 'center' });
                break;
            }

            // <<< CẬP NHẬT LOGIC CHỐNG MIỄN ĐẤU 2 LẦN
            let attempts = 0;
            const maxAttempts = 50; // Giới hạn an toàn
            while (attempts < maxAttempts) {
                shuffleArray(currentRoundParticipants);

                // Nếu số đội là chẵn, không có miễn đấu, bốc thăm luôn hợp lệ
                if (currentRoundParticipants.length % 2 === 0) {
                    break;
                }

                // Nếu vòng trước không có ai miễn đấu, bốc thăm luôn hợp lệ
                if (!lastByeParticipant) {
                    break;
                }

                // Lấy ra suất miễn đấu tiềm năng của vòng này
                const potentialByeParticipant = currentRoundParticipants[currentRoundParticipants.length - 1];

                // Lấy định danh (tên) để so sánh
                const lastByeIdentifier = (typeof lastByeParticipant === 'object' && lastByeParticipant !== null) ? lastByeParticipant.name : lastByeParticipant;
                const potentialByeIdentifier = (typeof potentialByeParticipant === 'object' && potentialByeParticipant !== null) ? potentialByeParticipant.name : potentialByeParticipant;

                // Nếu suất miễn đấu vòng này KHÁC với vòng trước, bốc thăm hợp lệ
                if (lastByeIdentifier !== potentialByeIdentifier) {
                    break;
                }

                // Nếu giống nhau, tiếp tục vòng lặp để xáo trộn lại
                attempts++;
            }

            const title = document.createElement('h2');
            title.className = 'bracket-title';
            let roundName = `Vòng ${roundNumber}`;
            if (currentRoundParticipants.length <= 4 && currentRoundParticipants.length > 2) roundName = "Bán kết";
            else if (currentRoundParticipants.length <= 8) roundName = "Tứ kết";
            title.textContent = `Lịch thi đấu - ${roundName}`;
            bracketContainer.appendChild(title);

            const table = document.createElement('table');
            table.className = 'result-table';
            const thead = table.createTHead();
            const tbody = table.createTBody();
            thead.innerHTML = `<tr><th style="width: 33.33%;">Cặp đấu</th><th style="width: 66.67%;">Đội thi đấu</th></tr>`;

            let nextRoundParticipants = [];
            let currentByeInThisRound = null;

            for (let i = 0; i < currentRoundParticipants.length; i += 2) {
                const row = tbody.insertRow();
                row.insertCell().innerHTML = `<b>Cặp ${i / 2 + 1}</b>`;
                const cellMatchup = row.insertCell();
                const participant1 = currentRoundParticipants[i];
                const participant2 = currentRoundParticipants[i + 1];
                if (participant2) {
                    cellMatchup.innerHTML = `${createTeamHTML('???')} <span class="vs">vs</span> ${createTeamHTML('???')}`;
                    nextRoundParticipants.push(`Thắng Cặp ${i / 2 + 1} (${roundName})`);
                } else {
                    cellMatchup.innerHTML = `${createTeamHTML('???')} (Miễn thi đấu)`;
                    nextRoundParticipants.push(participant1);
                    currentByeInThisRound = participant1;
                }
            }
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