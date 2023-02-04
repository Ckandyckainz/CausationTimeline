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
let mousePos = {x: 0, y: 0};
let selectedMode = {mode: "Move", index: 1};
modeButtons[1].style.background = "gold";

class Event{
    constructor(x, y){
        this.x = x;
        this.y = y;
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
            }
        });
    }
}
let events = [];

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
    events.forEach((evnt)=>{
        if (evnt.dragging) {
            evnt.GUI.style.left = ""+(event.x-evnt.clickPos.x-3.5)+"px";
            evnt.GUI.style.top = ""+(event.y-evnt.clickPos.y-3.5)+"px";
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

function drawingLoop(){

    requestAnimationFrame(drawingLoop);
}