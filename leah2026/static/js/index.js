let curIndex = 0;
let steps = [ Step0, Step1, Step2 ];

function nextStep() {
    if (steps[curIndex].next) {
        curIndex++;
        steps[curIndex].init();
    } else {
        steps[curIndex].nextStep();
        if (curIndex === steps.length - 1 && steps[curIndex].next) {
            document.getElementById('next').style.display = 'none';
        }
    }
    updateNavButtons();
}

function prevStep() {
    if (steps[curIndex].curIndex > 0) {
        steps[curIndex].prevStep();
    } else if (curIndex > 0) {
        curIndex--;
        steps[curIndex].restoreLast();
    }
    updateNavButtons();
}

function updateNavButtons() {
    document.getElementById('prev').style.display =
        (curIndex === 0 && steps[curIndex].curIndex === 0) ? 'none' : '';
    document.getElementById('next').style.display =
        (curIndex === steps.length - 1 && steps[curIndex].next) ? 'none' : '';
}

steps[curIndex].init();
