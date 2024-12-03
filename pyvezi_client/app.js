class ConnectFour {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
        this.MIN_MOVE_TIME = 1000; // Minimum time in ms for computer moves
        this.board = [];
        this.currentPlayer = "red";
        this.elapsedTime = 0;
        this.gameMode = "";
        this.gameBoard = document.getElementById("game-board");
        this.statusDisplay = document.getElementById("current-player");
        this.gameModeModal = document.getElementById("game-mode-modal");
        this.restartButton = document.getElementById("restart-btn");
        this.statusDiv = document.getElementById("status");
        this.difficultyModal = document.getElementById("difficulty-modal");
        this.thinkingTime = document.querySelector("#thinking-time");
        this.choosenDif1 = "";
        this.choosenDif2 = "";
        this.choosenAlg1 = "";
        this.choosenAlg2 = "";
        this._isPaused = false;
        
        this.initializePauseHandler();
    }

    initializePauseHandler() {
        window.addEventListener("keydown", (e) => {
            if (e.code === "Space") {
                this._isPaused = !this._isPaused;
                this.updatePauseStatus();
            }
        });
    }

    updatePauseStatus() {
        const pauseStatus = this._isPaused ? "PAUSED" : "PLAYING";
        this.statusDisplay.textContent = `${this.currentPlayer.toUpperCase()} - ${pauseStatus}`;
    }

    async sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
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

    initialize() {
        this.showGameModeModal();
        this.restartButton.addEventListener("click", () => {
            this.createBoard();
        });
    }

    showGameModeModal() {
        this.gameModeModal.style.display = "flex";
    }
    showDifficultyModal(mode) {
        this.difficultyModal.style.display = "flex";
        const difficultyForm = document.getElementById("difficulty-form");
        difficultyForm.innerHTML = "";
        if (mode === "man-vs-computer") {
            difficultyForm.innerHTML = `
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
        } else if (mode === "computer-vs-computer") {
            difficultyForm.innerHTML = `
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
                </select></div>
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

        document
            .getElementById("start-game")
            .addEventListener("click", () => this.startGameWithDifficulties(mode));
    }

    startGameWithDifficulties(mode) {
        if (mode === "man-vs-computer") {
            const difficulty = document.querySelector("#difficulty-select").value;

            if (!difficulty) {
                alert("Please select a difficulty level.");
                return;
            }
            this.computerDifficulty = difficulty;
            this.computerAlgorithm = document.querySelector("#algorithm-select").value || "negscout";
        } else if (mode === "computer-vs-computer") {
            const difficulty1 = document.querySelector("#difficulty-select-1").value;
            const difficulty2 = document.querySelector("#difficulty-select-2").value;

            if (!difficulty1 || !difficulty2) {
                alert("Please select difficulty levels for both computers.");
                return;
            }
            this.choosenAlg1 = document.querySelector("#algorithm-select-1").value || "negscout";
            this.choosenAlg2 = document.querySelector("#algorithm-select-2").value || "negscout";
            this.choosenDif1 = difficulty1;
            this.choosenDif2 = difficulty2;
        }

        this.difficultyModal.style.display = "none";
        this.startGameSetup();
    }
    startGame(selectedMode) {
        this.gameMode = selectedMode;
        if (selectedMode === "man-vs-computer" || selectedMode === "computer-vs-computer") {
            this.showDifficultyModal(selectedMode);
        } else {
            this.gameMode = selectedMode;
            this.startGameSetup();
        }
    }

    

    startGameSetup() {
        this.gameModeModal.style.display = "none";
        this.gameBoard.style.display = "grid";
        this.statusDiv.style.display = "block";
        this.restartButton.style.display = "block";
        this.createBoard();
    }

    createBoard() {
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
                cell.addEventListener("click", (event) =>
                    this.handleClick(event)
                );
                this.gameBoard.appendChild(cell);
            }
        }

        if (this.gameMode == "computer-vs-computer") {
            this.computerTurn(this.choosenDif1, this.choosenAlg1);
        }
    }

    handleClick(event) {
        if (
            this.gameMode === "computer-vs-computer" ||
            (this.gameMode === "man-vs-computer" &&
                this.currentPlayer === "yellow")
        )
            return;

        const col = parseInt(event.target.dataset.col);
        const row = this.findAvailableRow(col);
        if (row === null) return;

        this.makeMove(row, col);
    }

    async computerTurn(difficulty, algorithm) {
        // Wait if game is paused
        await this.waitWhilePaused();
        
        const startTime = Date.now();
        
        const response = await fetch(
            `http://127.0.0.1:8000/game/computer_move/?mode=${difficulty}&algorithm=${algorithm}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    board: this.board,
                }),
            }
        );

        const data = await response.json();
        
        this.elapsedTime = await this.ensureMinimumDelay(startTime);
        
        await this.waitWhilePaused();

        const [row, col] = data.computed_move;
        if (row !== null) {
            this.makeMove(row, col);
        }
    }

    makeMove(row, col) {
        this.board[row][col] = this.currentPlayer;
        const cell = document.querySelector(
            `.cell[data-row='${row}'][data-col='${col}']`
        );
        cell.classList.add(this.currentPlayer);

        if (this.checkWin(row, col)) {
            alert(
                `${this.currentPlayer.charAt(0).toUpperCase() +
                    this.currentPlayer.slice(1)} wins!`
            );
            return;
        }

        if (this.checkDraw()) {
            alert("Game is a draw!");
            return;
        }

        this.thinkingTime.textContent = this.elapsedTime;
        this.currentPlayer = this.currentPlayer === "red" ? "yellow" : "red";

        let playerDifficulty = this.currentPlayer == "red" ? this.choosenDif1 : this.choosenDif2;
        let playerAlgorithm = this.currentPlayer == "red" ? this.choosenAlg1 : this.choosenAlg2;

        this.updatePauseStatus();

        if (
            this.gameMode === "man-vs-computer" &&
            this.currentPlayer === "yellow"
        ) {
            this.computerTurn(this.computerDifficulty, this.computerAlgorithm);
        } else if (this.gameMode == "computer-vs-computer") {
            this.computerTurn(playerDifficulty, playerAlgorithm);
        }
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

        for (let step = 1; step <= 3; step++) {
            const r = row + dx * step;
            const c = col + dy * step;
            if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) break;
            if (this.board[r][c] === player) count++;
            else break;
        }

        for (let step = 1; step <= 3; step++) {
            const r = row - dx * step;
            const c = col - dy * step;
            if (r < 0 || r >= this.ROWS || c < 0 || c >= this.COLS) break;
            if (this.board[r][c] === player) count++;
            else break;
        }

        return count >= 4;
    }

    checkDraw() {
        return this.board.every((row) => row.every((cell) => cell !== null));
    }
}

const game = new ConnectFour();
game.initialize();




   // async computerVsComputer(diff1, diff2) {
    //     const algorithm1 = document.querySelector("#algorithm-select-1")?.value || "negscout";
    //     const algorithm2 = document.querySelector("#algorithm-select-2")?.value || "negscout";
    
    //     const response = await fetch(
    //         `http://127.0.0.1:8000/game/comp_vs_comp/?mode1=${diff1}&algorithm1=${algorithm1}&mode2=${diff2}&algorithm2=${algorithm2}`,
    //         {
    //             method: "GET",
    //             headers: {
    //                 "Content-Type": "application/json",
    //             },
    //         }
    //     );
    
    //     const data = await response.json();
    //     this.currentPlayer = "red";
    //     for (const move of data.computed_moves) {
    //         if (move[0] !== null) {
    //             this.elapsedTime = move[1];
    //             this.makeMove(move[0][0], move[0][1]);
    //             await new Promise((resolve) => setTimeout(resolve, 500));
    //         }
    //     }
    // }
    