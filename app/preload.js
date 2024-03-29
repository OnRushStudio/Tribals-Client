const { ipcRenderer, clipboard } = require('electron');
const Store = require('electron-store')
const userPrefs = new Store()

var clientDiv
const settingsJson = require('./modules/settings.json')

document.addEventListener('DOMContentLoaded', () => {
    var staffMode = false;
    var flying = false;
    var flyStart = 0;
    var lastSpaceTime = 0;

    pc.app.keyboard.on('keydown', function (event) {
        if (event.key == pc.KEY_SPACE) {
            if (Date.now() - lastSpaceTime < 500) {
                lastSpaceTime = Date.now();
                if (staffMode && Date.now() - flyStart > 1000) {
                    toggleFly();
                }
            } else {
                lastSpaceTime = Date.now();
            }
        }

        if (event.key == pc.KEY_SHIFT && flying) {
            pc.Movement.speed = 2000;
        }
    });

    pc.app.keyboard.on('keyup', function (event) {
        if (event.key == pc.KEY_SHIFT && flying) {
            pc.Movement.speed = 1000;
        }
    });

    function toggleFly() {
        if (flying) {
            flying = false;
            pc.Movement.activeLadders.splice(pc.Movement.activeLadders.indexOf('staff'), 1);
            pc.Movement.speed = 230;
        } else {
            flying = true;
            pc.Movement.activeLadders.push('staff');
            if (pc.app.keyboard.isPressed(pc.KEY_SHIFT)) pc.Movement.speed = 2000
            else pc.Movement.speed = 1000;
            flyStart = Date.now();
        }
    }

    pc.app.on('NetworkManager:Send', function (data) {
        if (data[0] == 'chat') {

            if (data[1] == '/sm') {
                staffMode = !staffMode;
                if (!staffMode) {
                    if (flying) toggleFly();
                }
            }

        }
    });

    pc.app.on('Overlay:Chat', function (username, message, argument, sound) {
        if (username == 'Server') {
            if (message == 'Staff mode enabled.') {
                staffMode = true;
            }
            if (message == 'Staff mode disabled.') {
                staffMode = false;
                if (flying) toggleFly();
            }
        }
    });

    clientDiv = document.createElement('div');
    clientDiv.innerHTML = `
    <style>
        .sidebar-wrapper::before {
            content: "";
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background: rgba(0, 0, 0, 0.3);
            backdrop-filter: blur(5px);
            z-index: 4;
        }
        #sidebar {
            position: fixed;
            width: 22rem;
            height: 100vh;
            right: 0;
            top: 0;
            background: #101010;
            z-index: 5;
            color: white;
            text-align: center;
        }
        #sidebar label {
            cursor: pointer;
            position: absolute;
            left: 1rem;
            width: 100%;
            height: 100%;
            text-align: left;
        }
        .field-cont {
            font-size: 1.2rem;
            width: 22rem;
            align-items: center;
            padding-top: 1.5rem;
            height: 3rem;
        }
        .field-cont:hover {
            background: rgb(75, 138, 23);
        }
        .client-toggle {
            right: 1rem;
            position: absolute;
            cursor: pointer;
            filter: hue-rotate(260deg);
        }
    </style>
    <div id="sidebar">
        <div style="padding-bottom: 1.5rem; padding-top: 1.5rem; font-size: 1.5rem;"> Client Settings </div>
        <hr>
        <div id="clientContent"></div>
    </div>
    `;
    clientDiv.style.display = "none";
    clientDiv.classList.add('sidebar-wrapper')
    document.body.appendChild(clientDiv)

    Object.keys(settingsJson).forEach((setting) => {
        document.getElementById('clientContent').innerHTML += `
        <div class="field-cont">
            <label for="${setting}">${settingsJson[setting].text}</label>
            <input type="checkbox" id="${setting}" ${userPrefs.get(setting) ? 'checked' : ''} class="client-toggle" onclick=window.setSetting("${setting}")>
        </div>
        `
    })

    Object.keys(settingsJson).forEach((setting) => {
        document.getElementById(setting).onclick = () => {
            userPrefs.set(setting, document.getElementById(setting).checked)
        }
    })

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
                // console.log(node.id)
                if (node.id == "menu" || node.id == "play-section") {
                    if (!document.getElementById("closeClientBtn")) {
                        let menuCont = document.querySelector("#social-links");
                        let closeClient = document.createElement("a")
                        closeClient.id = "closeClientBtn";
                        closeClient.innerHTML = `<i aria-hidden="true" class="fa fa-times"></i>`
                        menuCont.appendChild(closeClient)
                        closeClient.onclick = () => {
                            ipcRenderer.send("exit")
                        }
                    }
                    if (!document.getElementById("JoinBtn")) {
                        let joinLink = document.createElement("div")
                        joinLink.innerHTML = `
                        <button class="invite-button" style="background:linear-gradient(to bottom, rgb(255,165,0), rgb(190,123,0)); border-left: solid 8px rgb(170,110,0)" id="JoinBtn">
                            <i aria-hidden="true" class="fa fa-link">
                        </i> Join Game</button>
                        `
                        let contDiv = document.querySelector("#play-section")
                        contDiv.insertBefore(joinLink, contDiv.children[1])
                        joinLink.onclick = () => {
                            if (!document.getElementById('linkDiv')) {
                                var linkDiv = document.createElement('div')
                                // linkDiv.id = "linkDiv";
                                linkDiv.innerHTML = `<div id="linkDiv"
                                style="align-items: center;width: 500px;height: 150px;background: #101010;color: white;position: absolute;top: 50%;left: 50%;padding: 10px;border-radius: 10px;transform: translate(-50%, -50%);">
                                <h2 style="text-align: center; align-self: center;">ENTER LINK TO JOIN</h2>
                                <input
                                    style="position: absolute;left: 6rem;background: transparent;border: 1px solid white;height: 1.5rem;width: 20rem;color: white;border-radius: 3px;"
                                    id="linkInput" type="text">
                                <button id="linkBtn" style="position: absolute;top: 80%;left: 50%;transform: translate(-50%, -50%);border: none;background: rgb(255,165,0);color: white;width: 10rem;padding: 0.5rem;cursor: pointer;">JOIN</button>
                                <i id="linkClose" class="fa fa-times" aria-hidden="true"
                                    style="position: fixed;top: 0.5rem;cursor: pointer;right: 0.75rem;"></i>
                            </div>`
                                document.body.appendChild(linkDiv)
                                document.getElementById('linkBtn').onclick = () => {
                                    if (document.getElementById('linkInput').value.includes("tribals.io")) {
                                        let link = clipboard.readText().split('#');
                                        let roomhash = link[1]

                                        window.localStorage.setItem('serverHash', roomhash);

                                        window.location.hash = roomhash;
                                        pc.app.fire('Scene:Load', 'CharacterCustomization');

                                        document.body.removeChild(linkDiv)
                                    }
                                }
                                document.getElementById('linkClose').onclick = () => {
                                    document.body.removeChild(linkDiv)
                                }
                            }
                        }
                    }
                }
            });
        });
    });

    observer.observe(document.documentElement, {
        childList: true,
        subtree: true
    });
})

window.setSetting = function (name) {
    console.log(name)
    var currentValue = userPrefs.get(name);
    userPrefs.set(name, !currentValue);
}

document.addEventListener('keydown', (e) => {
    if (e.code === "F7") {
        if (clientDiv.style.display === "none") {
            clientDiv.style.display = "block"
        } else {
            clientDiv.style.display = "none"
        }
    }
})

window._pc = false;
Object.defineProperty(window, "pc", {
    set(value) {
        if (!window.pc) {
            window._pc = value;
        }
    },
    get() {
        return (window._pc);
    }
});