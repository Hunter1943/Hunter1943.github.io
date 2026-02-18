let curIndex = 0;
let steps = [ Step0 ];

function nextStep() {
    if (steps[curIndex].next) {
        curIndex++;
        steps[curIndex].init();
    } else {
        steps[curIndex].nextStep();
        if (curIndex === steps.length - 1 && steps[curIndex].next) {
            document.getElementById('next').style.display = 'none';
            return;
        }
    }
}

steps[curIndex].init();