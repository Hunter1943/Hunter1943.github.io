let Step0 = {
    data: {
        title: '初见',
        content: [
            '一开始不知道Leah直播，只是刷到过Leah很多次视频',
            '包括一血无伤',
            '包括一血无伤<del>（的失败集锦）</del>',
            '无敌帧闪避教学',
            '还有每期的深渊教学（为什么不放标志性卖网课？因为这期让我大涨姿势，当时只有妮绽队，打沙虫8分钟缩短到2分钟）'
        ],
        img: [
            'static/img/fengmian.jpg',
            'static/img/yixie.jpg',
            'static/img/fail.jpg',
            'static/img/wudizhen.jpg',
            'static/img/shenyuan.jpg',
        ],
        bubble: [
            ['45%', '0%'],
            ['45%', '0%'],
            ['60%', '60%'],
            ['15%', '0%'],
            ['45%', '0%'],
        ]
    },
    next: false,
    curIndex: 0,
    init: function () {
        document.getElementById('title').innerText = this.data.title;
        document.getElementById('content').innerHTML = this.data.content[0];
        document.getElementById('bubble').style.left = this.data.bubble[0][0];
        document.getElementById('bubble').style.top = this.data.bubble[0][1];
    },
    nextStep: function () {
        console.log(this.data.img);
        this.curIndex++;
        if (this.curIndex === this.data.content.length - 1) {
            this.next = true;
        }
        document.getElementById('content').innerHTML = this.data.content[this.curIndex];
        document.body.classList.toggle('step0-' + this.curIndex);
        document.getElementById('bubble').style.left = this.data.bubble[this.curIndex][0];
        console.log(parseFloat(this.data.bubble[this.curIndex][1]),window.innerHeight);
        document.getElementById('bubble').style.top = (window.innerHeight * parseFloat(this.data.bubble[this.curIndex][1]) / 100) + 'px';
    }
}