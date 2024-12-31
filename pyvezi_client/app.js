class ConnectFour {
    constructor() {
        // Game constants
        this.ROWS = 6;
        this.COLS = 7;
        this.MIN_MOVE_TIME = 1000;

        // Game state
        this.board = [];
        this.currentPlayer = "red";
        this.elapsedTime = 0;
        this.gameMode = "";
        this.fileContent = "";
        this.storedMoves = [];
        // Computer settings
        this.choosenDif1 = "";
        this.choosenDif2 = "";
        this.choosenAlg1 = "";
        this.choosenAlg2 = "";
        this.computerDifficulty = "";
        this.computerAlgorithm = "";

        // DOM elements
        this.gameBoard = document.getElementById("game-board");
        this.statusDisplay = document.getElementById("current-player");
        this.fileUploadDisplay = document.getElementById("file-upload-status");
        this.gameModeModal = document.getElementById("game-mode-modal");
        this.restartButton = document.getElementById("restart-btn");
        this.statusDiv = document.getElementById("status");
        this.difficultyModal = document.getElementById("difficulty-modal");
        this.thinkingTime = document.querySelector("#thinking-time");
        this.initializePauseHandler();
    }

    initialize() {
        // Set up file input listener first
        const fileInput = document.querySelector('input[type="file"]');
        if (fileInput) {
            fileInput.addEventListener("change", async (event) => {
                this.showGameModeModal();
            });
        } else {
            this.showGameModeModal();
        }
        this.restartButton.addEventListener("click", () => this.resetGame());
    }

    initializePauseHandler() {
        window.addEventListener("keydown", (e) => {
            if (e.code === "Space") {
                this._isPaused = !this._isPaused;
                this.updatePauseStatus();
            }
        });
    }

    parseMoveFile(text) {
        console.log(text);
        return text
            .trim()
            .split(/\s+/)
            .map(Number)
            .filter((num) => !isNaN(num) && num >= 0 && num < this.COLS);
    }

    async handleFileUpload(event) {
        const file = event.target.files[0];
        if (!file) return;

        try {
            const text = await file.text();
            this.storedMoves = this.parseMoveFile(text);
            if (this.storedMoves.length > 0) {
                this.currentPlayer = "red";
                this.fileContent = text + "\n"; // Store existing moves at the start of fileContent
            }

            const fileStatus = document.getElementById("file-status");
            if (fileStatus) {
                fileStatus.textContent = `File loaded: ${file.name} (${this.storedMoves.length} moves)`;
            }
        } catch (error) {
            alert(`Error loading moves: ${error.message}`);
            console.error(error);
        }
    }

    updatePauseStatus() {
        const pauseStatus = this._isPaused ? "PAUSED" : "PLAYING";
        this.statusDisplay.textContent = `${this.currentPlayer.toUpperCase()} - ${pauseStatus}`;
    }

    async createBoard() {
        this.gameBoard.innerHTML = "";
        this.board = Array.from({ length: this.ROWS }, () =>
            Array(this.COLS).fill(0)
        );

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener("click", (event) =>
                    this.handleClick(event)
                );
                this.gameBoard.appendChild(cell);
            }
        }
        for (const col of this.storedMoves) {
            const row = this.findAvailableRow(col);
            if (row !== null) {
                this.makeMove(row, col, true);
            }
        }
        if (this.gameMode === "computer-vs-computer") {
            this.computerTurn(this.choosenDif1, this.choosenAlg1);
        }
        if (
            this.gameMode == "man-vs-computer" &&
            this.currentPlayer == "yellow"
        ) {
            this.computerTurn(this.computerDifficulty, this.computerAlgorithm);
        }
    }

    handleClick(event) {
        if (
            this.gameMode === "computer-vs-computer" ||
            (this.gameMode === "man-vs-computer" &&
                this.currentPlayer === "yellow")
        ) {
            return;
        }

        const col = parseInt(event.target.dataset.col);
        const row = this.findAvailableRow(col);
        if (row === null) return;

        this.makeMove(row, col);
    }

    makeMove(row, col, isFromFile = false) {
        this.board[row][col] = this.currentPlayer;
        if (!isFromFile) {
            this.fileContent += col + "\n";
        }

        // Remove previous winning/last-played highlights
        document.querySelectorAll(".cell.winning").forEach((cell) => {
            cell.classList.remove("winning");
        });

        // Add current player's color and highlight last played cell
        const cell = document.querySelector(
            `.cell[data-row='${row}'][data-col='${col}']`
        );
        cell.classList.add(this.currentPlayer);
        cell.classList.add("winning");

        if (this.checkWin(row, col)) {
            const winningCells = this.getWinningCells(row, col);
            this.highlightWinningCells(winningCells);
            setTimeout(() => {
                alert(
                    `${
                        this.currentPlayer.charAt(0).toUpperCase() +
                        this.currentPlayer.slice(1)
                    } wins!`
                );
            }, 100);
            return;
        }

        if (this.checkDraw()) {
            alert("Game is a draw!");
            return;
        }

        this.thinkingTime.textContent = this.elapsedTime;
        this.currentPlayer = this.currentPlayer === "red" ? "yellow" : "red";
        this.updatePauseStatus();

        if (!isFromFile) {
            if (
                this.gameMode === "man-vs-computer" &&
                this.currentPlayer === "yellow"
            ) {
                this.computerTurn(
                    this.computerDifficulty,
                    this.computerAlgorithm
                );
            } else if (this.gameMode === "computer-vs-computer") {
                if (this.currentPlayer === "red") {
                    this.computerTurn(this.choosenDif1, this.choosenAlg1);
                } else {
                    this.computerTurn(this.choosenDif2, this.choosenAlg2);
                }
            }
        }
    }

    highlightWinningCells(cells) {
        cells.forEach(([row, col]) => {
            const cell = document.querySelector(
                `.cell[data-row='${row}'][data-col='${col}']`
            );
            cell.classList.add("winning");
        });
    }

    getWinningCells(row, col) {
        const player = this.board[row][col];
        const directions = [
            [0, 1], // horizontal
            [1, 0], // vertical
            [1, 1], // diagonal down-right
            [1, -1], // diagonal down-left
        ];

        for (const [dx, dy] of directions) {
            const cells = this.getWinningCellsInDirection(
                row,
                col,
                dx,
                dy,
                player
            );
            if (cells.length >= 4) {
                return cells;
            }
        }
        return [];
    }

    saveFile() {
        const blob = new Blob([this.fileContent], { type: "text/plain" });
        const file = new File([blob], "numbers.txt", { type: "text/plain" });

        const link = document.createElement("a");
        link.href = URL.createObjectURL(file);
        link.download = file.name;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    }

    getWinningCellsInDirection(row, col, dx, dy, player) {
        const cells = [[row, col]];

        // Check forward
        for (let step = 1; step <= 3; step++) {
            const r = row + dx * step;
            const c = col + dy * step;
            if (!this.isValidCell(r, c) || this.board[r][c] !== player) break;
            cells.push([r, c]);
        }

        // Check backward
        for (let step = 1; step <= 3; step++) {
            const r = row - dx * step;
            const c = col - dy * step;
            if (!this.isValidCell(r, c) || this.board[r][c] !== player) break;
            cells.push([r, c]);
        }

        return cells;
    }

    isValidCell(row, col) {
        return row >= 0 && row < this.ROWS && col >= 0 && col < this.COLS;
    }

    findAvailableRow(col) {
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (this.board[row][col] == 0) return row;
        }
        return null;
    }

    checkWin(row, col) {
        const directions = [
            [0, 1], // horizontal
            [1, 0], // vertical
            [1, 1], // diagonal down-right
            [1, -1], // diagonal down-left
        ];
        return directions.some(([dx, dy]) =>
            this.checkDirection(row, col, dx, dy)
        );
    }

    checkDirection(row, col, dx, dy) {
        const player = this.board[row][col];
        let count = 1;

        // Check forward
        for (let step = 1; step <= 3; step++) {
            const r = row + dx * step;
            const c = col + dy * step;
            if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) break;
            if (this.board[r][c] !== player) break;
            count++;
        }

        // Check backward
        for (let step = 1; step <= 3; step++) {
            const r = row - dx * step;
            const c = col - dy * step;
            if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) break;
            if (this.board[r][c] !== player) break;
            count++;
        }

        return count >= 4;
    }

    checkDraw() {
        return this.board.every((row) => row.every((cell) => cell !== 0));
    }

    async computerTurn(difficulty, algorithm) {
        await this.waitWhilePaused();
        const startTime = Date.now();

        try {
            const boardState = this.board.map((row) =>
                row.map((cell) => {
                    if (cell === "red") return 1;
                    if (cell === "yellow") return 2;
                    return 0; // Empty cell
                })
            );

            const response = await fetch(
                `http://127.0.0.1:8000/game/computer_move/?mode=${difficulty}&algorithm=${algorithm}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ board: boardState }),
                }
            );

            const data = await response.json();
            this.elapsedTime = await this.ensureMinimumDelay(startTime);
            await this.waitWhilePaused();

            const col = data.computed_move;
            if (col !== null) {
                const row = this.findAvailableRow(col);
                if (row !== null) {
                    this.makeMove(row, col);
                }
            }
        } catch (error) {
            console.error("Computer move error:", error);
        }
    }

    async sleep(ms) {
        return new Promise((resolve) => setTimeout(resolve, ms));
    }

    async waitWhilePaused() {
        while (this._isPaused) {
            await this.sleep(100);
        }
    }

    async ensureMinimumDelay(startTime) {
        const elapsedTime = Date.now() - startTime;
        if (elapsedTime < this.MIN_MOVE_TIME) {
            await this.sleep(this.MIN_MOVE_TIME - elapsedTime);
        }
        return Date.now() - startTime;
    }

    startGame(selectedMode) {
        this.gameMode = selectedMode;
        if (
            selectedMode === "man-vs-computer" ||
            selectedMode === "computer-vs-computer"
        ) {
            this.showDifficultyModal(selectedMode);
        } else {
            this.startGameSetup();
        }
    }

    showGameModeModal() {
        this.gameModeModal.style.display = "flex";
    }

    showDifficultyModal(mode) {
        this.difficultyModal.style.display = "flex";
        const difficultyForm = document.getElementById("difficulty-form");
        difficultyForm.innerHTML = this.getDifficultyFormHTML(mode);

        document
            .getElementById("start-game")
            .addEventListener("click", async () => {
                this.startGameWithDifficulties(mode);
            });
    }

    getDifficultyFormHTML(mode) {
        if (mode === "man-vs-computer") {
            return `
                <h3>Select Algorithm for Computer:</h3>
                <select id="algorithm-select">
                    <option value="negscout">Negscout</option>
                    <option value="minimax">Minimax</option>
                </select>
                <h3>Select Difficulty for Computer:</h3>
                <select id="difficulty-select">
                    <option value="">Choose difficulty...</option>
                    <option value="easy">Easy</option>
                    <option value="medium">Medium</option>
                    <option value="expert">Expert</option>
                </select>
                <button id="start-game">Start Game</button>
            `;
        } else {
            return `
                <div class='difficulty-selects'>
                    <div>
                        <h3>Select Algorithm for Computer 1:</h3>
                        <select id="algorithm-select-1">
                            <option value="negscout">Negscout</option>
                            <option value="minimax">Minimax</option>
                        </select>
                        <h3>Select Difficulty for Computer 1:</h3>
                        <select id="difficulty-select-1">
                            <option value="">Choose difficulty...</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>
                    <div>
                        <h3>Select Algorithm for Computer 2:</h3>
                        <select id="algorithm-select-2">
                            <option value="negscout">Negscout</option>
                            <option value="minimax">Minimax</option>
                        </select>
                        <h3>Select Difficulty for Computer 2:</h3>
                        <select id="difficulty-select-2">
                            <option value="">Choose difficulty...</option>
                            <option value="easy">Easy</option>
                            <option value="medium">Medium</option>
                            <option value="expert">Expert</option>
                        </select>
                    </div>
                </div>
                <button id="start-game">Start Game</button>
            `;
        }
    }

    async startGameWithDifficulties(mode) {
        if (mode === "man-vs-computer") {
            const difficulty =
                document.querySelector("#difficulty-select").value;
            if (!difficulty) {
                alert("Please select a difficulty level.");
                return;
            }
            this.computerDifficulty = difficulty;
            this.computerAlgorithm =
                document.querySelector("#algorithm-select").value || "negscout";
        } else if (mode === "computer-vs-computer") {
            const difficulty1 = document.querySelector(
                "#difficulty-select-1"
            ).value;
            const difficulty2 = document.querySelector(
                "#difficulty-select-2"
            ).value;
            if (!difficulty1 || !difficulty2) {
                alert("Please select difficulty levels for both computers.");
                return;
            }

            this.choosenAlg1 =
                document.querySelector("#algorithm-select-1").value ||
                "negscout";
            this.choosenAlg2 =
                document.querySelector("#algorithm-select-2").value ||
                "negscout";
            this.choosenDif1 = difficulty1;
            this.choosenDif2 = difficulty2;
        }

        this.difficultyModal.style.display = "none";
        await this.startGameSetup();
    }

    async startGameSetup() {
        this.gameModeModal.style.display = "none";
        this.gameBoard.style.display = "grid";
        this.statusDiv.style.display = "block";
        this.restartButton.style.display = "block";
        await this.createBoard();
    }
}

// Initialize the game
const game = new ConnectFour();
game.initialize();
