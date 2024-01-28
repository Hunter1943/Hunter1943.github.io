
var currentLevel = 1;
var currentScore = 0;
var scoreFunction = score1;

const levelNames = [ '蒙德', '璃月', '稻妻', '须弥', '枫丹', '纳塔', '至冬' ];
const levelColors = [ '#00cc99', '#996600', '#9933cc', '#66ff33', '#0033ff', '#ff3333', '#99ccff' ];
const scoreFunctions = [ score1, score2, score3, score4, score5, score6, score7 ];
const col = 18;
const row = 15;
const visit = Array.from({ length: row }, () => Array(col).fill(0));

function initTable() {
    var content = '<tbody>\n';
    for (var i = 0; i < row; i++) {
        content += '<tr>\n';
        for (var j = 0; j < col; j++) {
            var tdId = i * col + j;
            content += '<td id="grid' + tdId + '" onclick="inverseTd(' + i + ', ' + j + ')"</td>\n';
        }
        content += '</tr>\n';
    }
    content += '</tbody>\n';
    document.getElementById('grid').innerHTML = content;
}

function updateScore() {
    currentScore = scoreFunction(visit, row, col);
    document.getElementById('score_num').innerText = currentScore.toString();
    document.getElementById('next_level').style.visibility = currentScore == 7 ? 'visible' : 'hidden';
}

function inverseTd(i, j) {
    visit[i][j] = 1 - visit[i][j];
    var td = document.getElementById('grid' + (i * col + j));
    td.style.backgroundColor = visit[i][j] ? '#1a1a1a' : 'lightgray';
    updateScore();
}

function nextLevel() {
    currentLevel++;
    if (currentLevel <= 7) {
        document.getElementById('level_num').innerText = levelNames[currentLevel - 1];
        document.getElementById('level_num').style.color = levelColors[currentLevel - 1];
        scoreFunction = scoreFunctions[currentLevel - 1];
        updateScore();
    } else {
        document.getElementById('next_level').innerText = 'YOU WIN!';
        document.getElementById('next_level').onclick = function() {

        }
    }
}

initTable();