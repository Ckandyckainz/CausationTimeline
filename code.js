let homePage = document.getElementById("homepage");
let newCTButton = document.getElementById("newctbutton");
let editPage = document.getElementById("editpage");
editPage.style.display = "none";
let mcan = document.getElementById("mcan");
let mctx = mcan.getContext("2d");
mcan.width = window.innerWidth;
mcan.height = window.innerHeight;
let toolbar = document.getElementById("toolbar");
let eventNew = document.getElementById("eventnew");
let modesDiv = document.getElementById("modes");
let modeButtons = modesDiv.children;
let mcw = mcan.width;
let mch = mcan.height;
let eventGUIsDiv = document.getElementById("eventguisdiv");
let mousePos = {x: 0, y: 0, w: 0, h: 0};
let selectedMode = {mode: "Move", index: 1};
modeButtons[1].style.background = "gold";
let arrowPlacing = undefined;
let events = [];
let arrows = [];

class Event{
    constructor(x, y){
        this.id = events.length;
        this.x = x;
        this.y = y;
        this.w;
        this.h;
        this.arrows = [];
        let GUI = document.createElement("p");
        GUI.className = "event";
        GUI.innerText = "event";
        GUI.style.left = ""+x+"px";
        GUI.style.top = ""+y+"px";
        GUI.contentEditable = "false";
        eventGUIsDiv.appendChild(GUI);
        this.GUI = GUI;
        this.dragging = true;
        this.clickPos = {x: 0, y: 0};
        eventGUIsDiv.appendChild(GUI);
        events.push(this);
        this.GUI.addEventListener("click", (event)=>{
            if (selectedMode.mode == "Move") {
                this.clickPos = {x: event.offsetX, y: event.offsetY};
                this.dragging = !this.dragging;
                if (!this.dragging && this.y > mch*0.9) {
                    eventGUIsDiv.removeChild(this.GUI);
                    events.splice(this.id, 1);
                }
            }
            if (selectedMode.mode == "Add Arrow") {
                if (arrowPlacing == undefined) {
                    let arrow = new Arrow(this);
                    arrowPlacing = arrow;
                    this.arrows.push(arrow);
                } else {
                    if (arrowPlacing.events[0].id != this.id) {
                        arrowPlacing.events[1] = this;
                        arrowPlacing = undefined;
                    }
                }
            }
        });
    }
}

class Arrow{
    constructor(evnt){
        this.id = arrows.length;
        this.events = [evnt, mousePos];
        this.line = [];
        arrows.push(this);
    }
    updateLine(){
        this.line = [this.events[0].x+this.events[0].w/2, this.events[0].y+this.events[0].h/2, this.events[1].x+this.events[1].w/2, this.events[1].y+this.events[1].h/2];
        let totalBends = 1;
        let counter = 0;
        while (totalBends != 0) {
            counter ++;
            totalBends = 0;
            for (let i=0; i<this.line.length-2; i+=2) {
                let bends = eventIntersections(this.line.slice(i, i+4));
                totalBends += bends.length;
                if (bends.length > 0) {
                    this.line.splice(i+2, 0, ...bends[0]);
                }
            }
            if (counter == 20) {
                totalBends = 0;
            }
        }
    }
    drawSelf(ctx){
        ctx.lineWidth = 5;
        ctx.strokeStyle = "#ffffff";
        ctx.beginPath();
        ctx.moveTo(this.line[0], this.line[1]);
        for (let i=2; i<this.line.length; i+=2) {
            ctx.lineTo(this.line[i], this.line[i+1]);
        }
        ctx.stroke();
    }
}

function newCTButtonClicked(){
    homePage.style.display = "none";
    editPage.style.display = "block";
    drawingLoop();
}
newCTButton.addEventListener("click", newCTButtonClicked);

eventNew.addEventListener("click", (event)=>{
    if (selectedMode.mode == "Move") {
        let rect = eventNew.getBoundingClientRect();
        let evnt = new Event(rect.x, rect.y);
        evnt.clickPos = {x: event.offsetX, y: event.offsetY};
    }
});

document.addEventListener("mousemove", (event)=>{
    mousePos = {x: event.clientX, y: event.clientY, w: 0, h: 0};
    events.forEach((evnt)=>{
        if (evnt.dragging) {
            evnt.x = event.x-evnt.clickPos.x-3.5;
            evnt.y = event.y-evnt.clickPos.y-3.5;
            evnt.GUI.style.left = ""+evnt.x+"px";
            evnt.GUI.style.top = ""+evnt.y+"px";
        }
    });
});

function eventsEditable(canEdit){
    if (canEdit) {
        events.forEach((evnt)=>{
            evnt.GUI.contentEditable = "true";
            evnt.GUI.style.resize = "both";
        });
    } else {
        events.forEach((evnt)=>{
            evnt.GUI.contentEditable = "false";
            evnt.GUI.style.resize = "none";
        });
    }
}

for (let i=1; i<modeButtons.length; i++) {
    modeButtons[i].addEventListener("click", ()=>{
        modeButtons[selectedMode.index].style.background = "white";
        modeButtons[i].style.background = "gold";
        selectedMode = {mode: modeButtons[i].innerText, index: i};
        eventsEditable(selectedMode.mode == "Edit");
    });
}

function eventIntersections(line){
    let bends = [];
    events.forEach((evnt)=>{
        let rect = evnt.GUI.getBoundingClientRect();
        let r = {x: evnt.x-10, y: evnt.y-10, w: rect.width+20, h: rect.height+20};
        let bend = lineIntersectRect(r, line);
        if (bend.length == 2) {
            bends.push(bend);
        }
    });
    return bends;
}

function lineIntersectRect(r, line){
    let bend = [];
    let intersections = [];
    let intersection = lineIntersectXYLine(line, [r.x, r.y, r.x, r.y+r.h]);
    if (intersection.length == 2) {
        intersections.push(intersection);
    }
    intersection = lineIntersectXYLine(line, [r.x+r.w, r.y, r.x+r.w, r.y+r.h]);
    if (intersection.length == 2) {
        intersections.push(intersection);
    }
    intersection = lineIntersectXYLine(line, [r.x, r.y, r.x+r.w, r.y]);
    if (intersection.length == 2) {
        intersections.push(intersection);
    }
    intersection = lineIntersectXYLine(line, [r.x, r.y+r.h, r.x+r.w, r.y+r.h]);
    if (intersection.length == 2) {
        intersections.push(intersection);
    }
    if (intersections.length >= 2) {
        let midint = [0, 0];
        for (let i=0; i<intersections.length; i++) {
            midint[0] += intersections[i][0]/intersections.length;
            midint[1] += intersections[i][1]/intersections.length;
        }
        let distances = [];
        distances.push([(midint[0]-r.x)**2 + (midint[1]-r.y)**2, r.x-1, r.y-1]);
        distances.push([(midint[0]-(r.x+r.w))**2 + (midint[1]-r.y)**2, r.x+r.w+1, r.y-1]);
        distances.push([(midint[0]-r.x)**2 + (midint[1]-(r.y+r.h))**2, r.x-1, r.y+r.h+1]);
        distances.push([(midint[0]-(r.x+r.w))**2 + (midint[1]-(r.y+r.h))**2, r.x+r.w+1, r.y+r.h+1]);
        bend = distances[0];
        for (let i=1; i<4; i++) {
            if (distances[i][0] < bend[0]) {
                bend = distances[i];
            }
        }
        bend.shift();
    }
    return bend;
}

function lineIntersectXYLine(line1, line2){
    let func = linePointsToFunc(line1);
    let x = (line2[0] == line2[2]);
    let intersection = [];
    if (x) {
        if (xor(line1[0] > line2[0], line1[2] > line2[0])) {
            let y = func.m*line2[0]+func.b;
            if (xor(y > line2[1], y > line2[3])) {
                intersection = [line2[0], y];
            }
        }
    } else {
        intersection = pinv(lineIntersectXYLine(pinv(line1), pinv(line2)));
    }
    return intersection;
}

function linePointsToFunc(line){
    let m = (line[3]-line[1])/(line[2]-line[0]);
    return {m: m, b: line[1]-(m*line[0])};
}

function pinv(points){
    let inv = points.slice();
    for (let i=0; i<inv.length; i+=2) {
        let temp = inv[i];
        inv[i] = inv[i+1];
        inv[i+1] = temp;
    }
    return inv;
}

function xor(b1, b2){
    return (b1 || b2) && !(b1 && b2);
}

function drawingLoop(){
    mctx.fillStyle = "#000000";
    mctx.fillRect(0, 0, mcw, mch);
    events.forEach((evnt)=>{
        let rect = evnt.GUI.getBoundingClientRect();
        evnt.w = rect.width;
        evnt.h = rect.height;
    });
    if (arrowPlacing != undefined) {
        arrowPlacing.events[1] = mousePos;
    }
    arrows.forEach((arrow)=>{
        arrow.updateLine();
        arrow.drawSelf(mctx);
    });
    requestAnimationFrame(drawingLoop);
}