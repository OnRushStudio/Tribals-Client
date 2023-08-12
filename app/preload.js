const { ipcRenderer, clipboard } = require('electron');
const Store = require('electron-store')
const userPrefs = new Store()

var clientDiv
const settingsJson = require('./modules/settings.json')

document.addEventListener('DOMContentLoaded', () => {
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
        label {
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
        }
    </style>
    <div id="sidebar">
    <div id="blur-cont"></div>
        <div style="padding-bottom: 1.5rem; padding-top: 1.5rem; font-size: 1.5rem;"> Client Settings </div>
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

    const observer = new MutationObserver((mutations) => {
        mutations.forEach((mutation) => {
            mutation.addedNodes.forEach((node) => {
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
                        </i> Join Link</button>
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
                                        window.location.href = clipboard.readText()
                                    }
                                }
                                document.getElementById('linkClose').onclick = () => {
                                    document.body.removeChild(linkDiv)
                                }
                            }
                            // if (clipboard.readText().includes("tribals.io")) {
                            //     window.location.href = clipboard.readText()
                            // } else {
                            //     alert('No valid link found on clipboard')
                            // }
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
