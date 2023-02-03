let homePage = document.getElementById("homepage");
let newCTButton = document.getElementById("newctbutton");
let editPage = document.getElementById("editpage");
editPage.style.display = "none";
let mcan = document.getElementById("mcan");
let mctx = mcan.getContext("2d");
mcan.width = window.innerWidth;
mcan.height = window.innerHeight;
let mcw = mcan.width;
let mch = mcan.height;
let eventGUIsDiv = document.getElementById("eventguisdiv");
let mousePos = {x: 0, y: 0};

class Event{
    constructor(x, y, isNew){
        this.x = x;
        this.y = y;
        let GUI = document.createElement("p");
        GUI.className = "event";
        GUI.innerText = "event";
        GUI.style.left = ""+x+"px";
        GUI.style.top = ""+y+"px";
        eventGUIsDiv.appendChild(GUI);
        this.GUI = GUI;
        this.GUI.contentEditable = "false";
        this.dragging = isNew;
        this.clickPos = {x: 0, y: 0};
        if (isNew) {
            events.push(this);
        }
        this.GUI.addEventListener("click", (event)=>{
            this.clickPos = {x: event.offsetX, y: event.offsetY};
            if (isNew) {
                if (this.GUI.contentEditable == "false") {
                    this.dragging = !this.dragging;
                }
            } else {
                let evnt = new Event(mch*0.025, mch*0.875, true);
                evnt.clickPos = this.clickPos;
            }
        });
        this.GUI.addEventListener("dblclick", ()=>{
            if (!this.dragging) {
                this.GUI.contentEditable = "true";
            }
        });
        this.GUI.addEventListener("", ()=>{
            console.log(0);
        });
    }
}
let events = [];
let eventNew = new Event(mch*0.025, mch*0.875, false);

function newCTButtonClicked(){
    homePage.style.display = "none";
    editPage.style.display = "block";
    drawingLoop();
}
newCTButton.addEventListener("click", newCTButtonClicked);

mcan.addEventListener("click", ()=>{
    events.forEach((evnt)=>{
        evnt.GUI.contentEditable = false;
    });
});

document.addEventListener("mousemove", (event)=>{
    events.forEach((evnt)=>{
        if (evnt.dragging) {
            evnt.GUI.style.left = ""+(event.x-evnt.clickPos.x-3.5)+"px";
            evnt.GUI.style.top = ""+(event.y-evnt.clickPos.y-3.5)+"px";
        }
    });
});

function drawingLoop(){

    requestAnimationFrame(drawingLoop);
}