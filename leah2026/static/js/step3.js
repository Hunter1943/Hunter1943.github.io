let Step3 = {
    data: {
        title: '启程',
        content: [
            '看着莉霸天在各种游戏里乱杀，以为这样的日子会一直持续下去。',
            '知道你做了创业的决定，心里有些意外，又觉得在情理之中——那么认真、那么闪耀的你，一定有自己更多想做的事。',
            '创业的路有辛苦和未知。但我见过你身体不适、心理高压还坚持开播的日子，也见过你凹了上百次痛苦号不肯放弃的样子——你不是那种容易打倒的人。',
            '希望新的旅程一切顺利，也别忘了好好休息。',
            '生日快乐，莉娅。新的一年，愿你所有的勇敢，都有回响。',
        ],
        bubble: [
            ['45%', '0%'],
            ['45%', '0%'],
            ['45%', '0%'],
            ['45%', '0%'],
            ['45%', '0%'],
        ]
    },
    next: false,
    curIndex: 0,
    init: function () {
        document.body.classList.remove('step2');
        for (let i = 1; i <= 8; i++) document.body.classList.remove('step2-' + i);
        document.body.classList.add('step3');
        document.getElementById('title').innerText = this.data.title;
        document.getElementById('content').innerHTML = this.data.content[0];
        document.getElementById('bubble').style.left = this.data.bubble[0][0];
        document.getElementById('bubble').style.top = this.data.bubble[0][1];
    },
    nextStep: function () {
        this.curIndex++;
        if (this.curIndex === this.data.content.length - 1) {
            this.next = true;
        }
        document.getElementById('content').innerHTML = this.data.content[this.curIndex];
        document.getElementById('bubble').style.left = this.data.bubble[this.curIndex][0];
        document.getElementById('bubble').style.top = (window.innerHeight * parseFloat(this.data.bubble[this.curIndex][1]) / 100) + 'px';
    },
    prevStep: function () {
        this.curIndex--;
        this.next = false;
        document.getElementById('content').innerHTML = this.data.content[this.curIndex];
        document.getElementById('bubble').style.left = this.data.bubble[this.curIndex][0];
        document.getElementById('bubble').style.top = (window.innerHeight * parseFloat(this.data.bubble[this.curIndex][1]) / 100) + 'px';
    },
    restoreLast: function () {
        document.body.classList.add('step3');
        this.curIndex = this.data.content.length - 1;
        this.next = true;
        document.getElementById('title').innerText = this.data.title;
        document.getElementById('content').innerHTML = this.data.content[this.curIndex];
        document.getElementById('bubble').style.left = this.data.bubble[this.curIndex][0];
        document.getElementById('bubble').style.top = (window.innerHeight * parseFloat(this.data.bubble[this.curIndex][1]) / 100) + 'px';
    }
}
