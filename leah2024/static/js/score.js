function score1(visit, row, col) {
    var score = 0;
    for (var i = 0; i < row; i++) {
        for (var j = 0; j < col; j++) {
            if (visit[i][j]) {
                score++;
            }
        }
    }
    return score;
}

function score2(visit, row, col) {
    var score = 0;
    for (var i = 0; i < row; i++) {
        if (visit[i][0]) score++;
        if (visit[i][col - 1]) score++;
    }
    for (var i = 1; i < col - 1; i++) {
        if (visit[0][i]) score++;
        if (visit[row - 1][i]) score++;
    }
    return score;
}

function score3(visit, row, col) {
    var score = 0;
    var selected = [];
    for (var i = 0; i < row; i++) {
        for (var j = 0; j < col; j++) {
            if (visit[i][j]) {
                selected.push([i, j]);
            }
        }
    }
    for (var i = 0; i < selected.length - 1; i++) {
        for (var j = i + 1; j < selected.length; j++) {
            var dis = Math.abs(selected[i][0] - selected[j][0]) + Math.abs(selected[i][1] - selected[j][1]) - 1;
            if (dis > score) {
                score = dis;
            }
        }
    }
    return score;
}

function score4(visit, row, col) {
    const visit2 = Array.from({ length: row }, () => Array(col).fill(0));
    for (var i = 0; i < row; i++) {
        for (var j = 0; j < col; j++) {
            visit2[i][j] = visit[i][j];
        }
    }
    
    function dfs(visit2, row, col, i, j) {
        visit2[i][j] = 1;
        if (i - 1 >= 0 && visit2[i - 1][j] == 0) dfs(visit2, row, col, i - 1, j);
        if (j - 1 >= 0 && visit2[i][j - 1] == 0) dfs(visit2, row, col, i, j - 1);
        if (i + 1 < row && visit2[i + 1][j] == 0) dfs(visit2, row, col, i + 1, j);
        if (j + 1 < col && visit2[i][j + 1] == 0) dfs(visit2, row, col, i, j + 1);
    }

    var score = 0;
    for (var i = 0; i < row; i++) {
        for (var j = 0; j < col; j++) {
            if (visit2[i][j] == 0) {
                dfs(visit2, row, col, i, j);
                score++;
            }
        }
    }
    return score - 1;
}

function score5(visit, row, col) {
    function check(visit, row, col, x, y) {
        if (visit[x][y] == 0) {
            return 0;
        }
        var maxPossibleSize = Math.min(row - x, col - y);

        function check0(visit, size, x, y) {
            for (var i = 0; i < size; i++) {
                if (visit[x + i][y] == 0 || visit[x + i][y + size - 1] == 0 || visit[x][y + i] == 0 || visit[x + size - 1][y + i] == 0) {
                    return false;
                }
            }
            return true;
        }

        for (var size = maxPossibleSize; size >= 1; size--) {
            if (check0(visit, size, x, y)) {
                return size;
            }
        }
    }

    var score = 0;
    for (var i = 0; i < row; i++) {
        for (var j = 0; j < col; j++) {
            var size = check(visit, row, col, i, j);
            if (size > score) score = size;
        }
    }
    return score;
}

function score6(visit, row, col) {
    const visit2 = Array.from({ length: row }, () => Array(col).fill(0));
    for (var i = 0; i < row; i++) {
        for (var j = 0; j < col; j++) {
            visit2[i][j] = visit[i][j];
        }
    }
    
    function dfs(visit2, row, col, i, j, cnt) {
        visit2[i][j] = 0;
        cnt++;
        if (i - 1 >= 0 && visit2[i - 1][j] == 1) cnt = dfs(visit2, row, col, i - 1, j, cnt);
        if (j - 1 >= 0 && visit2[i][j - 1] == 1) cnt = dfs(visit2, row, col, i, j - 1, cnt);
        if (i + 1 < row && visit2[i + 1][j] == 1) cnt = dfs(visit2, row, col, i + 1, j, cnt);
        if (j + 1 < col && visit2[i][j + 1] == 1) cnt = dfs(visit2, row, col, i, j + 1, cnt);
        return cnt;
    }

    var score = 0;
    for (var i = 0; i < row; i++) {
        for (var j = 0; j < col; j++) {
            if (visit2[i][j] == 1) {
                var cnt = dfs(visit2, row, col, i, j, 0);
                if (cnt > score) score = cnt;
            }
        }
    }
    return score;
}

function score7(visit, row, col) {
    const pattern = [
        [[0, 0, 0, 0],
        [0, 1, 1, 0],
        [0, 1, 1, 0],
        [0, 0, 0, 0]],

        [[0, 0, 0],
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
        [0, 1, 0],
        [0, 0, 0]],

        [[0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 1, 0],
        [-1, -1, 0, 0, 0]],

        [[0, 0, 0, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 1, 0, 0, 0],
        [0, 0, 0, -1, -1]],

        [[0, 0, 0, -1],
        [0, 1, 0, 0],
        [0, 1, 1, 0],
        [0, 0, 1, 0],
        [-1, 0, 0, 0]],

        [[-1, 0, 0, 0],
        [0, 0, 1, 0],
        [0, 1, 1, 0],
        [0, 1, 0, 0],
        [0, 0, 0, -1]],

        [[-1, 0, 0, 0, -1],
        [0, 0, 1, 0, 0],
        [0, 1, 1, 1, 0],
        [0, 0, 0, 0, 0]],
    ];

    function match(visit, row, col, x, y, pattern) {
        for (var i = 0; i < pattern.length; i++) {
            for (var j = 0; j < pattern[0].length; j++){
                if (x + i >= row && pattern[i][j] != -1) {
                    return false;
                }
                if (y + j >= col && pattern[i][j] != -1) {
                    return false;
                }
                if (pattern[i][j] != -1 && visit[x + i][y + j] != pattern[i][j]) {
                    return false;
                }
            }
        }
        return true;
    }

    function rotate(pattern){
        var newPattern = [];
        for(var x = 0; x < pattern[0].length; x++){
            newPattern[x] = [];
            for(var y = pattern.length - 1; y >= 0; y--) {
                newPattern[x].push(pattern[y][x]);
            }
        }
        return newPattern;
    }

    var score = 0;
    var matchedPatterns = [0, 0, 0, 0, 0, 0, 0];
    var visit2 = Array.from({ length: row + 2 }, () => Array(col + 2).fill(0));
    for (var i = 0; i < row; i++) {
        for (var j = 0; j < col; j++) {
            visit2[i + 1][j + 1] = visit[i][j];
        }
    }

    for (var i = 0; i < row + 2; i++) {
        for (var j = 0; j < col + 2; j++) {
            for(var k = 0; k < pattern.length; k++) {
                if (matchedPatterns[k] == 0){
                    if (match(visit2, row + 2, col + 2, i, j, pattern[k])
                    || match(visit2, row + 2, col + 2, i, j, rotate(pattern[k]))
                    || match(visit2, row + 2, col + 2, i, j, rotate(rotate(pattern[k])))
                    || match(visit2, row + 2, col + 2, i, j, rotate(rotate(rotate(pattern[k]))))) {
                        matchedPatterns[k] = 1;
                        score++;
                    }
                }
            }
        }
    }
    return score;
}