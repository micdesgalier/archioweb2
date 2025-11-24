import Matrix2 from './Matrix2.js';
import { moduloEuclidian } from '../utils/math.js';

export default class Automaton {

  constructor({rows, cols, cellSize, aliveProbability = 0.5, aliveColor = 'tomato', deadColor = '#000000', birth = [3], survival = [2, 3]}) {
    this.rows = rows;
    this.cols = cols;
    this.cellSize = cellSize;
    this.aliveColor = aliveColor;
    this.deadColor = deadColor;
    this.aliveProbability = aliveProbability;

    this.birth = new Set(birth);
    this.survival = new Set(survival);

    this.grid = new Matrix2(this.rows, this.cols);
    this.grid.randomizeBool(this.aliveProbability);
  }

  draw(ctx) {
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const x = col * this.cellSize;
        const y = row * this.cellSize;
        const isAlive = this.grid.matrix[row][col] === 1;
        ctx.fillStyle = isAlive ? this.aliveColor : this.deadColor;
        ctx.fillRect(x + 1, y + 1, this.cellSize - 1, this.cellSize - 1);
      }
    }
  }

  getMooreNeighborhoodRowCol(row, col) {
    const neighborsRowCol = [];
    for (let deltaRow = -1; deltaRow <= 1; deltaRow++) {
      for (let deltaCol = -1; deltaCol <= 1; deltaCol++) {
        if (deltaRow === 0 && deltaCol === 0) continue;
        neighborsRowCol.push({
          row: moduloEuclidian(row + deltaRow, this.rows),
          col: moduloEuclidian(col + deltaCol, this.cols)
        });
      }
    }
    return neighborsRowCol;
  }

  isValid(row, col) {
    return this.grid.isValid(row, col);
  }

  isAlive(row, col) {
    return this.grid.matrix[row][col] === 1;
  }

  switchState(row, col) {
    this.grid.matrix[row][col] = this.isAlive(row, col) ? 0 : 1;
  }

  setBirthRule(birth) {
    this.birth = new Set(birth);
  }

  setSurvivalRule(survival) {
    this.survival = new Set(survival);
  }

  setLiveColor(color) {
    this.aliveColor = color;
  }

  applyRule() {
    const toSwitch = [];
    for (let row = 0; row < this.rows; row++) {
      for (let col = 0; col < this.cols; col++) {
        const neighbors = this.getMooreNeighborhoodRowCol(row, col);
        const aliveNeighbors = neighbors.filter(({row, col}) => this.isAlive(row, col)).length;
        const isAlive = this.isAlive(row, col);
        if (isAlive && !this.survival.has(aliveNeighbors)) toSwitch.push({row, col});
        if (!isAlive && this.birth.has(aliveNeighbors)) toSwitch.push({row, col});
      }
    }
    for (const {row, col} of toSwitch) this.switchState(row, col);
  }

}