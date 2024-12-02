class ConnectFour {
    constructor() {
        this.ROWS = 6;
        this.COLS = 7;
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
        this.pause = false;
        this.thinkingTime = document.querySelector("#thinking-time")
    }
    mode = false;

    initialize() {
        this.showGameModeModal();
        this.restartButton.addEventListener(("click"),()=>{
            this.createBoard()
            
        })
    }

    showGameModeModal() {
        this.gameModeModal.style.display = "block";
    }

    showDifficultyModal(mode) {
        this.difficultyModal.style.display = "block";
        const difficultyForm = document.getElementById("difficulty-form");
        difficultyForm.innerHTML = ""; 

        if (mode === "man-vs-computer") {
            difficultyForm.innerHTML = `
                <h3>Select Difficulty for Computer:</h3>
                <label>
                    <input type="radio" name="difficulty" value="easy" /> Easy
                </label>
                <label>
                    <input type="radio" name="difficulty" value="medium" /> Medium
                </label>
                <label>
                    <input type="radio" name="difficulty" value="expert" /> expert
                </label>
                <button id="start-game">Start Game</button>
            `;
        } else if (mode === "computer-vs-computer") {
            difficultyForm.innerHTML = `
                <h3>Select Difficulty for Computer 1:</h3>
                <label>
                    <input type="radio" name="difficulty1" value="easy" /> Easy
                </label>
                <label>
                    <input type="radio" name="difficulty1" value="medium" /> Medium
                </label>
                <label>
                    <input type="radio" name="difficulty1" value="expert" /> expert
                </label>
                <h3>Select Difficulty for Computer 2:</h3>
                <label>
                    <input type="radio" name="difficulty2" value="easy" /> Easy
                </label>
                <label>
                    <input type="radio" name="difficulty2" value="medium" /> Medium
                </label>
                <label>
                    <input type="radio" name="difficulty2" value="expert" /> expert
                </label>
                <button id="start-game">Start Game</button>
            `;
        }

        document
            .getElementById("start-game")
            .addEventListener("click", () => this.startGameWithDifficulties(mode));
    }

    startGame(selectedMode) {
        if (selectedMode === "man-vs-computer" || selectedMode === "computer-vs-computer") {
            this.showDifficultyModal(selectedMode);
        } else {
            this.gameMode = selectedMode;
            this.startGameSetup();
        }
    }

    startGameWithDifficulties(mode) {
        if (mode === "man-vs-computer") {
            const difficulty = document.querySelector(
                "input[name='difficulty']:checked"
            )?.value;

            if (!difficulty) {
                alert("Please select a difficulty level.");
                return;
            }

            this.gameMode = mode;
            this.computerDifficulty = difficulty;
        } else if (mode === "computer-vs-computer") {
            const difficulty1 = document.querySelector(
                "input[name='difficulty1']:checked"
            )?.value;
            const difficulty2 = document.querySelector(
                "input[name='difficulty2']:checked"
            )?.value;

            if (!difficulty1 || !difficulty2) {
                alert("Please select difficulty levels for both computers.");
                return;
            }
            this.gameMode = mode;
            this.computerVsComputer(difficulty1,difficulty2);
        }

        this.difficultyModal.style.display = "none";
        this.startGameSetup();
    }

    startGameSetup() {
        this.gameModeModal.style.display = "none";
        this.gameBoard.style.display = "grid";
        this.statusDiv.style.display = "block";
        this.restartButton.style.display = "block";
        this.createBoard();

        // if (this.gameMode === "computer-vs-computer") {
        //     this.computerVsComputer(difficulty1,difficulty2);
        // }
    }

    createBoard() {
        this.gameBoard.innerHTML = "";
        this.board = Array.from({ length: this.ROWS }, () =>
            Array(this.COLS).fill(null)
        );

        for (let row = 0; row < this.ROWS; row++) {
            for (let col = 0; col < this.COLS; col++) {
                const cell = document.createElement("div");
                cell.innerText = `${row}-${col}`
                cell.classList.add("cell");
                cell.dataset.row = row;
                cell.dataset.col = col;
                cell.addEventListener("click", (event) =>
                    this.handleClick(event)
                );
                this.gameBoard.appendChild(cell);
            }
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
            this.gameBoard.removeEventListener("click", this.handleClick);
            return;
        }

        if (this.checkDraw()) {
            alert("Game is a draw!");
            return;
        }
        this.thinkingTime.textContent = this.elapsedTime
        this.currentPlayer = this.currentPlayer === "red" ? "yellow" : "red";
        this.statusDisplay.textContent =
            this.currentPlayer.charAt(0).toUpperCase() +
            this.currentPlayer.slice(1);

        if (
            this.gameMode === "man-vs-computer" &&
            this.currentPlayer === "yellow"
        ) {
            this.computerTurn(this.computerDifficulty);
        } 
        // else if (this.gameMode === "computer-vs-computer") {
        //     const difficulty = this.currentPlayer === "red"
        //         ? this.computer1Difficulty
        //         : this.computer2Difficulty;
        //     setTimeout(() => this.computerTurn(difficulty), 500);
        // }
    }

    async computerTurn(difficulty) {
        const response = await fetch(
            `http://127.0.0.1:8000/game/computer_move/?mode=${difficulty}`,
            {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    board: this.board,
                    human_move: null,
                }),
            }
        );

        const data = await response.json();
        this.elapsedTime = data.time
        const col = data.computed_move[1];
        const row = data.computed_move[0];

        if (row !== null) {
            this.makeMove(row, col);
        } else {
            this.computerTurn(difficulty);
        }
    }

    async computerVsComputer(diff1, diff2) {
        const response = await fetch(
            `http://127.0.0.1:8000/game/comp_vs_comp/?mode1=${diff1}&mode2=${diff2}`,
            {
                method: "GET",
                headers: {
                    "Content-Type": "application/json",
                },
            }
        );
    
        const data = await response.json();
        this.currentPlayer = "red";
        for (const move of data.computed_moves) {
            while (this.pause) {
                await new Promise(resolve => setTimeout(resolve, 100)); // Check every 100ms
            }
                if (move[0][0] !== null) {
                    this.elapsedTime = move[1]
                    this.makeMove(move[0][0], move[0][1]);
                    await new Promise(resolve => setTimeout(resolve, 500)); 
                }
            
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

        return directions.some(
            ([dx, dy]) =>
                this.checkDirection(row, col, dx, dy) ||
                this.checkDirection(row, col, -dx, -dy)
        );
    }

    checkDirection(row, col, dx, dy) {
        const player = this.board[row][col];
        let count = 1;

        let r = row + dx;
        let c = col + dy;
        while (
            r >= 0 &&
            r < this.ROWS &&
            c >= 0 &&
            c < this.COLS &&
            this.board[r][c] === player
        ) {
            count++;
            r += dx;
            c += dy;
        }

        r = row - dx;
        c = col - dy;
        while (
            r >= 0 &&
            r < this.ROWS &&
            c >= 0 &&
            c < this.COLS &&
            this.board[r][c] === player
        ) {
            count++;
            r -= dx;
            c -= dy;
        }

        return count >= 4;
    }

    checkDraw() {
        return this.board.every((row) => row.every((cell) => cell !== null));
    }
}

// Initialize the game
const game = new ConnectFour();
game.initialize();
window.addEventListener("keydown",(e)=>{
    if(e.code == "Space"){
        game.pause = !game.pause
    }
})

