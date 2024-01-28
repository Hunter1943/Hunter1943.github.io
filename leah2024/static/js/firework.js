var canvas = document.getElementById('firework_canvas');
var ctx = canvas.getContext('2d');
var fireworks = [];

function Firework(x, y) {
    this.x = x;
    this.y = y;
    this.radius = Math.random() * 4 + 2;
    this.speed = Math.random() * 5 + 1;
    this.angle = Math.random() * Math.PI * 2;
    this.color = getRandomColor();

    this.update = function() {
        this.x += Math.cos(this.angle) * this.speed;
        this.y += Math.sin(this.angle) * this.speed;
        this.speed *= 0.99;
        this.radius *= 0.99;
    }

    this.draw = function() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = this.color;
        ctx.fill();
    }
}

function getRandomColor() {
    var letters = '0123456789ABCDEF';
    var color = '#';
    for (var i = 0; i < 6; i++) {
        color += letters[Math.floor(Math.random() * 16)];
    }
    return color;
}

function createFirework(x, y) {
    var firework = new Firework(x, y);
    fireworks.push(firework);
}

function updateFireworks() {
    for (var i = fireworks.length - 1; i >= 0; i--) {
        fireworks[i].update();
        if (fireworks[i].radius < 0.1) {
            fireworks.splice(i, 1);
        }
    }
}

function drawFireworks() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    for (var i = 0; i < fireworks.length; i++) {
        fireworks[i].draw();
    }
}

function animate() {
    requestAnimationFrame(animate);
    updateFireworks();
    drawFireworks();
}

// canvas.addEventListener('click', function(event) {
//     var rect = canvas.getBoundingClientRect();
//     var x = event.clientX - rect.left;
//     var y = event.clientY - rect.top;
//     for (var i = 0; i < 30; i++) {
//         createFirework(x, y);
//     }
// });

// animate();