
var currentLevel = 1;
var currentScore = 0;
var scoreFunction = score1;
var win = false;

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
        if (currentLevel == 7) {
            setTimeout(() => {
                if (win) return;
                document.getElementById('hint').innerText = '提示：听说本关和至冬有什么额外的联系呢 🤔';
            }, 120 * 1000);
            setTimeout(() => {
                if (win) return;
                document.getElementById('hint').innerText = '提示：至冬的原型是哪里呢 🤔';
            }, 300 * 1000);
            setTimeout(() => {
                if (win) return;
                document.getElementById('hint').innerText = '提示：提到至冬，就想起有个全世界流行的游戏，这个游戏的名字叫... 🤔';
            }, 480 * 1000);
        }
    } else {
        win = true;
        document.getElementById('hint').innerText = '祝Leah莉娅生日快乐！❤️';
        document.getElementById('next_level').innerText = 'YOU WIN!';
        var canvas = document.getElementById('firework_canvas');
        canvas.style.width = '100%';
        canvas.style.height = '100%';
        canvas.width = canvas.offsetWidth;
        canvas.height = canvas.offsetHeight;
        var rect = canvas.getBoundingClientRect();
        var height = 200;
        var width = rect.width * height / rect.height;

        function startFirework() {
            var x = Math.floor(Math.random() * width) + (rect.width - width) / 2;
            var y = Math.floor(Math.random() * height) + (rect.height - height) / 2;
            var nextTime = Math.floor(Math.random() * 1000 + 200);
            var fireworkCount = Math.floor(Math.random() * 20) + 10;
            for (var i = 0; i < fireworkCount; i++) {
                createFirework(x, y);
            }
            setTimeout(() => {
                startFirework();
            }, nextTime);
        }

        setTimeout(() => {
            animate();
            startFirework();
        }, 0);
    }
}

initTable();