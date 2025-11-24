export default class Matrix2 {

  constructor(rows, cols) {
    this.matrix = new Array(rows);
    for (let row = 0; row < rows; row++) {
      this.matrix[row] = new Array(cols);
    }
  }

  randomizeBool(prob) {
    for (let row = 0; row < this.matrix.length; row++) {
      for (let col = 0; col < this.matrix[row].length; col++) {
        this.matrix[row][col] = Math.random() < prob ? 1 : 0;
      }
    }
  }

  isValid(row, col) {
    return row >= 0 && row < this.matrix.length && col >= 0 && col < this.matrix[row].length;
  }

}