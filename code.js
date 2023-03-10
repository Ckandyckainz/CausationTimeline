let homePage = document.getElementById("homepage");
let newCTButton = document.getElementById("newctbutton");
let editPage = document.getElementById("editpage");
editPage.style.display = "none";
let mcanDiv = document.getElementById("mcandiv");
mcanDiv.style.maxWidth = ""+window.innerWidth+"px";
mcanDiv.style.maxHeight = ""+(window.innerHeight*0.9)+"px";
let mcan = document.getElementById("mcan");
let mctx = mcan.getContext("2d");
mcan.width = window.innerWidth*3;
mcan.height = window.innerHeight*2;
let toolbar = document.getElementById("toolbar");
let eventNew = document.getElementById("eventnew");
let modesDiv = document.getElementById("modes");
let modeButtons = modesDiv.children;
let mcw = mcan.width;
let mch = mcan.height;
let eventGUIsDiv = document.getElementById("eventguisdiv");
let editPanel = document.getElementById("editpanel");
editPanel.style.width = window.innerWidth/3+"px";
editPanel.style.height = window.innerHeight/3+"px";
editPanel.style.left = window.innerWidth*2/3+"px";
editPanel.style.top = window.innerHeight*2/3+"px";
editPanelEventInput = document.getElementById("editpaneleventinput");
editPanelTimeInput = document.getElementById("editpaneltimeinput");
editPanelGroupInput = document.getElementById("editpanelgroupinput");
editPanelGroupColorInput = document.getElementById("editpanelgroupcolorinput");
let showTimesButton = document.getElementById("showtimesbutton");
let mousePos;
let selectedMode = {mode: "Move", index: 1};
modeButtons[1].style.background = "gold";
let showingTimes = false;
let arrowPlacing = undefined;
let arrowHovering = undefined;
let eventSelected = undefined;
let events = [];
let arrows = [];
let groups = [];

class Group{
    constructor(name){
        this.name = name;
        this.id = groups.length;
        this.color = "#ffffff";
        this.events =  [];
        groups.push(this);
    }
}
new Group(undefined);
groups[0].events.push({GUI: eventNew});

class Event{
    constructor(x, y){
        this.id = events.length;
        this.text = "event";
        this.x = x;
        this.y = y;
        this.w;
        this.h;
        this.boundsRect;
        this.arrows = [];
        this.group = groups[0];
        groups[0].events.push(this);
        this.time;
        let GUI = document.createElement("p");
        GUI.className = "event";
        GUI.innerText = "event";
        GUI.style.left = ""+x+"px";
        GUI.style.top = ""+y+"px";
        GUI.contentEditable = "false";
        setEventGUIColor(GUI, this.group.color);
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
                if (!this.dragging && this.y > mcanDiv.scrollTop+window.innerHeight*0.9) {
                    this.remove();
                }
            } else if (selectedMode.mode == "Add Arrow") {
                if (arrowPlacing == undefined) {
                    let arrow = new Arrow(this);
                    arrowPlacing = arrow;
                    this.arrows.push(arrow);
                } else {
                    if (arrowPlacing.events[0].id != this.id) {
                        arrowPlacing.events[1] = this;
                        this.arrows.push(arrowPlacing);
                        arrowPlacing = undefined;
                    }
                }
            } else if (selectedMode.mode == "Edit") {
                eventSelected = this;
                editPanelEventInput.value = this.text;
                editPanelGroupInput.value = this.group.name;
                editPanelTimeInput.value = this.time;
                editPanelGroupColorInput.value = this.group.color;
            }
        });
        this.GUI.addEventListener("input", ()=>{
            this.text = this.GUI.innerText;
            editPanelEventInput.value = this.text;
        });
    }
    remove(){
        eventGUIsDiv.removeChild(this.GUI);
        remove(events, this.id);
        removeItem(this.group.events, this, false);
        while (this.arrows.length != 0) {
            this.arrows[0].remove();
        }
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
                if (i > 100) {
                    i = this.line.length;
                }
            }
            if (counter == 20) {
                totalBends = 0;
            }
        }
        let intersection = lineIntersectRect(this.events[0].boundsRect, this.line.slice(0, 4))[0];
        if (intersection != undefined) {
            this.line.splice(0, 2, ...intersection);
        }
        intersection = lineIntersectRect(this.events[1].boundsRect, this.line.slice(this.line.length-4, this.line.length))[0];
        if (intersection != undefined) {
            this.line.splice(this.line.length-2, 2, ...intersection);
        }
        let ll = this.line.slice(this.line.length-4, this.line.length);
        let angle = Math.atan2(ll[1]-ll[3], ll[0]-ll[2]);
        this.line.push(ll[2]+Math.cos(angle+Math.PI/4)*20, ll[3]+Math.sin(angle+Math.PI/4)*20);
        this.line.push(ll[2]+Math.cos(angle-Math.PI/4)*20, ll[3]+Math.sin(angle-Math.PI/4)*20);
    }
    drawSelf(ctx){
        ctx.lineWidth = 4;
        ctx.strokeStyle = this.events[0].group.color;
        if (arrowHovering != undefined) {
            if (arrowHovering.id == this.id) {
                ctx.lineWidth = 8;
            }
        }
        ctx.beginPath();
        ctx.moveTo(this.line[0], this.line[1]);
        for (let i=2; i<this.line.length-4; i+=2) {
            ctx.lineTo(this.line[i], this.line[i+1]);
        }
        ctx.moveTo(this.line[this.line.length-4], this.line[this.line.length-3]);
        ctx.lineTo(this.line[this.line.length-6], this.line[this.line.length-5]);
        ctx.lineTo(this.line[this.line.length-2], this.line[this.line.length-1]);
        ctx.stroke();
    }
    remove(){
        remove(arrows, this.id);
        this.events.forEach((evnt)=>{
            let index = 0;
            while (evnt.arrows[index].id != this.id) {
                index ++;
            }
            evnt.arrows.splice(index, 1);
        });
    }
}

newCTButton.addEventListener("click", ()=>{
    homePage.style.display = "none";
    editPage.style.display = "block";
    drawingLoop();
});

eventNew.addEventListener("click", (event)=>{
    if (selectedMode.mode == "Move") {
        let rect = eventNew.getBoundingClientRect();
        let evnt = new Event(rect.x+mcanDiv.scrollLeft, rect.y+mcanDiv.scrollTop);
        evnt.clickPos = {x: event.offsetX, y: event.offsetY};
    }
});

document.addEventListener("mousemove", (event)=>{
    mousePos = {x: event.clientX+mcanDiv.scrollLeft, y: event.clientY+mcanDiv.scrollTop, w: 0, h: 0, boundsRect: 0};
    mousePos.boundsRect = {x: mousePos.x-10, y: mousePos.y-10, w: mousePos.w+20, h: mousePos.h+20};
    events.forEach((evnt)=>{
        if (evnt.dragging) {
            evnt.x = event.x-evnt.clickPos.x-3.5+mcanDiv.scrollLeft;
            evnt.y = event.y-evnt.clickPos.y-3.5+mcanDiv.scrollTop;
            evnt.GUI.style.left = (evnt.x-mcanDiv.scrollLeft)+"px";
            evnt.GUI.style.top = (evnt.y-mcanDiv.scrollTop)+"px";
        }
    });
    if (selectedMode.mode == "Remove Arrow") {
        arrows.forEach((arrow)=>{
            let hovering = false;
            for (let i=0; i<arrow.line.length-2; i+=2) {
                let minmax = [];
                for (let j=0; j<2; j++) {
                    if (arrow.line[i+j] < arrow.line[i+j+2]) {
                        minmax[0+j*2] = arrow.line[i+j]-7;
                        minmax[1+j*2] = arrow.line[i+j+2]+7;
                    } else {
                        minmax[0+j*2] = arrow.line[i+j+2]-7;
                        minmax[1+j*2] = arrow.line[i+j]+7;
                    }
                }
                if (event.x > minmax[0] && event.x < minmax[1] && event.y > minmax[2] && event.y < minmax[3]) {
                    let func = linePointsToFunc(arrow.line.slice(i, i+4));
                    let y = func.m*event.x+func.b;
                    if (event.y > y-7 && event.y < y+7) {
                        hovering = true;
                    }
                }
            }
            if (hovering) {
                arrowHovering = arrow;
            } else if (arrowHovering != undefined) {
                if (arrowHovering.id == arrow.id) {
                    arrowHovering = undefined;
                }
            }
        });
    }
});

mcan.addEventListener("click", (event)=>{
    if (selectedMode.mode == "Remove Arrow" && arrowHovering != undefined) {
        arrowHovering.remove();
    }
});

mcanDiv.addEventListener("scroll", ()=>{
    events.forEach((evnt)=>{
        evnt.GUI.style.left = (evnt.x-mcanDiv.scrollLeft)+"px";
        evnt.GUI.style.top = (evnt.y-mcanDiv.scrollTop)+"px";
        if (!evnt.dragging && evnt.y > mcanDiv.scrollTop+window.innerHeight*0.9-evnt.w/2) {
            evnt.GUI.style.display = "none";
        } else {
            evnt.GUI.style.display = "block";
        }
    });
})

showTimesButton.addEventListener("click", ()=>{
    if (selectedMode.mode != "Edit") {
        showingTimes = !showingTimes;
        if (showingTimes) {
            showTimesButton.style.background = "gold";
            events.forEach((evnt)=>{
                if (evnt.time != undefined) {
                    evnt.GUI.innerText = evnt.text+" ("+evnt.time+")";
                }
            });
        } else {
            showTimesButton.style.background = "white";
            events.forEach((evnt)=>{
                evnt.GUI.innerText = evnt.text;
            });
        }
    }
});


function eventsEditable(canEdit){
    if (canEdit) {
        editPanelEventInput.value = "";
        editPanelGroupInput.value = "";
        editPanelTimeInput.value = "";
        editPanelGroupColorInput.value = "#ffffff";
        editPanel.style.display = "block";
        events.forEach((evnt)=>{
            evnt.GUI.contentEditable = "true";
            evnt.GUI.style.resize = "both";
            evnt.GUI.innerText = evnt.text;
        });
    } else {
        editPanel.style.display = "none";
        events.forEach((evnt)=>{
            evnt.GUI.contentEditable = "false";
            evnt.GUI.style.resize = "none";
            if (showingTimes && evnt.time != undefined) {
                evnt.GUI.innerText = evnt.text+" ("+evnt.time+")";
            }
        });
    }
}
function setMode(i){
    modeButtons[selectedMode.index].style.background = "white";
    modeButtons[i].style.background = "gold";
    selectedMode = {mode: modeButtons[i].innerText, index: i};
    eventsEditable(selectedMode.mode == "Edit");
    if (selectedMode.mode != "Remove Arrow") {
        arrowHovering = undefined;
    }
}
for (let i=1; i<modeButtons.length-1; i++) {
    modeButtons[i].addEventListener("click", ()=>{
        setMode(i);
    });
}
document.addEventListener("keypress", (event)=>{
    let m = Number(event.key);
    if (m != NaN && m != 0 && m < modeButtons.length && selectedMode.mode != "Edit") {
        setMode(m);
    }
});


editPanelEventInput.addEventListener("input", ()=>{
    if (eventSelected != undefined) {
        eventSelected.text = editPanelEventInput.value;
        eventSelected.GUI.innerText = eventSelected.text;
    }
});
editPanelTimeInput.addEventListener("input", ()=>{
    eventSelected.time = editPanelTimeInput.value;
});
editPanelGroupInput.addEventListener("change", ()=>{
    let group;
    for (let i=0; i<groups.length; i++) {
        if (groups[i].name == editPanelGroupInput.value) {
            group = groups[i];
        }
    }
    if (group == undefined) {
        group = new Group(editPanelGroupInput.value);
    }
    removeItem(eventSelected.group.events, eventSelected, false);
    eventSelected.group = group;
    group.events.push(eventSelected);
    editPanelGroupColorInput.value = group.color;
    setEventGUIColor(eventSelected.GUI, group.color);
});
editPanelGroupColorInput.addEventListener("input", ()=>{
    eventSelected.group.color = editPanelGroupColorInput.value;
    eventSelected.group.events.forEach((evnt)=>{
        setEventGUIColor(evnt.GUI, eventSelected.group.color);
    });
});
function setEventGUIColor(GUI, color){
    GUI.style.color = color;
    GUI.style.borderColor = color;
    let dc = "#";
    for (let i=1; i<7; i+=2) {
        dc += Math.floor(parseInt(color.substring(i, i+2), 16)/4).toString(16).padStart(2, "0");
    }
    GUI.style.background = dc;
}


function remove(array, index){
    array.splice(index, 1)
    for (let i=index; i<array.length; i++) {
        array[i].id = i;
    }
}
function findIndex(array, item){
    for (let i=0; i<array.length; i++) {
        if (array[i].id == item.id) {
            return i;
        }
    }
}
function removeItem(array, item, resetIds){
    let index = findIndex(array, item);
    if (index != undefined) {
        if (resetIds) {
            remove(array, index);
        } else {
            array.splice(index, 1);
        }
    }
}


function eventIntersections(line){
    let bends = [];
    events.forEach((evnt)=>{
        let r = evnt.boundsRect;
        let bend = lineBendsRect(r, line);
        if (bend.length == 2) {
            bends.push(bend);
        }
    });
    return bends;
}
function lineBendsRect(r, line){
    let bend = [];
    let intersections = lineIntersectRect(r, line);
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
        bend = [mcw*1000];
        for (let i=0; i<4; i++) {
            if (distances[i][0] < bend[0]) {
                let dist = distances[i].slice(1, 3);
                if (!arraysEqual(dist, line.slice(0, 2)) && !arraysEqual(dist, line.slice(2, 4))) {
                    bend = distances[i];
                }
            }
        }
        bend.shift();
    }
    return bend;
}
function lineIntersectRect(r, line){
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
    return intersections;
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
function arraysEqual(a1, a2){
    equal = a1.length == a2.length;
    if (equal) {
        for (let i=0; i<a1.length; i++) {
            if (a1[i] != a2[i]) {
                equal = false;
            }
        }
    }
    return equal;
}


function drawingLoop(){
    mctx.fillStyle = "#000000";
    mctx.fillRect(0, 0, mcw, mch);
    events.forEach((evnt)=>{
        let rect = evnt.GUI.getBoundingClientRect();
        evnt.w = rect.width;
        evnt.h = rect.height;
        evnt.boundsRect = {x: evnt.x-10, y: evnt.y-10, w: evnt.w+20, h: evnt.h+20};
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