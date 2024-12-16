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
        this.storedMoves = null;
        this.currentMoveIndex = 0;
        this._isPaused = false;

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
        this.isLoadingFromFile = false;
        this.initializePauseHandler();
    }

    initialize() {
        this.showGameModeModal();
        this.restartButton.addEventListener("click", () => this.createBoard());
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
            const moves = this.parseMoveFile(text);

            if (moves.length === 0) {
                throw new Error("No valid moves found in file");
            }

            this.storedMoves = moves;
            this.currentMoveIndex = 0;

            const fileStatus = document.getElementById("file-status");
            if (fileStatus) {
                fileStatus.textContent = `File loaded: ${file.name} (${moves.length} moves)`;
            }
        } catch (error) {
            alert(`Error loading moves: ${error.message}`);
            console.error(error);
        }
    }

    async playStoredMoves() {
        if (
            !this.storedMoves ||
            this.currentMoveIndex >= this.storedMoves.length
        ) {
            return;
        }
        this.isLoadingFromFile = true;
        while (this.currentMoveIndex < this.storedMoves.length) {
            await this.waitWhilePaused();
            const col = this.storedMoves[this.currentMoveIndex];
            const row = this.findAvailableRow(col);

            if (row === null) {
                throw new Error(`Invalid move: column ${col} is full`);
            }

            await this.sleep(500);
            this.makeMove(row, col);
            this.currentMoveIndex++;
        }
        this.isLoadingFromFile = false;
        this.continueWithGameMode();
    }

    continueWithGameMode() {
        if (
            this.gameMode === "man-vs-computer" &&
            this.currentPlayer === "yellow"
        ) {
            this.computerTurn(this.computerDifficulty, this.computerAlgorithm);
        } else if (this.gameMode === "computer-vs-computer") {
            const difficulty =
                this.currentPlayer === "red"
                    ? this.choosenDif1
                    : this.choosenDif2;
            const algorithm =
                this.currentPlayer === "red"
                    ? this.choosenAlg1
                    : this.choosenAlg2;
            this.computerTurn(difficulty, algorithm);
        }
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

    updatePauseStatus() {
        const pauseStatus = this._isPaused ? "PAUSED" : "PLAYING";

        this.statusDisplay.textContent = `${this.currentPlayer.toUpperCase()} - ${pauseStatus}`;
        this.fileUploadDisplay.textContent = `${
            !this.isLoadingFromFile ? "" : `FILE LOADING ${pauseStatus}`
        } `;
    }

    async createBoard() {
        this.gameBoard.innerHTML = "";
        this.board = Array.from({ length: this.ROWS }, () =>
            Array(this.COLS).fill(null)
        );

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = document.createElement("div");
                cell.classList.add("cell");
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener("click", (event) => {
                    if (!this.isLoadingFromFile) {
                        this.handleClick(event);
                    }
                });
                this.gameBoard.appendChild(cell);
            }
        }
        if (this.storedMoves != null) {
            await this.playStoredMoves();
        }

        if (this.gameMode === "computer-vs-computer") {
            this.computerTurn(this.choosenDif1, this.choosenAlg1);
        }
        if (
            this.gameMode == "man-vs-computer" &&
            this.currentPlayer == "yellow"
        ) {
            this.computerTurn(this.gameMode, this.computerAlgorithm);
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

    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        const cell = document.querySelector(
            `.cell[data-row='${row}'][data-col='${col}']`
        );
        cell.classList.add(this.currentPlayer);

        if (this.checkWin(row, col)) {
            alert(
                `${
                    this.currentPlayer.charAt(0).toUpperCase() +
                    this.currentPlayer.slice(1)
                } wins!`
            );
            return;
        }

        if (this.checkDraw()) {
            alert("Game is a draw!");
            return;
        }

        this.thinkingTime.textContent = this.elapsedTime;
        this.currentPlayer = this.currentPlayer === "red" ? "yellow" : "red";
        this.updatePauseStatus();
        if (
            this.gameMode === "man-vs-computer" &&
            this.currentPlayer === "yellow" &&
            this.isLoadingFromFile == false
        ) {
            this.computerTurn(this.computerDifficulty, this.computerAlgorithm);
        }

        // this.continueWithGameMode();
    }

    findAvailableRow(col) {
        for (let row = this.ROWS - 1; row >= 0; row--) {
            if (!this.board[row][col]) return row;
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
        return this.board.every((row) => row.every((cell) => cell !== null));
    }

    async computerTurn(difficulty, algorithm) {
        await this.waitWhilePaused();
        const startTime = Date.now();

        try {
            const response = await fetch(
                `https://pyvezi-backend.onrender.com/game/computer_move/?mode=${difficulty}&algorithm=${algorithm}`,
                {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify({ board: this.board }),
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
}

// Initialize the game
const game = new ConnectFour();
game.initialize();
