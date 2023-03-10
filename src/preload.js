const { ipcRenderer, clipboard } = require('electron');

new MutationObserver(mutationRecords => {
    try {
        mutationRecords.forEach(record => {
            record.addedNodes.forEach(el => {
                if (el.id == "menu" || el.id == "play-section") {
                    if (!document.getElementById("closeClient")) {
                        let menuCont = document.querySelector("#social-links")
                        let closeClient = document.createElement("a")
                        closeClient.id = "closeClient";
                        closeClient.innerHTML = `<i aria-hidden="true" class="fa fa-times"></i>`
                        menuCont.appendChild(closeClient)
                        closeClient.onclick = () => {
                            ipcRenderer.send("exit")
                        }
                        console.log(closeClient)
                    }
                    if (!document.getElementById("JoinBtn")) {
                        let joinLink = document.createElement("div")
                        joinLink.innerHTML = `
                        <button class="invite-button" style="background:linear-gradient(to bottom, rgb(255,165,0), rgb(190,123,0)); border-left: solid 8px rgb(170,110,0)" id="JoinBtn">
                            <i aria-hidden="true" class="fa fa-link">
                        </i>Join Link</button>
                        `
                        let options = document.querySelector("#play-section > div.content-wrapper > div.options")

                        joinLink.onclick = () => {
                            if (clipboard.readText().includes("tribals.io")) { 
                                window.location.href = clipboard.readText() 
                            }  else {
                                alert('No valid link found on clipboard')
                            }
                        }
                        document.querySelector("#play-section > div.content-wrapper").appendChild(joinLink)
                        document.querySelector("#play-section > div.content-wrapper").appendChild(options)

                    }
                }
            })
        })
    } catch (error) {

    }
}).observe(document, { childList: true, subtree: true });